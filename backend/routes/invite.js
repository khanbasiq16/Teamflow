// backend/routes/invite.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { protect } = require("../middleware/auth");
const Project = require("../models/Project");
const User = require("../models/User");

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/invite/send — invite user to project via email
router.post("/send", protect, async (req, res) => {
  try {
    const { projectId, email, role } = req.body;

    const project = await Project.findById(projectId).populate("owner");
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only owner/admin can invite
    const requester = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || !["admin"].includes(requester.role))
      if (project.owner._id.toString() !== req.user._id.toString())
        return res.status(403).json({ message: "Only admins can invite" });

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    project.inviteTokens.push({ token, email, expiresAt });
    await project.save();

    // Send email
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;
    await transporter.sendMail({
      from: `"TeamFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `You're invited to join "${project.name}" on TeamFlow`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #6366f1;">You have been invited! 🎉</h2>
          <p><strong>${req.user.name}</strong> has invited you to join the project <strong>${project.name}</strong>.</p>
          <a href="${inviteLink}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Accept Invitation
          </a>
          <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">This link expires in 7 days.</p>
        </div>
      `,
    });

    res.json({ message: `Invitation sent to ${email}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/invite/:token — validate invite token
router.get("/:token", async (req, res) => {
  try {
    const project = await Project.findOne({
      "inviteTokens.token": req.params.token,
    }).select("name description color inviteTokens");

    if (!project) return res.status(404).json({ message: "Invalid or expired invite" });

    const invite = project.inviteTokens.find((t) => t.token === req.params.token);
    if (!invite) return res.status(404).json({ message: "Invalid invite link" });
    if (invite.used) return res.status(410).json({ message: "This invite has already been used" });
    if (invite.expiresAt < new Date()) return res.status(410).json({ message: "Invite link expired" });

    // Check if the invited email already has an account
    const existingUser = await User.findOne({ email: invite.email }).select("_id name");

    res.json({
      projectId: project._id,
      projectName: project.name,
      projectColor: project.color,
      email: invite.email,
      userExists: !!existingUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/invite/:token/accept — accept invite (user must be logged in)
router.post("/:token/accept", protect, async (req, res) => {
  try {
    const project = await Project.findOne({
      "inviteTokens.token": req.params.token,
    });

    if (!project) return res.status(404).json({ message: "Invalid invite" });

    const invite = project.inviteTokens.find((t) => t.token === req.params.token);
    if (!invite) return res.status(404).json({ message: "Invalid invite" });
    if (invite.used) return res.status(410).json({ message: "This invite has already been used" });
    if (invite.expiresAt < new Date()) return res.status(410).json({ message: "Invite link expired" });

    // Email of logged-in user must match the invited email
    if (req.user.email.toLowerCase() !== invite.email.toLowerCase())
      return res.status(403).json({
        message: `This invite was sent to ${invite.email}. Please sign in with that account.`,
      });

    // Check if already a member
    const alreadyMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!alreadyMember) {
      project.members.push({ user: req.user._id, role: "member" });
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { projects: project._id },
      });
    }

    invite.used = true;
    await project.save();

    res.json({ message: "Joined project successfully!", projectId: project._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
