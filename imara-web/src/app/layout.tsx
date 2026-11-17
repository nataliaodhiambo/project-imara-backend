"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Users, CalendarDays, Settings, LogOut } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";

const tabs = [
  {
    label: "Roster",
    href: "/dashboard",
    icon: Users,
    match: (p: string) => p.startsWith("/dashboard") || p.startsWith("/athletes"),
  },
  {
    label: "Sessions",
    href: "/sessions",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/sessions"),
  },
  {
    label: "Settings",
    href: null,
    icon: Settings,
    match: () => false,
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname === "/" || pathname === "/login";
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setAuthed(true);
      setUserName(user.name);
    } else {
      setAuthed(false);
      if (!isPublic) router.replace("/login");
    }
  }, [pathname, isPublic, router]);

  function handleLogout() {
    logout();
    setAuthed(false);
    router.push("/");
  }

  return (
    <html lang="en">
      <head>
        <title>Project Imara</title>
        <meta
          name="description"
          content="Real-Time Athlete Performance & Injury Risk Monitoring"
        />
      </head>
      <body className="min-h-screen bg-imara-black font-sans text-white antialiased">
        {isPublic ? (
          children
        ) : !authed ? null : (
          <div className="flex min-h-screen flex-col">
            {/* Top navbar */}
            <header className="sticky top-0 z-40 border-b border-imara-border bg-imara-black">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
                <button
                  onClick={() => router.push("/")}
                  className="text-lg font-bold tracking-[0.2em] text-imara-pink"
                >
                  PROJECT IMARA
                </button>
                <div className="flex items-center gap-4">
                  <span className="hidden text-sm text-imara-grey sm:inline">{userName}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-lg border border-imara-border px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-imara-pink hover:text-imara-pink"
                  >
                    <LogOut size={13} />
                    Log out
                  </button>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-28 pt-8">
              {children}
            </main>

            {/* Bottom nav */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-imara-border bg-imara-surface">
              <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = tab.match(pathname);
                  return (
                    <button
                      key={tab.label}
                      onClick={() => tab.href && router.push(tab.href)}
                      title={tab.href ? undefined : "Coming in a later sprint"}
                      className={`flex flex-col items-center gap-1 px-6 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "text-imara-pink"
                          : "text-imara-grey hover:text-white"
                      }`}
                    >
                      <Icon size={20} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        )}
      </body>
    </html>
  );
}