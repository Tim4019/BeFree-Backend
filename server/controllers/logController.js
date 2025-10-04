const { Log, moodScale } = require("../models/Log");

//safely parses date strings
function parseDate(input) {
  const d = new Date(input);
  return isNaN(d) ? null : d;
}

function normalizeString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function limitLength(value, maxLength) {
  if (!value) return "";
  return value.slice(0, maxLength);
}

function normalizeStringArray(input, maxItems = 6, itemMaxLength = 60) {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [];

  const cleaned = raw
    .map((item) => normalizeString(item))
    .filter(Boolean)
    .map((item) => limitLength(item, itemMaxLength));

  return Array.from(new Set(cleaned)).slice(0, maxItems);
}

function coerceMood(value) {
  const candidate = normalizeString(value);
  if (!candidate) return null;
  return moodScale.includes(candidate) ? candidate : null;
}

function coerceCravingLevel(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const rounded = Math.round(number);
  if (rounded < 0) return 0;
  if (rounded > 5) return 5;
  return rounded;
}

function coerceBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return Boolean(value);
}

async function listLogs(req, res, next) {
  try {
    const { from, to, mood, slip } = req.query;

    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    const skip = Math.max(parseInt(req.query.skip || "0", 10), 0);

    const q = { user: req.user.id };

    //date range
    const at = {};
    const fromDate = from ? parseDate(from) : null;
    const toDate = to ? parseDate(to) : null;

    if (fromDate) at.$gte = fromDate;
    if (toDate) at.$lte = toDate;
    if (Object.keys(at).length) q.at = at;

    //mood
    if (mood) q.mood = mood;

    //slip
    if (typeof slip !== "undefined") q.slip = slip === "true";

    const data = await Log.find(q)
      .sort({ at: -1 })
      .skip(skip)
      .limit(limit);

    res.json(data);
  } catch (error) {
    next(error);
  }
}

//POST api/logs

const NOTE_LIMIT = 1000;
const GRATITUDE_LIMIT = 240;

async function createLog(req, res, next) {
  try {
    const at = req.body.at ? parseDate(req.body.at) : null;

    const rawMood = req.body.mood;
    const mood = coerceMood(rawMood);
    if (normalizeString(rawMood) && !mood) {
      return res.status(400).json({ error: "Mood value not supported" });
    }

    const payload = {
      user: req.user.id,
      note: limitLength(normalizeString(req.body.note), NOTE_LIMIT),
      mood,
      slip: coerceBoolean(req.body.slip),
      cravingLevel: coerceCravingLevel(req.body.cravingLevel),
      triggers: normalizeStringArray(req.body.triggers),
      copingActions: normalizeStringArray(req.body.copingActions),
      gratitude: limitLength(normalizeString(req.body.gratitude), GRATITUDE_LIMIT),
      tags: normalizeStringArray(req.body.tags, 8, 40),
    };

    if (at) payload.at = at;

    const created = await Log.create(payload);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

//GET api/logs/:id

async function getLog(req, res, next) {
  try {
    const log = await Log.findOne({ _id: req.params.id, user: req.user.id });
    if (!log) return res.status(400).json({ error: "Log not found" });
    res.json(log);
  } catch (error) {
    next(error);
  }
}

//PATCH api/logs/:id

async function updateLog(req, res, next) {
  try {
    const update = {};

    if (typeof req.body.note !== "undefined") {
      update.note = limitLength(normalizeString(req.body.note), NOTE_LIMIT);
    }

    if (typeof req.body.mood !== "undefined") {
      const rawMood = req.body.mood;
      const mood = coerceMood(rawMood);
      if (normalizeString(rawMood) && !mood) {
        return res.status(400).json({ error: "Mood value not supported" });
      }
      update.mood = mood;
    }

    if (typeof req.body.slip !== "undefined") {
      update.slip = coerceBoolean(req.body.slip);
    }

    if (typeof req.body.cravingLevel !== "undefined") {
      update.cravingLevel = coerceCravingLevel(req.body.cravingLevel);
    }

    if (typeof req.body.triggers !== "undefined") {
      update.triggers = normalizeStringArray(req.body.triggers);
    }

    if (typeof req.body.copingActions !== "undefined") {
      update.copingActions = normalizeStringArray(req.body.copingActions);
    }

    if (typeof req.body.gratitude !== "undefined") {
      update.gratitude = limitLength(
        normalizeString(req.body.gratitude),
        GRATITUDE_LIMIT
      );
    }

    if (typeof req.body.tags !== "undefined") {
      update.tags = normalizeStringArray(req.body.tags, 8, 40);
    }

    if (typeof req.body.at !== "undefined") {
      const d = parseDate(req.body.at);
      if (d) update.at = d;
    }

    const updated = await Log.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Log not found" });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteLogs(req, res, next) {
  try {
    const deleted = await Log.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!deleted) return res.status(404).json({ error: "Log not found" });
    res.status(200).json({ message: "Deleted", id: deleted.id });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listLogs,
  createLog,
  getLog,
  updateLog,
  deleteLogs,
};
