import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { getDatabase, withDatabase } from "./db.js";
import { ensureDefaultMilestonesForUser } from "./milestones.js";

const SALT_ROUNDS = 10;

function clone(item) {
  return item ? JSON.parse(JSON.stringify(item)) : null;
}

export function sanitizeUser(user) {
  if (!user) return null;
  const {
    passwordHash,
    ...safe
  } = user;
  return clone(safe);
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const db = await getDatabase();
  const user = db.users.find((item) => item.email === normalized);
  return clone(user);
}

export async function findUserById(userId) {
  if (!userId) return null;
  const db = await getDatabase();
  const user = db.users.find((item) => item._id === userId);
  return clone(user);
}

export async function createUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new Error("INVALID_PAYLOAD");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();
  const userRecord = {
    _id: nanoid(),
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
    addictionType: null,
    quitDate: null,
    createdAt: now,
    updatedAt: now,
  };

  await withDatabase((db) => {
    if (db.users.some((item) => item.email === normalizedEmail)) {
      const err = new Error("EMAIL_IN_USE");
      err.code = "EMAIL_IN_USE";
      throw err;
    }
    db.users.push(userRecord);
  });

  await ensureDefaultMilestonesForUser(userRecord._id);
  return sanitizeUser(userRecord);
}

export async function updateUserProfile(userId, updates) {
  if (!userId) return null;

  const allowed = {};
  if (typeof updates?.username === "string") {
    allowed.name = updates.username.trim();
  }
  if (typeof updates?.name === "string") {
    allowed.name = updates.name.trim();
  }
  if (typeof updates?.email === "string") {
    allowed.email = updates.email.trim().toLowerCase();
  }
  if (Object.prototype.hasOwnProperty.call(updates ?? {}, "addictionType")) {
    allowed.addictionType = updates.addictionType || null;
  }
  if (Object.prototype.hasOwnProperty.call(updates ?? {}, "quitDate")) {
    if (!updates.quitDate) {
      allowed.quitDate = null;
    } else {
      const date = new Date(updates.quitDate);
      allowed.quitDate = Number.isNaN(date.getTime())
        ? null
        : date.toISOString();
    }
  }

  return withDatabase((db) => {
    const user = db.users.find((item) => item._id === userId);
    if (!user) return null;

    if (allowed.email && allowed.email !== user.email) {
      const emailTaken = db.users.some(
        (item) => item.email === allowed.email && item._id !== userId
      );
      if (emailTaken) {
        const err = new Error("EMAIL_IN_USE");
        err.code = "EMAIL_IN_USE";
        throw err;
      }
      user.email = allowed.email;
    }

    if (allowed.name) user.name = allowed.name;
    if (Object.prototype.hasOwnProperty.call(allowed, "addictionType")) {
      user.addictionType = allowed.addictionType;
    }
    if (Object.prototype.hasOwnProperty.call(allowed, "quitDate")) {
      user.quitDate = allowed.quitDate;
    }

    user.updatedAt = new Date().toISOString();
    return sanitizeUser(user);
  });
}

export async function updateUserPassword(userId, { currentPassword, newPassword }) {
  if (!userId) return false;
  if (!currentPassword || !newPassword) return false;

  return withDatabase(async (db) => {
    const user = db.users.find((item) => item._id === userId);
    if (!user) return false;

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      const err = new Error("INVALID_CREDENTIALS");
      err.code = "INVALID_CREDENTIALS";
      throw err;
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.updatedAt = new Date().toISOString();
    return true;
  });
}

export async function seedDemoUser() {
  const existing = await findUserByEmail("demo@befree.app");
  if (existing) return sanitizeUser(existing);

  const passwordHash = await bcrypt.hash("password123", SALT_ROUNDS);
  const now = new Date().toISOString();
  const demoUser = {
    _id: nanoid(),
    name: "Demo User",
    email: "demo@befree.app",
    passwordHash,
    addictionType: "smoking",
    quitDate: null,
    createdAt: now,
    updatedAt: now,
  };

  await withDatabase((db) => {
    db.users.push(demoUser);
  });

  await ensureDefaultMilestonesForUser(demoUser._id);
  return sanitizeUser(demoUser);
}
