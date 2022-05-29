var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));

// node_modules/hono/dist/response.js
var require_response = __commonJS({
  "node_modules/hono/dist/response.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HonoResponse = void 0;
    var errorMessage = "Response is not finalized";
    var HonoResponse = class {
      constructor(_data, init) {
        var _a;
        this.headers = new Headers(init.headers);
        this.status = (_a = init.status) !== null && _a !== void 0 ? _a : 404;
        this._finalized = false;
      }
      clone() {
        throw new Error(errorMessage);
      }
      arrayBuffer() {
        throw new Error(errorMessage);
      }
      blob() {
        throw new Error(errorMessage);
      }
      formData() {
        throw new Error(errorMessage);
      }
      json() {
        throw new Error(errorMessage);
      }
      text() {
        throw new Error(errorMessage);
      }
    };
    exports.HonoResponse = HonoResponse;
  }
});

// node_modules/hono/dist/utils/url.js
var require_url = __commonJS({
  "node_modules/hono/dist/utils/url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergePath = exports.isAbsoluteURL = exports.getPathFromURL = exports.getPattern = exports.splitPath = void 0;
    var URL_REGEXP = /^https?:\/\/[a-zA-Z0-9\-\.:]+(\/?[^?#]*)/;
    var splitPath = (path) => {
      const paths = path.split(/\//);
      if (paths[0] === "") {
        paths.shift();
      }
      return paths;
    };
    exports.splitPath = splitPath;
    var patternCache = {};
    var getPattern = (label) => {
      if (label === "*") {
        return "*";
      }
      const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      if (match) {
        if (!patternCache[label]) {
          if (match[2]) {
            patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
          } else {
            patternCache[label] = [label, match[1], true];
          }
        }
        return patternCache[label];
      }
      return null;
    };
    exports.getPattern = getPattern;
    var getPathFromURL = (url, params = { strict: true }) => {
      if (params.strict === false && url.endsWith("/")) {
        url = url.slice(0, -1);
      }
      const match = url.match(URL_REGEXP);
      if (match) {
        return match[1];
      }
      return "";
    };
    exports.getPathFromURL = getPathFromURL;
    var isAbsoluteURL = (url) => {
      const match = url.match(URL_REGEXP);
      if (match) {
        return true;
      }
      return false;
    };
    exports.isAbsoluteURL = isAbsoluteURL;
    var mergePath = (...paths) => {
      let p = "";
      let endsWithSlash = false;
      for (let path of paths) {
        if (p.endsWith("/")) {
          p = p.slice(0, -1);
          endsWithSlash = true;
        }
        if (!path.startsWith("/")) {
          path = `/${path}`;
        }
        if (path === "/" && endsWithSlash) {
          p = `${p}/`;
        } else if (path !== "/") {
          p = `${p}${path}`;
        }
        if (path === "/" && p === "") {
          p = "/";
        }
      }
      return p;
    };
    exports.mergePath = mergePath;
  }
});

// node_modules/hono/dist/context.js
var require_context = __commonJS({
  "node_modules/hono/dist/context.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Context = void 0;
    var response_1 = require_response();
    var url_1 = require_url();
    var Context = class {
      constructor(req, opts = {
        env: {},
        event: void 0,
        res: void 0
      }) {
        this._status = 200;
        this._pretty = false;
        this._prettySpace = 2;
        this.req = this.initRequest(req);
        this._map = {};
        Object.assign(this, opts);
        if (!this.res) {
          const res = new response_1.HonoResponse(null, { status: 404 });
          res._finalized = false;
          this.res = res;
        }
      }
      initRequest(req) {
        req.header = (name) => {
          if (name) {
            return req.headers.get(name);
          } else {
            const result = {};
            for (const [key, value] of req.headers) {
              result[key] = value;
            }
            return result;
          }
        };
        req.query = (key) => {
          const url = new URL(req.url);
          if (key) {
            return url.searchParams.get(key);
          } else {
            const result = {};
            for (const key2 of url.searchParams.keys()) {
              result[key2] = url.searchParams.get(key2) || "";
            }
            return result;
          }
        };
        req.queries = (key) => {
          const url = new URL(req.url);
          if (key) {
            return url.searchParams.getAll(key);
          } else {
            const result = {};
            for (const key2 of url.searchParams.keys()) {
              result[key2] = url.searchParams.getAll(key2);
            }
            return result;
          }
        };
        return req;
      }
      header(name, value) {
        this.res.headers.set(name, value);
      }
      status(status) {
        this._status = status;
      }
      set(key, value) {
        this._map[key] = value;
      }
      get(key) {
        return this._map[key];
      }
      pretty(prettyJSON, space = 2) {
        this._pretty = prettyJSON;
        this._prettySpace = space;
      }
      newResponse(data, init = {}) {
        init.status = init.status || this._status || 200;
        const headers = {};
        this.res.headers.forEach((v, k) => {
          headers[k] = v;
        });
        init.headers = Object.assign(headers, init.headers);
        return new Response(data, init);
      }
      body(data, status = this._status, headers = {}) {
        return this.newResponse(data, {
          status,
          headers
        });
      }
      text(text, status = this._status, headers = {}) {
        if (typeof text !== "string") {
          throw new TypeError("text method arg must be a string!");
        }
        headers["Content-Type"] || (headers["Content-Type"] = "text/plain; charset=UTF-8");
        return this.body(text, status, headers);
      }
      json(object, status = this._status, headers = {}) {
        if (typeof object !== "object") {
          throw new TypeError("json method arg must be an object!");
        }
        const body = this._pretty ? JSON.stringify(object, null, this._prettySpace) : JSON.stringify(object);
        headers["Content-Type"] || (headers["Content-Type"] = "application/json; charset=UTF-8");
        return this.body(body, status, headers);
      }
      html(html, status = this._status, headers = {}) {
        if (typeof html !== "string") {
          throw new TypeError("html method arg must be a string!");
        }
        headers["Content-Type"] || (headers["Content-Type"] = "text/html; charset=UTF-8");
        return this.body(html, status, headers);
      }
      redirect(location, status = 302) {
        if (typeof location !== "string") {
          throw new TypeError("location must be a string!");
        }
        if (!(0, url_1.isAbsoluteURL)(location)) {
          const url = new URL(this.req.url);
          url.pathname = location;
          location = url.toString();
        }
        return this.newResponse(null, {
          status,
          headers: {
            Location: location
          }
        });
      }
    };
    exports.Context = Context;
  }
});

// node_modules/hono/dist/compose.js
var require_compose = __commonJS({
  "node_modules/hono/dist/compose.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compose = void 0;
    var context_1 = require_context();
    var compose = (middleware, onError, onNotFound) => {
      return async (context, next) => {
        let index = -1;
        return dispatch(0);
        async function dispatch(i) {
          if (i <= index) {
            return Promise.reject(new Error("next() called multiple times"));
          }
          let handler = middleware[i];
          index = i;
          if (i === middleware.length && next)
            handler = next;
          if (!handler) {
            if (context instanceof context_1.Context && context.res._finalized === false && onNotFound) {
              context.res = onNotFound(context);
              context.res._finalized = true;
            }
            return Promise.resolve(context);
          }
          return Promise.resolve(handler(context, dispatch.bind(null, i + 1))).then(async (res) => {
            if (res && context instanceof context_1.Context) {
              context.res = res;
              context.res._finalized = true;
            }
            return context;
          }).catch((err) => {
            if (context instanceof context_1.Context && onError) {
              if (err instanceof Error) {
                context.res = onError(err, context);
                context.res._finalized = true;
              }
              return context;
            } else {
              throw err;
            }
          });
        }
      };
    };
    exports.compose = compose;
  }
});

