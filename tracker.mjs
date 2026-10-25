import { randomUUID } from "node:crypto";

// Tracker agent: keeps request status. In-memory for the hackathon.
// DEMO MODE: pending requests flip to "removed" after a few seconds so you
// can show the full flow. This is simulated, not a real broker response.
const users = new Map();
const DEMO_DELAY_MS = 8000;

export const createUser = (data) => {
  const user = { id: randomUUID(), ...data, listings: [], requests: [] };
  users.set(user.id, user);
  return user;
};
export const getUser = (id) => {
  const u = users.get(id);
  if (!u) throw Object.assign(new Error("Unknown user. Register again."), { status: 404 });
  return u;
};

export function createRequest(user, listing, emailDraft, language) {
  const req = {
    id: randomUUID(), listingId: listing.id, site: listing.site, method: listing.method,
    optOut: listing.optOut, eta: listing.eta, language, emailDraft,
    status: "pending", createdAt: new Date().toISOString(), simulated: true,
  };
  user.requests.push(req);
  setTimeout(() => { if (req.status === "pending") req.status = "removed"; },
    DEMO_DELAY_MS + Math.random() * 6000);
  return req;
}

export function setStatus(user, site, status) {
  const r = user.requests.find((x) => x.site.toLowerCase() === String(site).toLowerCase());
  if (r) { r.status = status; r.simulated = false; }
  return r;
}

export function dashboard(user) {
  const count = (s) => user.requests.filter((r) => r.status === s).length;
  return {
    tracked: user.requests.length,
    removed: count("removed"), pending: count("pending"), failed: count("failed"),
    requests: user.requests.map(({ emailDraft, ...r }) => r),
  };
}
