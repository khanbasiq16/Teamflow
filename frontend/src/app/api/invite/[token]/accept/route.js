import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/lib/models/Project";
import User from "@/lib/models/User";

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { token } = await params;
    const project = await Project.findOne({ "inviteTokens.token": token });
    if (!project) return NextResponse.json({ message: "Invalid invite" }, { status: 404 });

    const invite = project.inviteTokens.find((t) => t.token === token);
    if (!invite) return NextResponse.json({ message: "Invalid invite" }, { status: 404 });
    if (invite.used) return NextResponse.json({ message: "This invite has already been used" }, { status: 410 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ message: "Invite link expired" }, { status: 410 });

    if (user.email.toLowerCase() !== invite.email.toLowerCase())
      return NextResponse.json(
        { message: `This invite was sent to ${invite.email}. Please sign in with that account.` },
        { status: 403 }
      );

    const alreadyMember = project.members.some((m) => m.user.toString() === user._id.toString());
    if (!alreadyMember) {
      project.members.push({ user: user._id, role: "member" });
      await User.findByIdAndUpdate(user._id, { $addToSet: { projects: project._id } });
    }

    invite.used = true;
    await project.save();

    return NextResponse.json({ message: "Joined project successfully!", projectId: project._id });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
