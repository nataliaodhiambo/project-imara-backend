"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { login, registerUser } from "@/lib/auth";

const fieldClass =
  "w-full rounded-xl border border-imara-border bg-imara-card px-4 py-2.5 text-sm text-white placeholder:text-imara-grey focus:border-imara-pink focus:outline-none";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-wider text-imara-grey";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      const result = registerUser({ name: name.trim(), email, password });
      if (!result.ok) {
        setError(result.message ?? "Could not create the account.");
        return;
      }
    } else {
      const result = login(email, password);
      if (!result.ok) {
        setError(result.message ?? "Could not sign in.");
        return;
      }
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-imara-black px-6 py-8">
      <button
        onClick={() => router.push("/")}
        className="self-start text-lg font-bold tracking-[0.2em] text-imara-pink"
      >
        PROJECT IMARA
      </button>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-imara-border bg-imara-surface p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-imara-pink">
            Staff access
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            {mode === "signin" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-1 text-sm text-imara-grey">
            {mode === "signin"
              ? "Sign in to your workspace."
              : "Add a new staff member to the system."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className={labelClass}>Full Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amina Wanjiru"
                  className={fieldClass}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className={labelClass}>Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@club.com"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
            </div>

            {error && <p className="text-sm text-imara-pink">{error}</p>}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-imara-pink px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight size={16} />
            </button>
          </form>

          {mode === "signin" && (
            <div className="mt-6 rounded-xl border border-imara-border bg-imara-card p-4 text-xs text-imara-grey">
              <p className="font-semibold text-white">Demo account</p>
              <p className="mt-1">coach@imara.demo</p>
              <p>imara2026</p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-imara-grey">
            {mode === "signin" ? "No account yet? " : "Already have an account? "}
            <button
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-white hover:underline"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}