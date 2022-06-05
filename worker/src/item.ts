import { Hono } from "hono";
import { nanoid, customAlphabet } from "nanoid";

type Item = {
    value: string;
    checked: boolean;
    id: string;
}

type Session = {
    ws: WebSocket;
    closed: boolean;
    id: string;
}

function isOkValue(value: string): boolean {
    // See if it machtes the regexp
    return /^[ \S]{1,250}$/.test(value);
}

export class Items {
    state: DurableObjectState;
    app = new Hono<Env>();
    items: Item[] = [];
    sessions: Session[] = [];
    env: Env;
    name: string | undefined;

    resyncClient(ws: WebSocket) {
        ws.send(JSON.stringify({
            type: 'set',
            data: this.items,
        }));
    }

    async broadcast(value: any) {
        this.sessions = this.sessions.filter(session => {
            try {
                session.ws.send(JSON.stringify(value));
                return true;
            }
            catch (error) {
                session.closed = true;
                console.log(`Session ${session.id} closed due to error: ${error}`);
                return false;
            }
        });
    }

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;

        this.state.blockConcurrencyWhile(async () => {
            this.items = await this.state.storage.get("value") || [];
            this.name = await this.state.storage.get("name") || undefined;
        });

        this.app.use('/api/*', async (c, next) => {
            // Add cors headers, should probably be turned off in production
            await next();
            if (c.res.headers.get('Access-Control-Allow-Origin') !== "*") {
                try {
                    c.res.headers.append('Access-Control-Allow-Origin', '*');
                    c.res.headers.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                } catch {
                    console.log("Error adding cors headers");
                }
            }
        });

        this.app.use("*", async (c, next) => {
            if (this.name || new URL(c.req.url).pathname.startsWith("/api/new")) {
                await next();
            } else {
                const upgradeHeader = c.req.headers.get('Upgrade');
                if (!upgradeHeader || upgradeHeader !== 'websocket') {
                    return c.json({ 'error': 'not found' }, 404);
                }
                const [clientWsConnection, ws] = Object.values(new WebSocketPair());
                ws.accept();
                ws.close(1000, "Not found");
                return new Response(null, {
                    status: 101,
                    webSocket: clientWsConnection,
                });
            }
        });

        const api = this.app.route("/api");

        api.post("/new", async (c) => {
            const data: any = await c.req.json();
            if (!data.name) {
                return c.json({ 'error': 'name is required' }, 400);
            }
            this.name = data.name;
            await this.state.storage.put("name", data.name);
            if (data.value) {
                this.items = data.value;
                await this.state.storage.put("value", data.value);
            }
            return c.json({ 'ok': true, 'id': data.id });
        });

