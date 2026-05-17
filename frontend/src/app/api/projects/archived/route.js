import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/lib/models/Project";

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const projects = await Project.find({
      $or: [{ owner: user._id }, { "members.user": user._id }],
      status: "archived",
    })
      .populate("owner", "name email")
      .populate("members.user", "name email avatar")
      .populate("tasks");

    const projectsWithStats = projects.map((p) => {
      const tasks = p.tasks || [];
      return {
        ...p.toObject(),
        stats: {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === "todo").length,
          inprogress: tasks.filter((t) => t.status === "inprogress").length,
          completed: tasks.filter((t) => t.status === "completed").length,
        },
      };
    });

    return NextResponse.json(projectsWithStats);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
