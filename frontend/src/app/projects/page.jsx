"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProjects, getArchivedProjects, getMyTasks,
  createProject, deleteProject, updateProject, updateTaskStatus,
} from "../lib/api";

const PROJECT_COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6","#06b6d4"];

const STATUS_META = {
  todo:        { label: "Todo",        color: "text-slate-400",  bg: "bg-slate-500/20"  },
  inprogress:  { label: "In Progress", color: "text-amber-400",  bg: "bg-amber-500/20"  },
  completed:   { label: "Completed",   color: "text-emerald-400",bg: "bg-emerald-500/20" },
};

const PRIORITY_META = {
  low:    { label: "Low",    color: "text-slate-400"  },
  medium: { label: "Medium", color: "text-amber-400"  },
  high:   { label: "High",   color: "text-rose-400"   },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [view, setView]         = useState("active");
  const [projects, setProjects] = useState([]);
  const [archived, setArchived] = useState([]);
  const [myTasks, setMyTasks]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ name: "", description: "", color: "#6366f1" });
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving]         = useState(false);
  const [restoring, setRestoring]         = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) return router.push("/");
    Promise.all([getProjects(), getArchivedProjects()])
      .then(([active, arch]) => { setProjects(active); setArchived(arch); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view !== "mytasks") return;
    setTasksLoading(true);
    getMyTasks().then(setMyTasks).finally(() => setTasksLoading(false));
  }, [view]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const p = await createProject(form);
      setProjects((prev) => [p, ...prev]);
      setForm({ name: "", description: "", color: "#6366f1" });
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await updateProject(archiveTarget._id, { status: "archived" });
      setArchived((prev) => [{ ...archiveTarget, status: "archived" }, ...prev]);
      setProjects((prev) => prev.filter((p) => p._id !== archiveTarget._id));
      setArchiveTarget(null);
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async (p) => {
    setRestoring(p._id);
    try {
      await updateProject(p._id, { status: "active" });
      setProjects((prev) => [{ ...p, status: "active" }, ...prev]);
      setArchived((prev) => prev.filter((a) => a._id !== p._id));
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget._id);
      setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setArchived((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus);
    setMyTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const displayList = view === "active" ? projects : archived;

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex">

      {/* ── Sidebar ── */}
      <aside className="w-56 border-r border-white/5 flex flex-col p-4 gap-1 shrink-0">
        <div className="px-2 py-3 mb-2">
          <button onClick={() => router.push("/dashboard")}
            className="text-slate-500 hover:text-white text-xs transition">
            ← Dashboard
          </button>
        </div>

        <p className="text-xs text-slate-600 px-2 mb-1 uppercase tracking-wider">Projects</p>

        <SidebarBtn active={view === "active"} onClick={() => setView("active")}
          color="indigo" count={projects.length}
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />}>
          All Projects
        </SidebarBtn>

        <SidebarBtn active={view === "archived"} onClick={() => setView("archived")}
          color="amber" count={archived.length}
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />}>
          Archive
        </SidebarBtn>

        <div className="mt-3 mb-1 border-t border-white/5 pt-3">
          <p className="text-xs text-slate-600 px-2 mb-1 uppercase tracking-wider">Tasks</p>
        </div>

        <SidebarBtn active={view === "mytasks"} onClick={() => setView("mytasks")}
          color="violet"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}>
          My Tasks
        </SidebarBtn>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <h1 className="font-semibold text-lg">
            {view === "active" ? "All Projects" : view === "archived" ? "Archived Projects" : "My Tasks"}
          </h1>
          {view === "active" && (
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
              + New Project
            </button>
          )}
        </header>

        <main className="p-8 overflow-auto">
          {/* ── My Tasks view ── */}
          {view === "mytasks" && (
            tasksLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myTasks.length === 0 ? (
              <div className="py-20 text-center text-slate-600">No tasks assigned to you.</div>
            ) : (
              <div className="space-y-8 max-w-3xl">
                {["inprogress", "todo", "completed"].map((statusKey) => {
                  const group = myTasks.filter((t) => t.status === statusKey);
                  if (group.length === 0) return null;
                  const meta = STATUS_META[statusKey];
                  return (
                    <div key={statusKey}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                        <span className="text-xs text-slate-600">{group.length}</span>
                      </div>
                      <div className="space-y-2">
                        {group.map((task) => (
                          <div key={task._id}
                            className="flex items-center gap-3 bg-[#16161f] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition">

                            {/* Status dot */}
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              task.status === "completed" ? "bg-emerald-500" :
                              task.status === "inprogress" ? "bg-amber-500" : "bg-slate-500"
                            }`} />

                            {/* Title */}
                            <span className={`flex-1 text-sm ${task.status === "completed" ? "line-through text-slate-500" : ""}`}>
                              {task.title}
                            </span>

                            {/* Project chip — links to project detail */}
                            {task.project && (
                              <Link href={`/projects/${task.project._id}`}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs shrink-0 transition hover:brightness-125"
                                style={{ backgroundColor: (task.project.color || "#6366f1") + "22", color: task.project.color || "#6366f1" }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.project.color || "#6366f1" }} />
                                {task.project.name}
                              </Link>
                            )}

                            {/* Priority */}
                            <span className={`text-xs shrink-0 ${PRIORITY_META[task.priority]?.color || "text-slate-400"}`}>
                              {PRIORITY_META[task.priority]?.label}
                            </span>

                            {/* Due date */}
                            {task.dueDate && (
                              <span className="text-xs text-slate-600 shrink-0">
                                {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            )}

                            {/* Status select */}
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task._id, e.target.value)}
                              className="bg-white/5 border border-white/10 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-violet-500 transition cursor-pointer shrink-0">
                              <option value="todo">Todo</option>
                              <option value="inprogress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── Projects / Archive view ── */}
          {view !== "mytasks" && (
            loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayList.map((p) => {
                  const pct = p.stats?.total ? Math.round((p.stats.completed / p.stats.total) * 100) : 0;
                  const isArchived = view === "archived";
                  return (
                    <div key={p._id} className={`relative group ${isArchived ? "opacity-75" : ""}`}>
                      {isArchived ? (
                        <div className="bg-[#16161f] border border-white/5 rounded-xl p-5 transition hover:border-amber-500/30">
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handleRestore(p)} disabled={restoring === p._id}
                              className="text-slate-600 hover:text-emerald-400 transition" title="Restore">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                            <button onClick={() => setDeleteTarget(p)}
                              className="text-slate-600 hover:text-rose-400 transition" title="Delete permanently">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <ProjectCardContent p={p} pct={pct} />
                        </div>
                      ) : (
                        <Link href={`/projects/${p._id}`}
                          className="block bg-[#16161f] border border-white/5 rounded-xl p-5 hover:border-indigo-500/40 transition">
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={(e) => { e.preventDefault(); setArchiveTarget(p); }}
                              className="text-slate-600 hover:text-amber-400 transition" title="Archive">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                            <button onClick={(e) => { e.preventDefault(); setDeleteTarget(p); }}
                              className="text-slate-600 hover:text-rose-400 transition" title="Delete">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <ProjectCardContent p={p} pct={pct} />
                        </Link>
                      )}
                    </div>
                  );
                })}

                {displayList.length === 0 && (
                  <div className="col-span-3 py-20 text-center">
                    {view === "active" ? (
                      <>
                        <p className="text-slate-600 mb-4">No projects yet. Create your first one!</p>
                        <button onClick={() => setShowModal(true)}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
                          Create Project
                        </button>
                      </>
                    ) : (
                      <p className="text-slate-600">No archived projects.</p>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </main>
      </div>

      {/* ── Archive Modal ── */}
      {archiveTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold mb-2">Archive Project</h2>
            <p className="text-sm text-slate-400 mb-6">
              Archive <span className="text-white font-medium">"{archiveTarget.name}"</span>? It will be hidden from your projects list.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setArchiveTarget(null)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition">Cancel</button>
              <button onClick={handleArchive} disabled={archiving}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg text-sm font-medium transition">
                {archiving ? "Archiving..." : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-semibold mb-2">Delete Project</h2>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">"{deleteTarget.name}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg text-sm font-medium transition">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Project name *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
              <textarea placeholder="Description (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition h-20 resize-none" />
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Project Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-white/40" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} disabled={submitting || !form.name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm">
                {submitting ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarBtn({ active, onClick, color, count, icon, children }) {
  const colors = {
    indigo: "bg-indigo-600/20 text-indigo-400",
    amber:  "bg-amber-600/20 text-amber-400",
    violet: "bg-violet-600/20 text-violet-400",
  };
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition w-full ${active ? colors[color] : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {icon}
      </svg>
      {children}
      {count > 0 && (
        <span className="ml-auto text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </button>
  );
}

function ProjectCardContent({ p, pct }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: p.color + "22", color: p.color }}>
          {p.name[0].toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-xs text-slate-500">{p.members?.length} members</p>
        </div>
      </div>
      {p.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.description}</p>}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{pct}% complete</span>
          <span>{p.stats?.total} tasks</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
        </div>
      </div>
      <div className="flex gap-3 mt-4 pt-4 border-t border-white/5 text-xs">
        <span className="text-slate-500">{p.stats?.todo} todo</span>
        <span className="text-amber-600">{p.stats?.inprogress} active</span>
        <span className="text-emerald-600">{p.stats?.completed} done</span>
      </div>
    </>
  );
}