// node_modules/hono/dist/router.js
var require_router = __commonJS({
  "node_modules/hono/dist/router.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.METHOD_NAME_ALL_LOWERCASE = exports.METHOD_NAME_ALL = void 0;
    exports.METHOD_NAME_ALL = "ALL";
    exports.METHOD_NAME_ALL_LOWERCASE = "all";
  }
});

// node_modules/hono/dist/router/trie-router/node.js
var require_node = __commonJS({
  "node_modules/hono/dist/router/trie-router/node.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Node = void 0;
    var router_1 = require_router();
    var url_1 = require_url();
    function findParam(node, name) {
      for (let i = 0, len = node.patterns.length; i < len; i++) {
        if (typeof node.patterns[i] === "object" && node.patterns[i][1] === name) {
          return true;
        }
      }
      const nodes = Object.values(node.children);
      for (let i = 0, len = nodes.length; i < len; i++) {
        if (findParam(nodes[i], name)) {
          return true;
        }
      }
      return false;
    }
    var Node = class {
      constructor(method, handler, children) {
        this.order = 0;
        this.children = children || {};
        this.methods = [];
        if (method && handler) {
          const m = {};
          m[method] = { handler, score: 0, name: this.name };
          this.methods = [m];
        }
        this.patterns = [];
      }
      insert(method, path, handler) {
        this.name = `${method} ${path}`;
        this.order = ++this.order;
        let curNode = this;
        const parts = (0, url_1.splitPath)(path);
        const parentPatterns = [];
        const errorMessage = (name) => {
          return `Duplicate param name, use another name instead of '${name}' - ${method} ${path} <--- '${name}'`;
        };
        for (let i = 0, len = parts.length; i < len; i++) {
          const p = parts[i];
          if (Object.keys(curNode.children).includes(p)) {
            parentPatterns.push(...curNode.patterns);
            curNode = curNode.children[p];
            continue;
          }
          curNode.children[p] = new Node();
          const pattern = (0, url_1.getPattern)(p);
          if (pattern) {
            if (typeof pattern === "object") {
              for (let j = 0, len2 = parentPatterns.length; j < len2; j++) {
                if (typeof parentPatterns[j] === "object" && parentPatterns[j][1] === pattern[1]) {
                  throw new Error(errorMessage(pattern[1]));
                }
              }
              if (Object.values(curNode.children).some((n) => findParam(n, pattern[1]))) {
                throw new Error(errorMessage(pattern[1]));
              }
            }
            curNode.patterns.push(pattern);
            parentPatterns.push(...curNode.patterns);
          }
          parentPatterns.push(...curNode.patterns);
          curNode = curNode.children[p];
        }
        let score = 1;
        if (path === "*") {
          score = score + this.order * 0.01;
        } else {
          score = parts.length + this.order * 0.01;
        }
        if (!curNode.methods.length) {
          curNode.methods = [];
        }
        const m = {};
        const handlerSet = { handler, name: this.name, score };
        m[method] = handlerSet;
        curNode.methods.push(m);
        return curNode;
      }
      getHandlerSets(node, method, wildcard) {
        const handlerSets = [];
        node.methods.map((m) => {
          const handlerSet = m[method] || m[router_1.METHOD_NAME_ALL];
          if (handlerSet !== void 0) {
            const hs = Object.assign({}, handlerSet);
            if (wildcard) {
              hs.score = handlerSet.score - 1;
            }
            handlerSets.push(hs);
            return;
          }
        });
        return handlerSets;
      }
      next(node, part, method, isLast) {
        const handlerSets = [];
        const nextNodes = [];
        const params = {};
        for (let j = 0, len = node.patterns.length; j < len; j++) {
          const pattern = node.patterns[j];
          if (pattern === "*") {
            const astNode = node.children["*"];
            if (astNode) {
              handlerSets.push(...this.getHandlerSets(astNode, method));
              nextNodes.push(astNode);
            }
          }
          if (part === "")
            continue;
          const [key, name, matcher] = pattern;
          if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
            if (typeof key === "string") {
              if (isLast === true) {
                handlerSets.push(...this.getHandlerSets(node.children[key], method));
              }
              nextNodes.push(node.children[key]);
            }
            if (typeof name === "string") {
              params[name] = part;
            }
          }
        }
        const nextNode = node.children[part];
        if (nextNode) {
          if (isLast === true) {
            if (nextNode.children["*"]) {
              handlerSets.push(...this.getHandlerSets(nextNode.children["*"], method, true));
            }
            handlerSets.push(...this.getHandlerSets(nextNode, method));
          }
          nextNodes.push(nextNode);
        }
        const next = {
          nodes: nextNodes,
          handlerSets,
          params
        };
        return next;
      }
      search(method, path) {
        const handlerSets = [];
        let params = {};
        const curNode = this;
        let curNodes = [curNode];
        const parts = (0, url_1.splitPath)(path);
        for (let i = 0, len = parts.length; i < len; i++) {
          const p = parts[i];
          const isLast = i === len - 1;
          const tempNodes = [];
          for (let j = 0, len2 = curNodes.length; j < len2; j++) {
            const res = this.next(curNodes[j], p, method, isLast);
            if (res.nodes.length === 0) {
              continue;
            }
            handlerSets.push(...res.handlerSets);
            params = Object.assign(params, res.params);
            tempNodes.push(...res.nodes);
          }
          curNodes = tempNodes;
        }
        if (handlerSets.length <= 0)
          return null;
        const handlers = handlerSets.sort((a, b) => {
          return a.score - b.score;
        }).map((s) => {
          return s.handler;
        });
        return { handlers, params };
      }
    };
    exports.Node = Node;
  }
});

