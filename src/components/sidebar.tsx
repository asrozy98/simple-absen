"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  Users,
  ClipboardList,
  Clock,
  History,
  Menu,
  X,
  GraduationCap,
  User,
  Home,
  KeyRound,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/teachers", label: "Data Guru", icon: Users },
  { href: "/attendance", label: "Rekam Absensi", icon: ClipboardList },
];

const userLinks = [
  { href: "/user/clockin", label: "Absen Hari Ini", icon: Clock },
  { href: "/user/history", label: "Riwayat Absen", icon: History },
];

function SidebarContent({
  links,
  pathname,
  session,
  isAdmin,
  onLinkClick,
}: {
  links: typeof adminLinks;
  pathname: string;
  session: ReturnType<typeof useSession>["data"];
  isAdmin: boolean;
  onLinkClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-sidebar-border shrink-0 animate-slide-in-left">
        <div className="h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-md shadow-sidebar-primary/30">
          <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white">AbsenGuru</p>
          <p className="text-[11px] text-sidebar-foreground/60">Sistem Absensi Sekolah</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <Link
          href="/dashboard"
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/dashboard"
              ? "bg-white/10 text-white"
              : "text-sidebar-foreground/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Home className="h-[18px] w-[18px]" />
          Dashboard
        </Link>

        <div className="pt-2 pb-1 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">
            Menu
          </p>
        </div>

        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-white shadow-lg shadow-sidebar-primary/25"
                  : "text-sidebar-foreground/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {link.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}

        <div className="pt-4 pb-1 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">
            Akun
          </p>
        </div>
        <Link
          href="/profile/change-password"
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/profile/change-password"
              ? "bg-sidebar-primary text-white shadow-lg shadow-sidebar-primary/25"
              : "text-sidebar-foreground/60 hover:text-white hover:bg-white/5"
          )}
        >
          <KeyRound className="h-[18px] w-[18px]" />
          Ganti Password
          {pathname === "/profile/change-password" && (
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
          )}
        </Link>
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-sidebar-border">
        {/* User Card */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
              <Badge
                variant="outline"
                className={cn(
                  "mt-0.5 text-[10px] font-medium px-1.5 py-0 h-4 border-0",
                  isAdmin
                    ? "bg-sidebar-primary/20 text-sidebar-primary"
                    : "bg-emerald-500/20 text-emerald-400"
                )}
              >
                {isAdmin ? "Administrator" : "Guru"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 pb-3 pt-1">
          <button
            onClick={() => signOut({ callbackUrl: window.location.origin })}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = session?.user?.role === "admin" ? adminLinks : userLinks;
  const isAdmin = session?.user?.role === "admin";

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-white/80 backdrop-blur-lg border-b border-border/50 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 mr-2"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">AbsenGuru</span>
        </Link>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: window.location.origin })}
          className="text-muted-foreground text-xs"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[280px] animate-in slide-in-from-left duration-200">
            <SidebarContent
              links={links}
              pathname={pathname}
              session={session}
              isAdmin={isAdmin}
              onLinkClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-[260px] lg:flex-col">
        <SidebarContent
          links={links}
          pathname={pathname}
          session={session}
          isAdmin={isAdmin}
        />
      </aside>
    </>
  );
}
