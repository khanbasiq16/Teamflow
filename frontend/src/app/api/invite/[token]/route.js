import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/lib/models/Project";
import User from "@/lib/models/User";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { token } = await params;

    const project = await Project.findOne({ "inviteTokens.token": token }).select(
      "name description color inviteTokens"
    );
    if (!project) return NextResponse.json({ message: "Invalid or expired invite" }, { status: 404 });

    const invite = project.inviteTokens.find((t) => t.token === token);
    if (!invite) return NextResponse.json({ message: "Invalid invite link" }, { status: 404 });
    if (invite.used) return NextResponse.json({ message: "This invite has already been used" }, { status: 410 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ message: "Invite link expired" }, { status: 410 });

    const existingUser = await User.findOne({ email: invite.email }).select("_id name");

    return NextResponse.json({
      projectId: project._id,
      projectName: project.name,
      projectColor: project.color,
      email: invite.email,
      userExists: !!existingUser,
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
