"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject, getMe, createTask, updateTaskStatus, deleteTask, sendInvite } from "@/app/lib/api";

const COLUMNS = [
  { key: "todo",       label: "To Do",       color: "border-slate-600"  },
  { key: "inprogress", label: "In Progress",  color: "border-amber-500"  },
  { key: "completed",  label: "Completed",    color: "border-emerald-500" },
];

const priorityColors = {
  low:    "text-slate-400 border-slate-700",
  medium: "text-amber-400 border-amber-800",
  high:   "text-rose-400 border-rose-800",
};

export default function ProjectPage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [project, setProject]         = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [boardView, setBoardView]     = useState("all");
  const [showTeamPanel, setShowTeamPanel] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" });
  const [submitting, setSubmitting] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg]     = useState("");
  const [inviting, setInviting]       = useState(false);

  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) return router.push("/");
    fetchProject();
    getMe().then(setCurrentUser).catch(() => {});
  }, [id]);

  const fetchProject = async () => {
    try {
      const p = await getProject(id);
      setProject(p);
      setTasks(p.tasks || []);
    } catch {
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return;
    setSubmitting(true);
    try {
      const task = await createTask({ ...taskForm, projectId: id });
      setTasks((prev) => [task, ...prev]);
      setTaskForm({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" });
      setShowTaskModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const updated = await updateTaskStatus(taskId, newStatus);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg("");
    try {
      await sendInvite({ projectId: id, email: inviteEmail });
      setInviteMsg(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (err) {
      setInviteMsg(err.message);
    } finally {
      setInviting(false);
    }
  };

  const onDragStart = (e, taskId) => setDragging(taskId);
  const onDrop = (e, status) => {
    if (dragging) handleStatusChange(dragging, status);
    setDragging(null);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const members = project?.members || [];

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/projects")} className="text-slate-500 hover:text-white text-sm transition">
            ← Back
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: project?.color }} />
            <h1 className="font-semibold text-lg">{project?.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button onClick={() => setBoardView("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${boardView === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
              All Tasks
            </button>
            <button onClick={() => setBoardView("mine")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${boardView === "mine" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
              My Tasks
            </button>
          </div>

          {/* Team toggle */}
          <button
            onClick={() => setShowTeamPanel((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${showTeamPanel ? "border-indigo-500/50 text-indigo-400 bg-indigo-600/10" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Team
            <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{members.length}</span>
          </button>

          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
            + New Task
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Kanban Board ── */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex gap-5 h-full">
            {COLUMNS.map((col) => {
              const base = boardView === "mine" && currentUser
                ? tasks.filter((t) => t.assignedTo?._id === currentUser._id)
                : tasks;
              const colTasks = base.filter((t) => t.status === col.key);
              return (
                <div key={col.key}
                  className={`flex-shrink-0 w-72 rounded-xl border-t-2 ${col.color} bg-[#16161f] p-4 flex flex-col`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, col.key)}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-sm">{col.label}</h3>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1">
                    {colTasks.map((task) => (
                      <div key={task._id} draggable
                        onDragStart={(e) => onDragStart(e, task._id)}
                        className="bg-[#0f0f13] border border-white/5 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-indigo-500/30 transition group">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium leading-snug">{task.title}</p>
                          <button onClick={() => handleDelete(task._id)}
                            className="text-slate-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs border px-2 py-0.5 rounded-full capitalize ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                          {task.assignedTo ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs text-indigo-300 font-bold"
                                title={task.assignedTo.name}>
                                {task.assignedTo.name?.[0]?.toUpperCase()}
                              </div>
                              <span className="text-xs text-slate-500">{task.assignedTo.name?.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-700">Unassigned</span>
                          )}
                        </div>
                        {task.dueDate && (
                          <p className="text-xs text-slate-600 mt-2">
                            Due: {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </p>
                        )}
                        <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition">
                          {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                            <button key={c.key}
                              onClick={() => handleStatusChange(task._id, c.key)}
                              className="flex-1 text-xs py-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 transition">
                              → {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="border border-dashed border-white/5 rounded-lg p-4 text-center text-slate-600 text-xs">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Team Panel ── */}
        {showTeamPanel && (
          <aside className="w-64 border-l border-white/5 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-white/5">
              <h2 className="text-sm font-semibold">Team Members</h2>
            </div>

            {/* Members list */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {members.filter((m) => m.user).map((m) => {
                const myTaskCount = tasks.filter((t) => t.assignedTo?._id === m.user._id).length;
                const roleMeta = {
                  admin:  { label: "Admin",  cls: "bg-indigo-600/20 text-indigo-400"  },
                  member: { label: "Member", cls: "bg-emerald-600/20 text-emerald-400" },
                  viewer: { label: "Viewer", cls: "bg-slate-600/20 text-slate-400"    },
                }[m.role] || { label: m.role, cls: "bg-white/10 text-slate-400" };

                return (
                  <div key={m.user._id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#16161f] border border-white/5 hover:border-white/10 transition">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: (project?.color || "#6366f1") + "33", color: project?.color || "#6366f1" }}>
                      {m.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium truncate">{m.user.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${roleMeta.cls}`}>
                          {roleMeta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{m.user.email}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {myTaskCount} task{myTaskCount !== 1 ? "s" : ""} assigned
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Pending invites */}
              {(() => {
                const pending = (project?.inviteTokens || []).filter(
                  (t) => !t.used && new Date(t.expiresAt) > new Date()
                );
                if (pending.length === 0) return null;
                return (
                  <div className="mt-3">
                    <p className="text-xs text-slate-600 px-1 mb-2">Pending Invites</p>
                    {pending.map((t, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#16161f] border border-dashed border-white/10 mb-2">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-400 truncate">{t.email}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">Invite pending</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Invite section */}
            <div className="p-4 border-t border-white/5">
              <p className="text-xs text-slate-500 mb-2 font-medium">Invite Member</p>
              <input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteMsg(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition mb-2" />
              {inviteMsg && (
                <p className={`text-xs mb-2 ${inviteMsg.includes("sent") ? "text-emerald-400" : "text-rose-400"}`}>
                  {inviteMsg}
                </p>
              )}
              <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-xs font-medium transition">
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Create Task Modal ── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">New Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Task title *" value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
              <textarea placeholder="Description (optional)" value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition h-20 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Priority</label>
                  <select value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Due Date</label>
                  <input type="date" value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition" />
                </div>
              </div>

              {/* Assign to member */}
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Assign To</label>
                <div className="grid grid-cols-1 gap-1.5">
                  <div
                    onClick={() => setTaskForm({ ...taskForm, assignedTo: "" })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${!taskForm.assignedTo ? "border-indigo-500/60 bg-indigo-600/10" : "border-white/5 bg-white/5 hover:border-white/10"}`}>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-slate-400">?</div>
                    <span className="text-sm text-slate-400">Unassigned</span>
                  </div>
                  {members.map((m) => (
                    <div key={m.user._id}
                      onClick={() => setTaskForm({ ...taskForm, assignedTo: m.user._id })}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${taskForm.assignedTo === m.user._id ? "border-indigo-500/60 bg-indigo-600/10" : "border-white/5 bg-white/5 hover:border-white/10"}`}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: (project?.color || "#6366f1") + "33", color: project?.color || "#6366f1" }}>
                        {m.user.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{m.user.email}</p>
                      </div>
                      {m.role === "admin" && (
                        <span className="text-[10px] bg-indigo-600/20 text-indigo-400 px-1.5 py-0.5 rounded-full">Admin</span>
                      )}
                      {taskForm.assignedTo === m.user._id && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleCreateTask} disabled={submitting || !taskForm.title.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm">
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
