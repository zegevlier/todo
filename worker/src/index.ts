import { Hono } from "hono";

export { Items } from "./item";

const app = new Hono<Env>();
const api = app.route("/api");

api.get('/', async (c) => {
  return c.text('Alive!');
})

api.use("/export/*", async (c, next) => {
  // Add cors headers, should probably be turned off in production
  await next();
  c.res.headers.append('Access-Control-Allow-Origin', '*');
});

api.get("/export/:id2", async (c) => {
  const id = c.req.param('id2');
  const item = await c.env.exports.get(id);
  if (!item) {
    return c.json({ 'error': 'not found' }, 404);
  } else {
    return c.json({
      id: id,
      data: JSON.parse(item),
    });
  }
});

api.get("/:id", async (c) => {
  const id = c.env.items.idFromName(c.req.param("id"));
  const itemStub = await c.env.items.get(id);
  return itemStub.fetch(c.req as Request<string>);
});

api.get("/:id/*", async (c) => {
  const id = c.env.items.idFromName(c.req.param("id"));
  const itemStub = await c.env.items.get(id);
  return itemStub.fetch(c.req as Request<string>);
});

export default app;