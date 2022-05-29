import { Hono } from "hono";

export { Todos as Todo } from "./todo";

interface Env {
  TODO: DurableObjectNamespace;
}

const app = new Hono<Env>();
const api = app.route("/api");

api.get('/', async (c) => {
  return c.text('Alive!');
})

api.get("/:id", async (c) => {
  const id = c.env.TODO.idFromName(c.req.param("id"));
  const todo = await c.env.TODO.get(id);
  return todo.fetch(c.req as Request<string>);
});

api.get("/:id/*", async (c) => {
  const id = c.env.TODO.idFromName(c.req.param("id"));
  const todo = await c.env.TODO.get(id);
  return todo.fetch(c.req as Request<string>);
});

export default app;