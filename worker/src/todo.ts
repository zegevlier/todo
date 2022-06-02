import { Hono } from "hono";
import { nanoid } from "nanoid";

type Todo = {
    value: string;
    checked: boolean;
    id: string;
}

type Session = {
    ws: WebSocket;
    closed: boolean;
    id: string;
}

export class Todos {
    state: DurableObjectState;
    app: Hono = new Hono();
    value: Todo[] = [];
    sessions: Session[] = [];

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
                    server.send(JSON.stringify({
                        type: 'set',
                        data: this.value
                    }));
                }
                if (message.type === 'update') {
                    this.value = this.value.map(todo => todo.id === message.data.id ? { ...todo, ...message.data } : todo);
                    await this.state.storage.put("value", this.value);
                    this.broadcast({
                        'type': 'update', 'data': message.data
                    });
                }
                if (message.type === 'add') {
                    const id = await nanoid();
                    const todo = {
                        'id': id,
                        'value': message.value,
                        'checked': false
                    };
                    this.value.push(todo);
                    await this.state.storage.put("value", this.value);
                    this.broadcast({
                        'type': 'add', 'data': todo
                    });
                }
                if (message.type === 'remove') {
                    const todo = this.value.find(t => t.id === message.id);
                    if (todo) {
                        this.value = this.value.filter(t => t.id !== message.id);
                        await this.state.storage.put("value", this.value);
                        this.broadcast({
                            'type': 'remove', 'data': todo
                        });
                    }
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

        api.get('/:id/seed', async (c) => {
            const id = c.req.param('id');

            this.value = [
                { value: "Hello", checked: false, id: nanoid() },
                { value: "World", checked: true, id: nanoid() },
            ];

            c.event?.waitUntil(this.state.storage.put("value", this.value));

            return c.json(this.value);
        })
    }

    async fetch(request: Request) {
        return this.app.fetch(request);
    }

}