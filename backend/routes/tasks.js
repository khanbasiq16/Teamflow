// backend/routes/tasks.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Task = require("../models/Task");
const Project = require("../models/Project");

// Helper: check if user is project member
const isMember = (project, userId) => {
  return (
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.user.toString() === userId.toString())
  );
};

// POST /api/tasks — create task in a project
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate, tags } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isMember(project, req.user._id))
      return res.status(403).json({ message: "Not a project member" });

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || "medium",
      dueDate: dueDate || null,
      tags: tags || [],
    });

    // Add task to project
    project.tasks.push(task._id);
    await project.save();

    const populated = await task.populate([
      { path: "assignedTo", select: "name email avatar" },
      { path: "createdBy", select: "name email" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/project/:projectId — all tasks for a project
router.get("/project/:projectId", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!isMember(project, req.user._id))
      return res.status(403).json({ message: "Access denied" });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/my — tasks assigned to me
router.get("/my", protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("project", "name color")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/status — update task status
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["todo", "inprogress", "completed"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    if (!isMember(project, req.user._id))
      return res.status(403).json({ message: "Access denied" });

    task.status = status;
    await task.save();

    const populated = await task.populate([
      { path: "assignedTo", select: "name email avatar" },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id — update task details
router.put("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    if (!isMember(project, req.user._id))
      return res.status(403).json({ message: "Access denied" });

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    if (!isMember(project, req.user._id))
      return res.status(403).json({ message: "Access denied" });

    await Task.findByIdAndDelete(req.params.id);
    await Project.findByIdAndUpdate(task.project, {
      $pull: { tasks: task._id },
    });

    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/comment — add comment
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.comments.push({ user: req.user._id, text });
    await task.save();

    await task.populate("comments.user", "name avatar");
    res.json(task.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
