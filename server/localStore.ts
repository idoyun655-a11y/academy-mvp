import fs from "node:fs/promises";
import path from "node:path";

export type LocalStore = {
  version: 1;
  sequences: Record<string, number>;
  users: any[];
  students: any[];
  classes: any[];
  classSchedules: any[];
  classEnrollments: any[];
  attendance: any[];
  commuteLogs: any[];
  notices: any[];
  notificationTemplates: any[];
  notificationLogs: any[];
  adminLogs: any[];
  grades: any[];
  examSchedules: any[];
  academyEvents: any[];
  tuitionPayments: any[];
};

const STORE_DIR = path.resolve(process.cwd(), "server", ".data");
const STORE_PATH = path.join(STORE_DIR, "academy-local-store.json");

const DEFAULT_STORE: LocalStore = {
  version: 1,
  sequences: {
    users: 1,
    students: 1,
    classes: 1,
    classSchedules: 1,
    classEnrollments: 1,
    attendance: 1,
    commuteLogs: 1,
    notices: 1,
    notificationTemplates: 1,
    notificationLogs: 1,
    adminLogs: 1,
    grades: 1,
    examSchedules: 1,
    academyEvents: 1,
    tuitionPayments: 1,
  },
  users: [],
  students: [],
  classes: [],
  classSchedules: [],
  classEnrollments: [],
  attendance: [],
  commuteLogs: [],
  notices: [],
  notificationTemplates: [],
  notificationLogs: [],
  adminLogs: [],
  grades: [],
  examSchedules: [],
  academyEvents: [],
  tuitionPayments: [],
};

let cache: LocalStore | null = null;

function cloneStore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function writeStore(store: LocalStore) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function readStoreFromDisk(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      ...cloneStore(DEFAULT_STORE),
      ...parsed,
      sequences: {
        ...DEFAULT_STORE.sequences,
        ...(parsed.sequences ?? {}),
      },
    };
  } catch {
    const initial = cloneStore(DEFAULT_STORE);
    await writeStore(initial);
    return initial;
  }
}

async function getMutableStore() {
  if (!cache) {
    cache = await readStoreFromDisk();
  }

  return cache;
}

export async function readLocalStore() {
  const store = await getMutableStore();
  return cloneStore(store);
}

export async function updateLocalStore<T>(
  updater: (store: LocalStore) => Promise<T> | T,
) {
  const store = await getMutableStore();
  const result = await updater(store);
  await writeStore(store);
  return result;
}

export function getNextLocalId(store: LocalStore, key: keyof LocalStore["sequences"]) {
  const current = store.sequences[key] ?? 1;
  store.sequences[key] = current + 1;
  return current;
}

export { STORE_PATH as LOCAL_STORE_PATH };
