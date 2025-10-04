// models/Log.js
const mongoose = require("mongoose");

const moodScale = [
  "very-low",
  "low",
  "steady",
  "bright",
  "energised",
];

const MAX_LIST_ITEMS = 6;
const MAX_NOTE_LENGTH = 1000;
const MAX_GRATITUDE_LENGTH = 240;

const stringListDefinition = {
  type: [String],
  default: [],
  validate: {
    validator: (list) => !Array.isArray(list) || list.length <= MAX_LIST_ITEMS,
    message: `No more than ${MAX_LIST_ITEMS} items allowed`,
  },
};

const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: "", maxlength: MAX_NOTE_LENGTH },
    mood: { type: String, enum: moodScale, default: null },
    cravingLevel: { type: Number, min: 0, max: 5, default: 0 },
    triggers: stringListDefinition,
    copingActions: stringListDefinition,
    gratitude: { type: String, default: "", maxlength: MAX_GRATITUDE_LENGTH },
    tags: stringListDefinition,
    slip: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Log = mongoose.model("Log", logSchema);
module.exports = { Log, moodScale };
