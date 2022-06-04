import { Hono } from "hono";
import { customAlphabet } from "nanoid";

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

api.post("/new", async (c) => {
  console.log("New list request");
  const data: any = await c.req.json();
  if (!data.name || data.name.length < 3 || data.name.length > 25) {
    return c.json({ 'error': 'name should be between 3 and 25 characters' }, 400);
  }
  const name = data.name;
  const id = customAlphabet("abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789")(10);
  const stubId = c.env.items.idFromName(id);
  const itemStub = await c.env.items.get(stubId);
  return itemStub.fetch("https://do.fake/api/new", {
    method: "POST",
    body: JSON.stringify({
      id: id,
      name: name,
    }),
  });
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