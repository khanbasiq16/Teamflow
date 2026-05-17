import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Task from "@/lib/models/Task";

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const tasks = await Task.find({ assignedTo: user._id })
      .populate("project", "name color")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    return NextResponse.json(tasks);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
