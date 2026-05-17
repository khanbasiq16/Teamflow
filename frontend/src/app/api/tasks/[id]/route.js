import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Task from "@/lib/models/Task";
import Project from "@/lib/models/Project";

const checkAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) return { error: "Task not found", status: 404 };
  const project = await Project.findById(task.project);
  const isMember =
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.user.toString() === userId.toString());
  if (!isMember) return { error: "Access denied", status: 403 };
  return { task, project };
};

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error, status } = await checkAccess(id, user._id);
    if (error) return NextResponse.json({ message: error }, { status });

    const body = await request.json();
    const updated = await Task.findByIdAndUpdate(id, body, { new: true })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email");

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
    const { task, error, status } = await checkAccess(id, user._id);
    if (error) return NextResponse.json({ message: error }, { status });

    await Task.findByIdAndDelete(id);
    await Project.findByIdAndUpdate(task.project, { $pull: { tasks: task._id } });

    return NextResponse.json({ message: "Task deleted" });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
