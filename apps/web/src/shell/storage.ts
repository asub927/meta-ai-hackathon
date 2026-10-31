import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface StorageBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

interface KvSchema extends DBSchema {
  kv: { key: string; value: string };
}

const DB_NAME = "kids-math";
const STORE = "kv";

export function createMemoryBackend(seed?: Record<string, string>): StorageBackend {
  const mem = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    get: (key) => Promise.resolve(mem.get(key) ?? null),
    set: (key, value) => {
      mem.set(key, value);
      return Promise.resolve();
    },
    remove: (key) => {
      mem.delete(key);
      return Promise.resolve();
    },
  };
}

export function createIdbBackend(): StorageBackend {
  const mem = createMemoryBackend();
  let db: Promise<IDBPDatabase<KvSchema>> | null = null;
  const conn = (): Promise<IDBPDatabase<KvSchema>> | null => {
    if (typeof indexedDB === "undefined") return null;
    db ??= openDB<KvSchema>(DB_NAME, 1, {
      upgrade(d) {
        d.createObjectStore(STORE);
      },
    });
    return db;
  };
  return {
    get: async (key) => {
      const c = conn();
      if (!c) return mem.get(key);
      try {
        const v = await (await c).get(STORE, key);
        return v ?? (await mem.get(key));
      } catch {
        db = null;
        return mem.get(key);
      }
    },
    set: async (key, value) => {
      const c = conn();
      if (!c) return mem.set(key, value);
      try {
        await (await c).put(STORE, value, key);
      } catch {
        db = null;
        await mem.set(key, value);
      }
    },
    remove: async (key) => {
      const c = conn();
      if (!c) return mem.remove(key);
      try {
        await (await c).delete(STORE, key);
      } catch {
        db = null;
        await mem.remove(key);
      }
    },
  };
}

/** One-time import from the pre-IndexedDB store. IndexedDB remains the store of record. */
export async function migrateLegacyKeys(backend: StorageBackend, keys: readonly string[]): Promise<string[]> {
  const migrated: string[] = [];
  let legacy: { getItem(key: string): string | null; removeItem(key: string): void } | null = null;
  try {
    legacy = typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    legacy = null;
  }
  if (!legacy) return migrated;
  for (const key of keys) {
    try {
      if ((await backend.get(key)) !== null) continue;
    } catch {
      return migrated;
    }
    let previous: string | null = null;
    try {
      previous = legacy.getItem(key);
    } catch {
      previous = null;
    }
    if (previous === null) continue;
    try {
      await backend.set(key, previous);
      migrated.push(key);
    } catch {
      continue;
    }
    try {
      legacy.removeItem(key);
    } catch {
      /* A blocked removal leaves the legacy copy behind; IndexedDB already has the value. */
    }
  }
  return migrated;
}

export async function ensurePersistent(): Promise<boolean | null> {
  try {
    const store = navigator.storage;
    if (!store) return null;
    if (await store.persisted()) return true;
    return await store.persist();
  } catch {
    return null;
  }
}
