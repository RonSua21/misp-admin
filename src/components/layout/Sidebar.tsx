"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Users, BarChart2, ShieldCheck,
  History, Settings, LogOut, MapPin, TrendingUp, Flame, Megaphone,
  Briefcase, Award, CalendarDays, ArrowLeftRight, UserPlus,
  Menu, X, Sun, Moon, User,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";

const staffNav = [
  { href: "/admin",               label: "Overview",          icon: LayoutDashboard },
  { href: "/admin/intake",        label: "Intake & Apply",    icon: UserPlus },
  { href: "/admin/residents",     label: "Residents",         icon: Users },
  { href: "/admin/applications",  label: "Applications",      icon: ClipboardList },
  { href: "/admin/cases",         label: "Case Management",   icon: Briefcase },
  { href: "/admin/certificates",  label: "Certificates",      icon: Award },
  { href: "/admin/appointments",  label: "Appointments",      icon: CalendarDays },
  { href: "/admin/disaster",      label: "Disaster & Relief", icon: Flame },
  { href: "/admin/referrals",     label: "Referrals",         icon: ArrowLeftRight },
  { href: "/admin/announcements", label: "Announcements",     icon: Megaphone },
  { href: "/admin/reports",       label: "Reports",           icon: BarChart2 },
];

const superAdminNav = [
  { href: "/super-admin",          label: "System Dashboard", icon: ShieldCheck },
  { href: "/super-admin/users",    label: "User Management",  icon: Users },
  { href: "/super-admin/audit-logs", label: "Audit Logs",     icon: History },
  { href: "/super-admin/analytics", label: "Analytics",       icon: TrendingUp },
  { href: "/super-admin/settings", label: "Settings",         icon: Settings },
];

export default function Sidebar({
  userName, userEmail, role, barangay,
}: {
  userName: string;
  userEmail: string;
  role: string;
  barangay?: string | null;
}) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { theme, toggle } = useTheme();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [profileOpen]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href ||
      (href !== "/admin" && href !== "/super-admin" && pathname.startsWith(href));
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="
        fixed inset-y-0 left-0 z-40 hidden md:flex flex-col
        w-16 hover:w-64
        bg-slate-950
        border-r border-slate-800
        transition-[width] duration-300 ease-in-out
        overflow-hidden scrollbar-none
        group
      ">
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b-2 border-makati-gold shrink-0 bg-makati-blue">
          <Link href="/admin" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
              <span className="text-makati-blue font-black text-sm">M</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              <p className="text-white font-bold text-sm leading-tight">MSWD Makati</p>
              <p className="text-blue-300 text-[10px] leading-tight">Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-hidden px-2 py-4 space-y-4">
          {/* Staff Portal */}
          <div>
            <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
              text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-2 whitespace-nowrap">
              Staff Portal
            </p>
            <div className="space-y-0.5">
              {staffNav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive(href)
                      ? "bg-makati-blue text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* System Control */}
          {isSuperAdmin && (
            <div>
              <p className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-2 whitespace-nowrap">
                System Control
              </p>
              <div className="space-y-0.5">
                {superAdminNav.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive(href)
                        ? "bg-makati-blue text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Profile button */}
        <div className="shrink-0 border-t border-slate-800 py-2 px-2">
          <button
            onClick={() => setProfileOpen(p => !p)}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-makati-blue/20 flex items-center justify-center shrink-0">
              <span className="text-makati-blue font-semibold text-xs">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-left overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Profile popup ────────────────────────────────── */}
      {profileOpen && (
        <div ref={profileRef} className="hidden md:block fixed bottom-[68px] left-2 z-50
          w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1">
          <div className="px-4 py-2.5 border-b border-slate-700">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
            <p className="text-[10px] text-makati-gold mt-0.5">
              {isSuperAdmin ? "Super Admin" : `Brgy. ${barangay ?? "MSWD Staff"}`}
            </p>
          </div>
          <Link
            href="/super-admin/users"
            onClick={() => setProfileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/60 transition-colors"
          >
            <User className="w-4 h-4 shrink-0 text-slate-500" />
            Profile
          </Link>
          <Link
            href="/super-admin/settings"
            onClick={() => setProfileOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/60 transition-colors"
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-500" />
            Settings
          </Link>
          <div className="border-t border-slate-700 mt-1 pt-1">
            <button
              onClick={() => { setProfileOpen(false); signOut(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile top bar ───────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14
        bg-makati-blue border-b-2 border-makati-gold
        flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-makati-blue font-black text-sm">M</span>
          </div>
          <p className="text-white font-bold text-sm">MSWD Admin</p>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b-2 border-makati-gold bg-makati-blue">
              <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <span className="text-makati-blue font-black text-sm">M</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">MSWD Makati</p>
                  <p className="text-blue-300 text-[10px] leading-tight">Admin Portal</p>
                </div>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
                  Staff Portal
                </p>
                <div className="space-y-0.5">
                  {staffNav.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive(href)
                          ? "bg-makati-blue text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              {isSuperAdmin && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
                    System Control
                  </p>
                  <div className="space-y-0.5">
                    {superAdminNav.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                          ${isActive(href)
                            ? "bg-makati-blue text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Bottom */}
            <div className="px-3 py-4 border-t border-slate-800 space-y-1">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                <p className="text-[10px] text-makati-gold mt-0.5">
                  {isSuperAdmin ? "Super Admin" : `Brgy. ${barangay ?? "MSWD Staff"}`}
                </p>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
