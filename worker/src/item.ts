import { Hono } from "hono";
import { nanoid } from "nanoid";

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

export class Items {
    state: DurableObjectState;
    app: Hono = new Hono();
    value: Item[] = [];
    sessions: Session[] = [];

    resyncClient(ws: WebSocket) {
        ws.send(JSON.stringify({
            type: 'set',
            data: this.value,
        }));
    }

    async broadcast(value: any, dontSendTo: Session | null = null) {
        this.sessions = this.sessions.filter(session => {
            if (session.id === dontSendTo?.id) {
                // Just don't send it to this one, we can keep it open
                return true;
            }
            try {
                session.ws.send(JSON.stringify(value));
                return true;
            }
            catch (error) {
                session.closed = true;
                return false;
            }
        });
    }

    constructor(state: DurableObjectState) {
        this.state = state;

        this.state.blockConcurrencyWhile(async () => {
            this.value = await this.state.storage.get("value") || [];
        });

        this.app.use('/api/*', async (c, next) => {
            // Add cors headers, then continue
            await next();
            c.res.headers.append('Access-Control-Allow-Origin', '*');
            c.res.headers.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        });
        const api = this.app.route("/api");

        api.get("/:id/ws", async (c) => {
            const upgradeHeader = c.req.headers.get('Upgrade');
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                return c.text('Expected Upgrade: websocket', 426);
            }

            const [client, server] = Object.values(new WebSocketPair());
            const session: Session = {
                ws: server,
                closed: false,
                id: nanoid(),
            };
            server.accept();

            server.addEventListener('message', async (event) => {
                const message = JSON.parse(event.data as string);
                console.log(message);
                if (message.type === 'get') {
                    this.resyncClient(server);
                }
                if (message.type === 'update') {
                    const newValue = this.value.map(item => item.id === message.data.id ? { ...item, ...message.data } : item);
                    if (newValue === this.value) {
                        // The client is probably desynced
                        this.resyncClient(server);
                        return;
                    }
                    this.value = newValue;
                    await this.state.storage.put("value", this.value);
                    this.broadcast({
                        'type': 'update', 'data': message.data
                    });
                }
                if (message.type === 'order') {
                    // Changes the order of the items, id goes from oldIdx to newIdx
                    // if id is not at oldIdx, send back set.
                    const oldIdx = this.value.findIndex(item => item.id === message.data.id);
                    if (oldIdx !== message.data.oldIdx) {
                        this.resyncClient(server);
                        return;
                    }
                    const newValue = [...this.value];
                    const [removed] = newValue.splice(message.data.oldIdx, 1);
                    newValue.splice(message.data.newIdx, 0, removed);
                    this.value = newValue;
                    await this.state.storage.put("value", this.value);

                    this.broadcast({
                        'type': 'order', 'data': {
                            id: message.data.id,
                            oldIdx: message.data.oldIdx,
                            newIdx: message.data.newIdx
                        }
                    });
                }
                if (message.type === 'add') {
                    const id = await nanoid();
                    const newItem = {
                        'id': id,
                        'value': message.value,
                        'checked': false
                    };
                    this.value.push(newItem);
                    await this.state.storage.put("value", this.value);
                    this.broadcast({
                        'type': 'add', 'data': newItem
                    });
                }
                if (message.type === 'remove') {
                    const item = this.value.find(t => t.id === message.id);
                    if (!item) {
                        this.resyncClient(server);
                        return;
                    }
                    this.value = this.value.filter(t => t.id !== message.id);
                    await this.state.storage.put("value", this.value);
                    this.broadcast({
                        'type': 'remove', 'data': item
                    });
                }

            });

            server.addEventListener('close', () => {
                console.log('connection closed');
                this.sessions = this.sessions.filter(tsession => tsession.id !== session.id);
            });

            server.addEventListener('error', (error) => {
                console.log('connection error', error);
                this.sessions = this.sessions.filter(tsession => tsession.id !== session.id);
            });

            this.sessions.push(session);

            return new Response(null, {
                status: 101,
                webSocket: client,
            });
        });

        api.get('/:id', async (c) => {
            return c.json(this.value);
        });
    }

    async fetch(request: Request) {
        return this.app.fetch(request);
    }

}