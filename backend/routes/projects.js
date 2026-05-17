// backend/routes/projects.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Project = require("../models/Project");
const Task = require("../models/Task");

// GET /api/projects — all projects for logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id },
      ],
      status: "active",
    })
      .populate("owner", "name email")
      .populate("members.user", "name email avatar")
      .populate("tasks");

    // Add task stats
    const projectsWithStats = projects.map((p) => {
      const tasks = p.tasks || [];
      return {
        ...p.toObject(),
        stats: {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === "todo").length,
          inprogress: tasks.filter((t) => t.status === "inprogress").length,
          completed: tasks.filter((t) => t.status === "completed").length,
        },
      };
    });

    res.json(projectsWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/archived
router.get("/archived", protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
      status: "archived",
    })
      .populate("owner", "name email")
      .populate("members.user", "name email avatar")
      .populate("tasks");

    const projectsWithStats = projects.map((p) => {
      const tasks = p.tasks || [];
      return {
        ...p.toObject(),
        stats: {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === "todo").length,
          inprogress: tasks.filter((t) => t.status === "inprogress").length,
          completed: tasks.filter((t) => t.status === "completed").length,
        },
      };
    });

    res.json(projectsWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects — create new project
router.post("/", protect, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ message: "Project name required" });

    const project = await Project.create({
      name,
      description,
      color: color || "#6366f1",
      owner: req.user._id,
      members: [{ user: req.user._id, role: "admin" }],
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id — single project with tasks
router.get("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .populate({
        path: "tasks",
        populate: [
          { path: "assignedTo", select: "name email avatar" },
          { path: "createdBy", select: "name email" },
        ],
      });

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Check access
    const isMember =
      project.owner._id.toString() === req.user._id.toString() ||
      project.members.some((m) => m.user._id.toString() === req.user._id.toString());

    if (!isMember) return res.status(403).json({ message: "Access denied" });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id — update project
router.put("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only owner can update" });

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only owner can delete" });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
