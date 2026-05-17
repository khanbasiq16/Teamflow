import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Task from "@/lib/models/Task";
import Project from "@/lib/models/Project";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { projectId } = await params;
    const project = await Project.findById(projectId);
    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

    const isMember =
      project.owner.toString() === user._id.toString() ||
      project.members.some((m) => m.user.toString() === user._id.toString());
    if (!isMember) return NextResponse.json({ message: "Access denied" }, { status: 403 });

    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(tasks);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
