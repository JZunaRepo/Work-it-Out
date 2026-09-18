// Falls back to whatever host the page itself was loaded from (same box, backend's port) —
// so it works whether you're on localhost, a LAN IP, or a hostname like workout.lan, without
// needing VITE_API_URL set per-environment. Set VITE_API_URL explicitly only when the API
// really lives on a different host than the frontend (e.g. separate NPM hostnames in prod).
const BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8001`;

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    let detail = body;
    try {
      detail = JSON.parse(body).detail || body;
    } catch {
      // not JSON, use raw body
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

export const api = {
  getProfiles: () => request("/api/profiles"),
  createProfile: (name) => request("/api/profiles", { method: "POST", body: JSON.stringify({ name }) }),

  getExercises: ({ q, muscleGroup, equipment } = {}) =>
    request(`/api/exercises${qs({ q, muscle_group: muscleGroup, equipment })}`),
  getExercise: (id) => request(`/api/exercises/${id}`),
  getRecentExercises: (profileId) => request(`/api/exercises/recent?profile_id=${profileId}`),
  getExerciseFilters: () => request("/api/exercises/filters"),
  getBestWeight: (exerciseId, profileId) =>
    request(`/api/exercises/${exerciseId}/best-weight?profile_id=${profileId}`),
  createExercise: (formData) => request("/api/exercises", { method: "POST", body: formData }),
  updateExerciseName: (id, name) =>
    request(`/api/exercises/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteExercise: (id) => request(`/api/exercises/${id}`, { method: "DELETE" }),

  getRange: (profileId, start, end) => request(`/api/workout-days/${profileId}?start=${start}&end=${end}`),
  getDay: (profileId, date) => request(`/api/workout-days/${profileId}/${date}`),
  saveDay: (profileId, date, exercises) =>
    request(`/api/workout-days/${profileId}/${date}`, {
      method: "PUT",
      body: JSON.stringify({ exercises }),
    }),

  photoUrl: (path) => (path ? `${BASE_URL}${path}` : null),
};
