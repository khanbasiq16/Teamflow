import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Task from "@/lib/models/Task";

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { text } = await request.json();
    const task = await Task.findById(id);
    if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

    task.comments.push({ user: user._id, text });
    await task.save();
    await task.populate("comments.user", "name avatar");

    return NextResponse.json(task.comments);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
