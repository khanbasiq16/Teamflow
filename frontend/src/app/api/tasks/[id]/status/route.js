import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Task from "@/lib/models/Task";
import Project from "@/lib/models/Project";

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await request.json();
    if (!["todo", "inprogress", "completed"].includes(status))
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });

    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

    const project = await Project.findById(task.project);
    const isMember =
      project.owner.toString() === user._id.toString() ||
      project.members.some((m) => m.user.toString() === user._id.toString());
    if (!isMember) return NextResponse.json({ message: "Access denied" }, { status: 403 });

    task.status = status;
    await task.save();
    await task.populate([{ path: "assignedTo", select: "name email avatar" }]);

    return NextResponse.json(task);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