// node_modules/hono/dist/router/trie-router/router.js
var require_router2 = __commonJS({
  "node_modules/hono/dist/router/trie-router/router.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TrieRouter = void 0;
    var node_1 = require_node();
    var TrieRouter = class {
      constructor() {
        this.node = new node_1.Node();
      }
      add(method, path, handler) {
        this.node.insert(method, path, handler);
      }
      match(method, path) {
        return this.node.search(method, path);
      }
    };
    exports.TrieRouter = TrieRouter;
  }
});

// node_modules/hono/dist/router/trie-router/index.js
var require_trie_router = __commonJS({
  "node_modules/hono/dist/router/trie-router/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TrieRouter = void 0;
    var router_1 = require_router2();
    Object.defineProperty(exports, "TrieRouter", { enumerable: true, get: function() {
      return router_1.TrieRouter;
    } });
  }
});

// node_modules/hono/dist/hono.js
var require_hono = __commonJS({
  "node_modules/hono/dist/hono.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Hono = void 0;
    var compose_1 = require_compose();
    var context_1 = require_context();
    var router_1 = require_router();
    var trie_router_1 = require_trie_router();
    var url_1 = require_url();
    var methods = ["get", "post", "put", "delete", "head", "options", "patch"];
    function defineDynamicClass() {
      return class {
      };
    }
    var Hono3 = class extends defineDynamicClass() {
      constructor(init = {}) {
        super();
        this.router = new trie_router_1.TrieRouter();
        this.strict = true;
        this._tempPath = "";
        this.path = "/";
        this.routes = [];
        this.notFoundHandler = (c) => {
          const message = "404 Not Found";
          return c.text(message, 404);
        };
        this.errorHandler = (err, c) => {
          console.error(`${err.stack || err.message}`);
          const message = "Internal Server Error";
          return c.text(message, 500);
        };
        const allMethods = [...methods, router_1.METHOD_NAME_ALL_LOWERCASE];
        allMethods.map((method) => {
          this[method] = (args1, ...args) => {
            if (typeof args1 === "string") {
              this.path = args1;
            } else {
              this.addRoute(method, this.path, args1);
            }
            args.map((handler) => {
              if (typeof handler !== "string") {
                this.addRoute(method, this.path, handler);
              }
            });
            return this;
          };
        });
        Object.assign(this, init);
      }
      route(path, app2) {
        this._tempPath = path;
        if (app2) {
          app2.routes.map((r) => {
            this.addRoute(r.method, r.path, r.handler);
          });
          this._tempPath = "";
        }
        return this;
      }
      use(arg1, ...handlers) {
        if (typeof arg1 === "string") {
          this.path = arg1;
        } else {
          handlers.unshift(arg1);
        }
        handlers.map((handler) => {
          this.addRoute(router_1.METHOD_NAME_ALL, this.path, handler);
        });
        return this;
      }
      onError(handler) {
        this.errorHandler = handler;
        return this;
      }
      notFound(handler) {
        this.notFoundHandler = handler;
        return this;
      }
      addRoute(method, path, handler) {
        method = method.toUpperCase();
        if (this._tempPath) {
          path = (0, url_1.mergePath)(this._tempPath, path);
        }
        this.router.add(method, path, handler);
        const r = { path, method, handler };
        this.routes.push(r);
      }
      async matchRoute(method, path) {
        return this.router.match(method, path);
      }
      async dispatch(request, event, env) {
        const path = (0, url_1.getPathFromURL)(request.url, { strict: this.strict });
        const method = request.method;
        const result = await this.matchRoute(method, path);
        request.param = (key) => {
          if (result) {
            if (key) {
              return result.params[key];
            } else {
              return result.params;
            }
          }
          return null;
        };
        const handlers = result ? result.handlers : [this.notFoundHandler];
        const c = new context_1.Context(request, {
          env,
          event
        });
        c.notFound = () => this.notFoundHandler(c);
        const composed = (0, compose_1.compose)(handlers, this.errorHandler, this.notFoundHandler);
        let context;
        try {
          context = await composed(c);
        } catch (err) {
          if (err instanceof Error) {
            return this.errorHandler(err, c);
          }
          throw err;
        }
        if (!context.res)
          return context.notFound();
        return context.res;
      }
      async handleEvent(event) {
        return this.dispatch(event.request, event);
      }
      async fetch(request, env, event) {
        return this.dispatch(request, event, env);
      }
      request(input, requestInit) {
        const req = input instanceof Request ? input : new Request(input, requestInit);
        return this.dispatch(req);
      }
      fire() {
        addEventListener("fetch", (event) => {
          event.respondWith(this.handleEvent(event));
        });
      }
    };
    exports.Hono = Hono3;
  }
});

