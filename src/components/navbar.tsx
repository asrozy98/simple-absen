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
  ChevronRight,
  User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/dashboard/admin/teachers", label: "Data Guru", icon: Users },
  {
    href: "/dashboard/admin/attendance",
    label: "Absensi",
    icon: ClipboardList,
  },
];

const userLinks = [
  { href: "/dashboard/user/clockin", label: "Absen Hari Ini", icon: Clock },
  { href: "/dashboard/user/history", label: "Riwayat Absen", icon: History },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = session?.user?.role === "admin" ? adminLinks : userLinks;
  const isAdmin = session?.user?.role === "admin";

  return (
    <>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full h-16 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex h-full items-center px-4 sm:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-3 h-9 w-9"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">
              AbsenGuru
            </span>
          </Link>

          {/* Breadcrumb - desktop */}
          <div className="hidden md:flex items-center ml-6 text-sm text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5 mx-1" />
            <span className="font-medium text-foreground">
              {links.find((l) => l.href === pathname)?.label || "Dashboard"}
            </span>
          </div>

          <div className="flex-1" />

          {/* User Info */}
          <div className="flex items-center gap-3">
            {session?.user && (
              <>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAdmin ? "Administrator" : "Guru"}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4.5 w-4.5 text-primary" />
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "hidden sm:inline-flex text-xs font-medium",
                    isAdmin
                      ? "border-primary/20 text-primary bg-primary/5"
                      : "border-emerald-500/20 text-emerald-600 bg-emerald-50",
                  )}
                >
                  {isAdmin ? "Admin" : "Guru"}
                </Badge>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center gap-3 px-5 h-16 border-b">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-sm">AbsenGuru</p>
                  <p className="text-xs text-muted-foreground">
                    Sistem Absensi
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* User Card */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? "Administrator" : "Guru"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-2 space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Keluar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
