import { nanoid } from "nanoid";
import { getDatabase, withDatabase } from "./db.js";

function clone(item) {
  return item ? JSON.parse(JSON.stringify(item)) : null;
}

function normalizeArray(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === "string" ? item.trim() : null))
    .filter(Boolean)
    .slice(0, 10);
}

export async function getLogsForUser(userId, { limit } = {}) {
  const db = await getDatabase();
  const logs = db.logs
    .filter((log) => log.userId === userId)
    .sort((a, b) => new Date(b.at ?? b.createdAt) - new Date(a.at ?? a.createdAt));

  const sliced = typeof limit === "number" && limit > 0 ? logs.slice(0, limit) : logs;
  return sliced.map(clone);
}

export async function createLogForUser(userId, payload) {
  return withDatabase((db) => {
    const now = new Date();
    const atDate = payload?.at ? new Date(payload.at) : now;
    const at = Number.isNaN(atDate.getTime()) ? now.toISOString() : atDate.toISOString();

    const log = {
      _id: nanoid(),
      userId,
      note: typeof payload?.note === "string" ? payload.note.trim() : "",
      mood: typeof payload?.mood === "string" ? payload.mood : null,
      cravingLevel:
        typeof payload?.cravingLevel === "number"
          ? Math.max(0, Math.min(5, Math.round(payload.cravingLevel)))
          : null,
      triggers: normalizeArray(payload?.triggers),
      copingActions: normalizeArray(payload?.copingActions),
      gratitude: typeof payload?.gratitude === "string" ? payload.gratitude.trim() : "",
      slip: Boolean(payload?.slip),
      tags: normalizeArray(payload?.tags).slice(0, 8),
      at,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    db.logs.unshift(log);
    return clone(log);
  });
}