// node_modules/hono/dist/index.js
var require_dist = __commonJS({
  "node_modules/hono/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Context = exports.Hono = void 0;
    var hono_1 = require_hono();
    Object.defineProperty(exports, "Hono", { enumerable: true, get: function() {
      return hono_1.Hono;
    } });
    var context_1 = require_context();
    Object.defineProperty(exports, "Context", { enumerable: true, get: function() {
      return context_1.Context;
    } });
  }
});

// src/index.ts
var import_hono2 = __toESM(require_dist());

// src/todo.ts
var import_hono = __toESM(require_dist());

// node_modules/nanoid/index.browser.js
var nanoid = (size = 21) => crypto.getRandomValues(new Uint8Array(size)).reduce((id, byte) => {
  byte &= 63;
  if (byte < 36) {
    id += byte.toString(36);
  } else if (byte < 62) {
    id += (byte - 26).toString(36).toUpperCase();
  } else if (byte > 62) {
    id += "-";
  } else {
    id += "_";
  }
  return id;
}, "");

// src/todo.ts
var Todos = class {
  state;
  app = new import_hono.Hono();
  value = [];
  sessions = [];
  async broadcast(value) {
    this.sessions = this.sessions.filter((session) => {
      try {
        session.ws.send(JSON.stringify(value));
        return true;
      } catch (error) {
        session.closed = true;
        return false;
      }
    });
  }
  constructor(state) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      this.value = await this.state.storage.get("value") || [];
    });
    this.app.use("/api/*", async (c, next) => {
      await next();
      c.res.headers.append("Access-Control-Allow-Origin", "*");
      c.res.headers.append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    });
    const api2 = this.app.route("/api");
    api2.get("/:id/ws", async (c) => {
      const upgradeHeader = c.req.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return c.text("Expected Upgrade: websocket", 426);
      }
      const [client, server] = Object.values(new WebSocketPair());
      const session = {
        ws: client,
        closed: false,
        id: nanoid()
      };
      server.accept();
      server.addEventListener("message", async (event) => {
        const message = JSON.parse(event.data);
        console.log(message);
        if (message.type === "get") {
          server.send(JSON.stringify({
            type: "set",
            data: this.value
          }));
        }
        if (message.type === "update") {
          this.value = this.value.map((todo) => todo.id === message.data.id ? { ...todo, ...message.data } : todo);
          await this.state.storage.put("value", this.value);
          this.broadcast({
            "type": "update",
            "data": message.data
          });
        }
        if (message.type === "add") {
          const id = await nanoid();
          const todo = {
            "id": id,
            "value": message.value,
            "checked": false
          };
          this.value.push(todo);
          await this.state.storage.put("value", this.value);
          this.broadcast({
            "type": "add",
            "data": todo
          });
        }
        if (message.type === "remove") {
          const todo = this.value.find((t) => t.id === message.id);
          if (todo) {
            this.value = this.value.filter((t) => t.id !== message.id);
            await this.state.storage.put("value", this.value);
            this.broadcast({
              "type": "remove",
              "data": todo
            });
          }
        }
      });
      server.addEventListener("close", () => {
        console.log("connection closed");
        this.sessions = this.sessions.filter((tsession) => tsession.id !== session.id);
      });
      server.addEventListener("error", (error) => {
        console.log("connection error", error);
        this.sessions = this.sessions.filter((tsession) => tsession.id !== session.id);
      });
      this.sessions.push(session);
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    });
    api2.get("/:id", async (c) => {
      return c.json(this.value);
    });
    api2.get("/:id/seed", async (c) => {
      const id = c.req.param("id");
      this.value = [
        { value: "Hello", checked: false, id: nanoid() },
        { value: "World", checked: true, id: nanoid() }
      ];
      c.event?.waitUntil(this.state.storage.put("value", this.value));
      return c.json(this.value);
    });
  }
  async fetch(request) {
    return this.app.fetch(request);
  }
};

// src/index.ts
var app = new import_hono2.Hono();
var api = app.route("/api");
api.get("/", async (c) => {
  return c.text("Alive!");
});
api.get("/:id", async (c) => {
  const id = c.env.TODO.idFromName(c.req.param("id"));
  const todo = await c.env.TODO.get(id);
  return todo.fetch(c.req);
});
api.get("/:id/*", async (c) => {
  const id = c.env.TODO.idFromName(c.req.param("id"));
  const todo = await c.env.TODO.get(id);
  return todo.fetch(c.req);
});
var src_default = app;
export {
  Todos as Todo,
  src_default as default
};
//# sourceMappingURL=index.mjs.map