        api.get("/:id/ws", async (c) => {
            const upgradeHeader = c.req.headers.get('Upgrade');
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                return c.text('Expected Upgrade: websocket', 426);
            }

            const [clientWsConnection, ws] = Object.values(new WebSocketPair());
            const session: Session = {
                ws: ws,
                closed: false,
                id: nanoid(),
            };
            // ws is the thing we need to use, clientWsConnection is the thing we send to the client
            ws.accept();

            ws.addEventListener('message', async (event) => {
                // Everything is JSON, otherwise the client is doing something wrong
                let message: any;
                try {
                    message = JSON.parse(event.data as string);
                } catch {
                    console.log('Client sent invalid JSON, bad client!');
                    session.closed = true;
                    session.ws.close(1002); // 1002 is a protocol error
                    return;
                }

                console.log(message);

                switch (message.type) {
                    case 'get': {
                        this.resyncClient(ws);
                        break;
                    }
                    case 'update': {
                        if (!message.data || !message.data.id) {
                            return;
                        }
                        let somethingChanged = false;
                        if (message.data.value) {
                            if (!isOkValue(message.data.value)) {
                                console.log('Client sent invalid value, bad client!');
                                // Shoud be validated on the client, so no need to send an error
                                return;
                            }
                            this.items = this.items.map(item => {
                                if (item.id === message.data.id) {
                                    return {
                                        ...item,
                                        value: message.data.value,
                                    };
                                }
                                return item;
                            });
                            somethingChanged = true;
                        }
                        if (message.data.checked || message.data.checked === false) {
                            this.items = this.items.map(item => {
                                if (item.id === message.data.id) {
                                    return {
                                        ...item,
                                        checked: message.data.checked,
                                    };
                                }
                                return item;
                            });
                            somethingChanged = true;
                        }
                        if (!somethingChanged) {
                            return;
                        }
                        this.state.storage.put("value", this.items)
                        this.broadcast({
                            'type': 'update', 'data': {
                                'id': message.data.id,
                                'value': message.data.value,
                                'checked': message.data.checked,
                            }
                        });
                        break;
                    }
                    case 'order': {
                        // Changes the order of the items, id goes from oldIdx to newIdx
                        // if id is not at oldIdx, send back set.
                        const oldIdx = this.items.findIndex(item => item.id === message.data.id);
                        if (oldIdx !== message.data.oldIdx) {
                            this.resyncClient(ws);
                            return;
                        }
                        const newValue = [...this.items];
                        const [removed] = newValue.splice(message.data.oldIdx, 1);
                        newValue.splice(message.data.newIdx, 0, removed);
                        this.items = newValue;
                        this.state.storage.put("value", this.items)

                        this.broadcast({
                            'type': 'order', 'data': {
                                id: message.data.id,
                                oldIdx: message.data.oldIdx,
                                newIdx: message.data.newIdx
                            }
                        });
                        break;
                    }
                    case 'add': {
                        if (!message.value || !isOkValue(message.value)) {
                            console.log('Client sent invalid value, bad client!');
                            return;
                        }
                        const id = await nanoid();
                        const newItem = {
                            'id': id,
                            'value': message.value,
                            'checked': false
                        };
                        this.items.push(newItem);
                        this.state.storage.put("value", this.items)
                        this.broadcast({
                            'type': 'add', 'data': newItem
                        });
                        break;
                    }
                    case 'remove': {
                        const item = this.items.find(t => t.id === message.id);
                        if (!item) {
                            this.resyncClient(ws);
                            return;
                        }
                        this.items = this.items.filter(t => t.id !== message.id);
                        this.state.storage.put("value", this.items)
                        this.broadcast({
                            'type': 'remove', 'data': item
                        });
                        break;
                    }
                }
            });

            ws.addEventListener('close', () => {
                console.log(`Session ${session.id} closed`);
                this.sessions = this.sessions.filter(tsession => tsession.id !== session.id);
            });

            ws.addEventListener('error', (error) => {
                console.log(`Session ${session.id} errored`, error);
                this.sessions = this.sessions.filter(tsession => tsession.id !== session.id);
            });

            this.sessions.push(session);

            return new Response(null, {
                status: 101,
                webSocket: clientWsConnection,
            });
        });

        api.post("/:id/export", async (c) => {
            const exportId = await nanoid();
            c.env.exports.put(exportId, JSON.stringify(this.items));
            return c.json({
                id: exportId,
            });
        });

        api.post("/:id/clone", async (c) => {
            console.log("Cloning");
            const cloneId = await customAlphabet("abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789")(10);
            console.log(cloneId);
            const stubId = c.env.items.idFromName(cloneId);
            const itemStub = await c.env.items.get(stubId);
            const newNameSuffix = " (clone)";
            const newName = this.name?.slice(0, 25 - newNameSuffix.length) + newNameSuffix;
            return itemStub.fetch("https://todo.note.autos/api/new", {
                method: "POST",
                body: JSON.stringify({
                    id: cloneId,
                    name: newName,
                    value: this.items,
                }),
            });
        });

        api.post("/:id/purge", async (c) => {
            this.items = [];
            this.state.storage.put("value", this.items)
            this.broadcast({
                'type': 'set',
                'data': this.items
            });
            return c.json({
                success: "ok"
            })
        });

        api.get('/:id', async (c) => {
            return c.json({
                'name': this.name,
                'items': this.items,
            });
        });
    }

    async fetch(request: Request) {
        return this.app.fetch(request, this.env);
    }

}