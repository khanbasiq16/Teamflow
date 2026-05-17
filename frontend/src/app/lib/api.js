// frontend/lib/api.js
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getToken = () => {
  if (typeof window !== "undefined") return localStorage.getItem("token");
  return null;
};

const headers = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const handleRes = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// Auth
export const register = (body) =>
  fetch(`${BASE_URL}/auth/register`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handleRes);

export const login = (body) =>
  fetch(`${BASE_URL}/auth/login`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handleRes);

export const getMe = () =>
  fetch(`${BASE_URL}/auth/me`, { headers: headers() }).then(handleRes);

// Projects
export const getProjects = () =>
  fetch(`${BASE_URL}/projects`, { headers: headers() }).then(handleRes);

export const getArchivedProjects = () =>
  fetch(`${BASE_URL}/projects/archived`, { headers: headers() }).then(handleRes);

export const getProject = (id) =>
  fetch(`${BASE_URL}/projects/${id}`, { headers: headers() }).then(handleRes);

export const createProject = (body) =>
  fetch(`${BASE_URL}/projects`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handleRes);

export const updateProject = (id, body) =>
  fetch(`${BASE_URL}/projects/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(handleRes);

export const deleteProject = (id) =>
  fetch(`${BASE_URL}/projects/${id}`, { method: "DELETE", headers: headers() }).then(handleRes);

// Tasks
export const getProjectTasks = (projectId) =>
  fetch(`${BASE_URL}/tasks/project/${projectId}`, { headers: headers() }).then(handleRes);

export const getMyTasks = () =>
  fetch(`${BASE_URL}/tasks/my`, { headers: headers() }).then(handleRes);

export const createTask = (body) =>
  fetch(`${BASE_URL}/tasks`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handleRes);

export const updateTaskStatus = (id, status) =>
  fetch(`${BASE_URL}/tasks/${id}/status`, { method: "PATCH", headers: headers(), body: JSON.stringify({ status }) }).then(handleRes);

export const updateTask = (id, body) =>
  fetch(`${BASE_URL}/tasks/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(handleRes);

export const deleteTask = (id) =>
  fetch(`${BASE_URL}/tasks/${id}`, { method: "DELETE", headers: headers() }).then(handleRes);

// Invite
export const sendInvite = (body) =>
  fetch(`${BASE_URL}/invite/send`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handleRes);

export const getInvite = (token) =>
  fetch(`${BASE_URL}/invite/${token}`).then(handleRes);

export const acceptInvite = (token) =>
  fetch(`${BASE_URL}/invite/${token}/accept`, { method: "POST", headers: headers() }).then(handleRes);
