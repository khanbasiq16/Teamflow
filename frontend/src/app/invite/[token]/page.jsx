"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvite, acceptInvite, login, register } from "@/app/lib/api";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();

  const [invite,   setInvite]   = useState(null);
  const [pageErr,  setPageErr]  = useState("");
  const [loading,  setLoading]  = useState(true);
  const [success,  setSuccess]  = useState(false);
  const [name,     setName]     = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [busy,     setBusy]     = useState(false);
  const [accepting,setAccepting]= useState(false);
  const [acceptErr,setAcceptErr]= useState("");

  useEffect(() => {
    getInvite(token)
      .then(setInvite)
      .catch((e) => setPageErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const doAccept = async () => {
    const res = await acceptInvite(token);
    setSuccess(true);
    setTimeout(() => router.push(`/projects/${res.projectId}`), 1800);
  };

  const handleSubmit = async () => {
    setErr("");
    if (!password) return setErr("Password is required.");
    if (!invite.userExists && !name.trim()) return setErr("Full name is required.");
    setBusy(true);
    try {
      const fn = invite.userExists ? login : register;
      const data = await fn({ name, email: invite.email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
      await doAccept();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptErr("");
    try { await doAccept(); }
    catch (e) { setAcceptErr(e.message); }
    finally { setAccepting(false); }
  };

  if (loading)
    return <Screen><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></Screen>;

  if (pageErr)
    return (
      <Screen>
        <div className="bg-[#16161f] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="font-semibold text-white mb-1">Invalid Invite</h2>
          <p className="text-slate-500 text-sm">{pageErr}</p>
        </div>
      </Screen>
    );

  if (success)
    return (
      <Screen>
        <div className="bg-[#16161f] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-semibold text-lg text-white mb-1">Joined Successfully!</h2>
          <p className="text-slate-500 text-sm">Redirecting to project...</p>
        </div>
      </Screen>
    );

  const accent = invite?.projectColor || "#6366f1";
  const storedUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const loggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");
  const emailMatches = storedUser.email?.toLowerCase() === invite?.email?.toLowerCase();

  return (
    <Screen>
      <div className="w-full max-w-sm space-y-4">

        {/* Project card */}
        <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-bold"
            style={{ backgroundColor: accent + "33", color: accent }}>
            {invite?.projectName?.[0]?.toUpperCase()}
          </div>
          <p className="text-slate-400 text-sm">You've been invited to join</p>
          <p className="font-bold text-xl mt-1" style={{ color: accent }}>{invite?.projectName}</p>
          <p className="text-xs text-slate-600 mt-1">{invite?.email}</p>
        </div>

        {/* Already logged in with matching email */}
        {loggedIn && emailMatches ? (
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6">
            {acceptErr && <p className="text-rose-400 text-xs mb-3">{acceptErr}</p>}
            <button onClick={handleAccept} disabled={accepting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm">
              {accepting ? "Joining..." : "Accept Invitation"}
            </button>
          </div>
        ) : (
          /* Auth form */
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 space-y-3">
            <p className="text-sm font-semibold text-white">
              {invite?.userExists ? "Sign in to join" : "Create account to join"}
            </p>

            {/* Name — only new users */}
            {!invite?.userExists && (
              <input type="text" placeholder="Full name" value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
            )}

            {/* Email readonly */}
            <input type="email" value={invite?.email || ""} readOnly
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />

            {/* Password */}
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus={invite?.userExists}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />

            {err && <p className="text-rose-400 text-xs">{err}</p>}

            <button onClick={handleSubmit} disabled={busy}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm">
              {busy ? "Please wait..." : invite?.userExists ? "Sign In & Join" : "Create Account & Join"}
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}

function Screen({ children }) {
  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-4 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full flex flex-col items-center">{children}</div>
    </div>
  );
}
