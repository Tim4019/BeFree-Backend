const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    targetDays: {
      type: Number,
      min: 1,
      required: true,
    },

    //STATE
    achieved: {
      type: Boolean,
      default: false,
    },
    dateAchieved: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
milestoneSchema.index({ user: 1, code: 1 }, { unique: true });

const Milestone = mongoose.model("Milestone", milestoneSchema);
module.exports = { Milestone };
