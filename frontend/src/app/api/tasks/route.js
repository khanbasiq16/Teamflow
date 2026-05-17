import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Task from "@/lib/models/Task";
import Project from "@/lib/models/Project";

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { title, description, projectId, assignedTo, priority, dueDate, tags } = await request.json();

    const project = await Project.findById(projectId);
    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

    const isMember =
      project.owner.toString() === user._id.toString() ||
      project.members.some((m) => m.user.toString() === user._id.toString());
    if (!isMember) return NextResponse.json({ message: "Not a project member" }, { status: 403 });

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: user._id,
      priority: priority || "medium",
      dueDate: dueDate || null,
      tags: tags || [],
    });

    project.tasks.push(task._id);
    await project.save();

    const populated = await task.populate([
      { path: "assignedTo", select: "name email avatar" },
      { path: "createdBy", select: "name email" },
    ]);

    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
