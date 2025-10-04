import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "../../data/db.json");

let cache = null;
let writeQueue = Promise.resolve();

async function loadFromDisk() {
  try {
    const content = await readFile(DB_PATH, "utf-8");
    cache = JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      cache = { users: [], logs: [], milestones: [] };
      await persist(cache);
    } else {
      throw error;
    }
  }
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

async function persist(data) {
  const payload = JSON.stringify(data, null, 2);
  writeQueue = writeQueue.then(() => writeFile(DB_PATH, payload, "utf-8"));
  await writeQueue;
}

export async function getDatabase() {
  if (!cache) {
    await loadFromDisk();
  }
  return clone(cache);
}

export async function writeDatabase(next) {
  cache = clone(next);
  await persist(cache);
}

export async function withDatabase(mutator) {
  const db = await getDatabase();
  const result = await mutator(db);
  await writeDatabase(db);
  return result;
}
