const { Milestone } = require("../models/Milestone");

const defaultMilestones = [
  { code: "day1", title: "First 24 hours", targetDays: 1 },
  { code: "day7", title: "One week milestone", targetDays: 7 },
  { code: "day30", title: "30 days strong", targetDays: 30 },
  { code: "day90", title: "Three months", targetDays: 90 },
  { code: "day180", title: "Half-year mark", targetDays: 180 },
  { code: "day365", title: "One year free", targetDays: 365 },
];

async function ensureDefaults(userId) {
  const existing = await Milestone.find({ user: userId }).select("code");
  const existingCodes = new Set(existing.map((m) => m.code));
  const toCreate = defaultMilestones.filter((m) => !existingCodes.has(m.code));

  if (toCreate.length) {
    await Milestone.insertMany(
      toCreate.map((milestone) => ({ ...milestone, user: userId }))
    );
  }
}

exports.list = async (req, res, next) => {
  try {
    await ensureDefaults(req.user.id);
    const milestones = await Milestone.find({ user: req.user.id }).sort({
      targetDays: 1,
    });
    res.json({ milestones });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = {
      user: req.user.id,
      code: req.body.code,
      title: req.body.title,
      targetDays: req.body.targetDays,
      achieved: Boolean(req.body.achieved),
      dateAchieved: req.body.dateAchieved || null,
    };

    const created = await Milestone.create(payload);
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 11000) {
      error.status = 400;
      error.message = "Milestone code already exists";
    }
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updates = {};
    if (typeof req.body.title !== "undefined") updates.title = req.body.title;
    if (typeof req.body.targetDays !== "undefined")
      updates.targetDays = req.body.targetDays;
    if (typeof req.body.achieved !== "undefined")
      updates.achieved = Boolean(req.body.achieved);
    if (typeof req.body.dateAchieved !== "undefined")
      updates.dateAchieved = req.body.dateAchieved;

    const milestone = await Milestone.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!milestone)
      return res.status(404).json({ error: "Milestone not found" });
    res.json(milestone);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const removed = await Milestone.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!removed)
      return res.status(404).json({ error: "Milestone not found" });
    res.json({ message: "Deleted", id: removed.id });
  } catch (error) {
    next(error);
  }
};
