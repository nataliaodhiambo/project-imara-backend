export interface StaffUser {
  name: string;
  email: string;
  password: string;
}

const USERS_KEY = "imara_users";
const SESSION_KEY = "imara_session";

const demoUser: StaffUser = {
  name: "Demo Coach",
  email: "coach@imara.demo",
  password: "imara2026",
};

function readUsers(): StaffUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StaffUser[]) : [];
  } catch {
    return [];
  }
}

export function registerUser(user: StaffUser): { ok: boolean; message?: string } {
  const email = user.email.trim().toLowerCase();
  const exists =
    email === demoUser.email || readUsers().some((u) => u.email === email);
  if (exists) return { ok: false, message: "An account with this email already exists." };
  const created = { ...user, email };
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify([...readUsers(), created]));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: created.name, email }));
  } catch {
    return { ok: false, message: "Could not save the account in this browser." };
  }
  return { ok: true };
}

export function login(email: string, password: string): { ok: boolean; message?: string } {
  const clean = email.trim().toLowerCase();
  const match = [demoUser, ...readUsers()].find(
    (u) => u.email === clean && u.password === password
  );
  if (!match) return { ok: false, message: "Email or password is incorrect." };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: match.name, email: match.email }));
  } catch {
    return { ok: false, message: "Could not start a session in this browser." };
  }
  return { ok: true };
}

export function getCurrentUser(): { name: string; email: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}