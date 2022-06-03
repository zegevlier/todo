import { Hono } from "hono";

export { Items } from "./item";

interface Env {
  ITEMS: DurableObjectNamespace;
}

const app = new Hono<Env>();
const api = app.route("/api");

api.get('/', async (c) => {
  return c.text('Alive!');
})

api.get("/:id", async (c) => {
  const id = c.env.ITEMS.idFromName(c.req.param("id"));
  const itemStub = await c.env.ITEMS.get(id);
  return itemStub.fetch(c.req as Request<string>);
});

api.get("/:id/*", async (c) => {
  const id = c.env.ITEMS.idFromName(c.req.param("id"));
  const itemStub = await c.env.ITEMS.get(id);
  return itemStub.fetch(c.req as Request<string>);
});

export default app;