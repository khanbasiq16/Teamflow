"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyTasks, getProjects } from "../lib/api";
import { Users } from "lucide-react";
// import { getProjects, getMyTasks } from "@/lib/api";

const statusColors = {
  todo: "bg-slate-100 text-slate-600",
  inprogress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const priorityDot = {
  low: "bg-slate-400",
  medium: "bg-amber-400",
  high: "bg-rose-500",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) return router.push("/");
    setUser(JSON.parse(userData));

    Promise.all([getProjects(), getMyTasks()])
      .then(([p, t]) => {
        setProjects(p);
        setMyTasks(t);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalTasks = projects.reduce((s, p) => s + (p.stats?.total || 0), 0);
  const completedTasks = projects.reduce((s, p) => s + (p.stats?.completed || 0), 0);
  const inProgressTasks = projects.reduce((s, p) => s + (p.stats?.inprogress || 0), 0);

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white font-sans">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-[#16161f] border-r border-white/5 flex flex-col z-30">
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TeamFlow</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 text-sm font-medium">
            <span>⊞</span> Dashboard
          </Link>
          <Link href="/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white text-sm transition">
            <span>◫</span> Projects
          </Link>
         
        </nav>

        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-rose-400 text-sm transition">⏻</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Good day, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">Here's what's happening across your projects.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Projects", value: projects.length, icon: "◫", color: "text-indigo-400" },
            { label: "Total Tasks", value: totalTasks, icon: "☰", color: "text-blue-400" },
            { label: "In Progress", value: inProgressTasks, icon: "⟳", color: "text-amber-400" },
            { label: "Completed", value: completedTasks, icon: "✓", color: "text-emerald-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#16161f] border border-white/5 rounded-xl p-5">
              <p className={`text-2xl mb-1 ${stat.color}`}>{stat.icon}</p>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-slate-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200">Your Projects</h2>
              <Link href="/projects" className="text-indigo-400 text-sm hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => {
                const pct = project.stats?.total
                  ? Math.round((project.stats.completed / project.stats.total) * 100)
                  : 0;
                return (
                  <Link href={`/projects/${project._id}`} key={project._id}
                    className="block bg-[#16161f] border border-white/5 rounded-xl p-4 hover:border-indigo-500/40 transition group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        <span className="font-medium text-sm group-hover:text-indigo-300 transition">{project.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{project.members?.length} members</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>{project.stats?.todo} todo</span>
                      <span className="text-amber-600">{project.stats?.inprogress} active</span>
                      <span className="text-emerald-600">{project.stats?.completed} done</span>
                    </div>
                  </Link>
                );
              })}
              {projects.length === 0 && (
                <div className="bg-[#16161f] border border-dashed border-white/10 rounded-xl p-8 text-center text-slate-500">
                  <p className="mb-2">No projects yet</p>
                  <Link href="/projects" className="text-indigo-400 text-sm hover:underline">Create your first project →</Link>
                </div>
              )}
            </div>
          </div>

          {/* My Tasks */}
          <div>
            <h2 className="font-semibold text-slate-200 mb-4">My Tasks</h2>
            <div className="space-y-2">
              {myTasks.slice(0, 8).map((task) => (
                <div key={task._id} className="bg-[#16161f] border border-white/5 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{task.project?.name}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.status]}`}>
                      {task.status === "inprogress" ? "In Progress" : task.status === "todo" ? "To Do" : "Completed"}
                    </span>
                  </div>
                </div>
              ))}
              {myTasks.length === 0 && (
                <p className="text-slate-600 text-sm text-center py-6">No tasks assigned to you</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
