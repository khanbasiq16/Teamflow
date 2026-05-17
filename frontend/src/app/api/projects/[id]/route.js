import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const project = await Project.findById(id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .populate({
        path: "tasks",
        populate: [
          { path: "assignedTo", select: "name email avatar" },
          { path: "createdBy", select: "name email" },
        ],
      });

    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

    const isMember =
      project.owner._id.toString() === user._id.toString() ||
      project.members.some((m) => m.user._id.toString() === user._id.toString());

    if (!isMember) return NextResponse.json({ message: "Access denied" }, { status: 403 });

    return NextResponse.json(project);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const project = await Project.findById(id);
    if (!project) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (project.owner.toString() !== user._id.toString())
      return NextResponse.json({ message: "Only owner can update" }, { status: 403 });

    const body = await request.json();
    const updated = await Project.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const project = await Project.findById(id);
    if (!project) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (project.owner.toString() !== user._id.toString())
      return NextResponse.json({ message: "Only owner can delete" }, { status: 403 });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    return NextResponse.json({ message: "Project deleted" });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
