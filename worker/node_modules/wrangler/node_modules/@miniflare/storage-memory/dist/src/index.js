var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// packages/storage-memory/src/index.ts
__export(exports, {
  LocalStorage: () => LocalStorage,
  MemoryStorage: () => MemoryStorage,
  cloneMetadata: () => cloneMetadata,
  listFilterMatch: () => listFilterMatch,
  listPaginate: () => listPaginate
});

// packages/storage-memory/src/helpers.ts
var import_shared = __toModule(require("@miniflare/shared"));
function cloneMetadata(metadata) {
  return metadata && (0, import_shared.nonCircularClone)(metadata);
}
var collator = new Intl.Collator();
function listFilterMatch(options, name) {
  return !(options?.prefix && !name.startsWith(options.prefix) || options?.start && collator.compare(name, options.start) < 0 || options?.end && collator.compare(name, options.end) >= 0);
}
function listPaginate(options, keys) {
  const direction = options?.reverse ? -1 : 1;
  keys.sort((a, b) => direction * collator.compare(a.name, b.name));
  const startAfter = options?.cursor ? (0, import_shared.base64Decode)(options.cursor) : "";
  let startIndex = 0;
  if (startAfter !== "") {
    startIndex = keys.findIndex(({ name }) => name === startAfter);
    if (startIndex === -1)
      startIndex = keys.length;
    startIndex++;
  }
  const endIndex = options?.limit === void 0 ? keys.length : startIndex + options.limit;
  const nextCursor = endIndex < keys.length ? (0, import_shared.base64Encode)(keys[endIndex - 1].name) : "";
  keys = keys.slice(startIndex, endIndex);
  return { keys, cursor: nextCursor };
}

// packages/storage-memory/src/local.ts
var import_shared2 = __toModule(require("@miniflare/shared"));
var LocalStorage = class extends import_shared2.Storage {
  constructor(clock = import_shared2.defaultClock) {
    super();
    this.clock = clock;
  }
  expired({ expiration }, time = this.clock()) {
    return expiration !== void 0 && expiration <= (0, import_shared2.millisToSeconds)(time);
  }
  async has(key) {
    const stored = await this.hasMaybeExpired(key);
    if (stored === void 0)
      return false;
    if (this.expired(stored)) {
      await this.deleteMaybeExpired(key);
      return false;
    }
    return true;
  }
  async get(key) {
    const stored = await this.getMaybeExpired(key);
    if (stored === void 0)
      return void 0;
    if (this.expired(stored)) {
      await this.deleteMaybeExpired(key);
      return void 0;
    }
    return stored;
  }
  async delete(key) {
    const stored = await this.hasMaybeExpired(key);
    const expired = stored !== void 0 && this.expired(stored);
    const deleted = await this.deleteMaybeExpired(key);
    if (!deleted)
      return false;
    return !expired;
  }
  async list(options) {
    const time = this.clock();
    const deletePromises = [];
    let keys = await this.listAllMaybeExpired();
    keys = keys.filter((stored) => {
      if (this.expired(stored, time)) {
        deletePromises.push(this.deleteMaybeExpired(stored.name));
        return false;
      }
      return listFilterMatch(options, stored.name);
    });
    const res = listPaginate(options, keys);
    await Promise.all(deletePromises);
    return res;
  }
};

// packages/storage-memory/src/memory.ts
var import_shared3 = __toModule(require("@miniflare/shared"));
var MemoryStorage = class extends LocalStorage {
  constructor(map = new Map(), clock = import_shared3.defaultClock) {
    super(clock);
    this.map = map;
  }
  hasMaybeExpired(key) {
    const stored = this.map.get(key);
    return stored && {
      expiration: stored.expiration,
      metadata: cloneMetadata(stored.metadata)
    };
  }
  getMaybeExpired(key) {
    const stored = this.map.get(key);
    return stored && {
      value: stored.value.slice(),
      expiration: stored.expiration,
      metadata: cloneMetadata(stored.metadata)
    };
  }
  put(key, value) {
    this.map.set(key, {
      value: value.value.slice(),
      expiration: value.expiration,
      metadata: cloneMetadata(value.metadata)
    });
  }
  deleteMaybeExpired(key) {
    return this.map.delete(key);
  }
  static entryToStoredKey([name, { expiration, metadata }]) {
    return {
      name,
      expiration,
      metadata: cloneMetadata(metadata)
    };
  }
  listAllMaybeExpired() {
    return Array.from(this.map.entries()).map(MemoryStorage.entryToStoredKey);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocalStorage,
  MemoryStorage,
  cloneMetadata,
  listFilterMatch,
  listPaginate
});
//# sourceMappingURL=index.js.map
