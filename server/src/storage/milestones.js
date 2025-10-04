import { nanoid } from "nanoid";
import { getDatabase, withDatabase } from "./db.js";

const DEFAULT_MILESTONES = [
  { title: "First 72 hours", targetDays: 3 },
  { title: "One week strong", targetDays: 7 },
  { title: "Halfway to a month", targetDays: 14 },
  { title: "One month milestone", targetDays: 30 },
  { title: "Ninety day reset", targetDays: 90 },
  { title: "Half-year hero", targetDays: 180 }
];

function clone(item) {
  return item ? JSON.parse(JSON.stringify(item)) : null;
}

export async function getMilestonesForUser(userId) {
  const db = await getDatabase();
  return db.milestones.filter((milestone) => milestone.userId === userId).map(clone);
}

export async function ensureDefaultMilestonesForUser(userId) {
  return withDatabase((db) => {
    const existing = db.milestones.filter((milestone) => milestone.userId === userId);
    if (existing.length > 0) {
      return existing.map(clone);
    }

    const now = new Date().toISOString();
    const seeded = DEFAULT_MILESTONES.map((item) => ({
      _id: nanoid(),
      userId,
      title: item.title,
      targetDays: item.targetDays,
      achieved: false,
      dateAchieved: null,
      createdAt: now,
      updatedAt: now,
    }));

    db.milestones.push(...seeded);
    return seeded.map(clone);
  });
}

export async function updateMilestoneForUser(userId, milestoneId, updates) {
  return withDatabase((db) => {
    const milestone = db.milestones.find(
      (item) => item._id === milestoneId && item.userId === userId
    );
    if (!milestone) return null;

    if (typeof updates.achieved === "boolean") {
      milestone.achieved = updates.achieved;
      if (!updates.achieved) {
        milestone.dateAchieved = null;
      }
    }

    if (updates.dateAchieved) {
      const date = new Date(updates.dateAchieved);
      if (!Number.isNaN(date.getTime())) {
        milestone.dateAchieved = date.toISOString();
        milestone.achieved = true;
      }
    }

    if (typeof updates.title === "string" && updates.title.trim()) {
      milestone.title = updates.title.trim();
    }

    if (typeof updates.targetDays === "number" && updates.targetDays > 0) {
      milestone.targetDays = Math.floor(updates.targetDays);
    }

    milestone.updatedAt = new Date().toISOString();
    return clone(milestone);
  });
}
