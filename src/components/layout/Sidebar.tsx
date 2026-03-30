"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  BarChart2,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  MapPin,
  TrendingUp,
  Flame,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const staffNav = [
  { href: "/admin",              label: "Overview",         icon: LayoutDashboard },
  { href: "/admin/applications", label: "Application Queue", icon: ClipboardList },
  { href: "/admin/residents",    label: "Residents",        icon: Users },
  { href: "/admin/documents",    label: "Documents",        icon: FileText },
  { href: "/admin/disaster",     label: "Disaster & Relief", icon: Flame },
  { href: "/admin/reports",      label: "Reports",          icon: BarChart2 },
];

const superAdminNav = [
  {
    href: "/super-admin",
    label: "System Dashboard",
    icon: ShieldCheck,
  },
  { href: "/super-admin/users", label: "User Management", icon: Users },
  { href: "/super-admin/audit-logs", label: "Audit Logs", icon: History },
  { href: "/super-admin/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  userName,
  userEmail,
  role,
  barangay,
}: {
  userName: string;
  userEmail: string;
  role: string;
  barangay?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isSuperAdmin = role === "SUPER_ADMIN";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function NavItem({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
  }) {
    const active =
      pathname === href ||
      (href !== "/admin" &&
        href !== "/super-admin" &&
        pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${
            active
              ? "bg-makati-blue text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-makati-blue flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              MISP Admin
            </p>
            <p className="text-slate-500 text-[10px] leading-tight">
              Back-Office Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Staff Portal section */}
        <div>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
            Staff Portal
          </p>
          <div className="space-y-0.5">
            {staffNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        </div>

        {/* Super Admin section */}
        {isSuperAdmin && (
          <div>
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
              System Control
            </p>
            <div className="space-y-0.5">
              {superAdminNav.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User info + sign out */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-semibold text-white truncate">{userName}</p>
          <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {isSuperAdmin ? (
              <span className="text-[10px] font-semibold text-makati-gold">
                Super Admin
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <MapPin className="w-2.5 h-2.5" />
                {barangay ? `Brgy. ${barangay}` : "MSWD Staff"}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
