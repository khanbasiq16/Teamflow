import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/lib/models/Project";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { projectId, email, role } = await request.json();
    const project = await Project.findById(projectId).populate("owner");
    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

    const requester = project.members.find((m) => m.user.toString() === user._id.toString());
    if (!requester || requester.role !== "admin")
      if (project.owner._id.toString() !== user._id.toString())
        return NextResponse.json({ message: "Only admins can invite" }, { status: 403 });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    project.inviteTokens.push({ token, email, expiresAt });
    await project.save();

    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;
    await transporter.sendMail({
      from: `"TeamFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `You're invited to join "${project.name}" on TeamFlow`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #6366f1;">You have been invited!</h2>
          <p><strong>${user.name}</strong> has invited you to join the project <strong>${project.name}</strong>.</p>
          <a href="${inviteLink}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Accept Invitation
          </a>
          <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">This link expires in 7 days.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: `Invitation sent to ${email}` });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
