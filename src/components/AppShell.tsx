/**
 * Authenticated app shell.
 * Renders a left navigation rail (collapses on mobile), a top utility bar,
 * and the routed page content inside an Outlet.
 */
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Icon } from "./Icon";
import { usePendingRequests } from "../hooks/usePendingRequests";

interface NavItem {
  to: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  badge?: number;
}

export function AppShell() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolved } = useTheme();
  const navigate = useNavigate();
  const { requests: pending } = usePendingRequests();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav: NavItem[] = [
    { to: "/", label: "Overview", icon: Icon.Dashboard },
    { to: "/pending", label: "Pending", icon: Icon.Inbox, badge: pending.length },
    { to: "/history", label: "History", icon: Icon.History },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-ink-800 dark:bg-ink-900/70 lg:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 hover:bg-ink-100 dark:hover:bg-ink-800"
          aria-label="Toggle navigation"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <div className="font-display text-xl font-semibold tracking-tight">
          Approvals<span className="text-accent">.</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex-shrink-0 transform border-r border-ink-200/70 bg-white px-5 py-6 transition-transform dark:border-ink-800 dark:bg-ink-900 lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-ink-50 dark:bg-accent dark:text-ink-900">
            <Icon.Sparkle width={18} height={18} />
          </div>
          <div className="font-display text-2xl font-semibold tracking-tight">
            Approvals<span className="text-accent">.</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-ink-900 text-ink-50 dark:bg-accent dark:text-ink-900"
                    : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                }`
              }
            >
              <span className="flex items-center gap-3">
                <item.icon width={18} height={18} />
                {item.label}
              </span>
              {item.badge != null && item.badge > 0 && (
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent-deep dark:bg-ink-900/40 dark:text-ink-900">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-10">
          <div className="rounded-xl border border-ink-200/70 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-800/60">
            <div className="truncate text-xs font-medium text-ink-500 dark:text-ink-400">
              Signed in as
            </div>
            <div className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
              {user?.displayName ?? user?.email ?? "Unknown"}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-ink-200/70 p-0.5 dark:border-ink-700">
              <button
                onClick={() => setTheme("light")}
                aria-label="Light theme"
                className={`rounded-md p-1.5 ${
                  theme === "light"
                    ? "bg-ink-900 text-ink-50 dark:bg-accent dark:text-ink-900"
                    : "text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50"
                }`}
              >
                <Icon.Sun width={14} height={14} />
              </button>
              <button
                onClick={() => setTheme("system")}
                aria-label="System theme"
                className={`rounded-md px-1.5 py-1 text-xs font-semibold ${
                  theme === "system"
                    ? "bg-ink-900 text-ink-50 dark:bg-accent dark:text-ink-900"
                    : "text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50"
                }`}
              >
                A
              </button>
              <button
                onClick={() => setTheme("dark")}
                aria-label="Dark theme"
                className={`rounded-md p-1.5 ${
                  theme === "dark"
                    ? "bg-ink-900 text-ink-50 dark:bg-accent dark:text-ink-900"
                    : "text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50"
                }`}
              >
                <Icon.Moon width={14} height={14} />
              </button>
            </div>
            <button onClick={handleSignOut} className="btn-ghost !px-2">
              <Icon.Logout width={16} height={16} />
              <span className="text-xs">Sign out</span>
            </button>
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-widest text-ink-400 dark:text-ink-500">
            Theme · {resolved}
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
