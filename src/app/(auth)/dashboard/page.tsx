"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ClipboardCheck,
  Clock,
  UserX,
  Loader2,
  TrendingUp,
  ArrowRight,
  CalendarDays,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardData {
  totalTeachers: number;
  totalAdmin: number;
  todayStats: {
    total: number;
    clockedIn: number;
    clockedOut: number;
    notClockedIn: number;
    notClockedInNames: string[];
  };
  last7Days: {
    date: string;
    label: string;
    total: number;
    clockIn: number;
    clockOut: number;
  }[];
  monthlyStats: {
    month: string;
    label: string;
    total: number;
  }[];
  hourlyDistribution: { hour: string; count: number }[];
  recentAttendance: {
    id: string;
    userId: string;
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    duration: string | null;
    userName: string;
  }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok && !cancelled) {
          const result = await res.json();
          setData(result);
        }
      } catch {
        toast.error("Gagal memuat data dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Gagal memuat data</p>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "admin";
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const attendanceRate =
    data.totalTeachers > 0
      ? Math.round((data.todayStats.clockedIn / data.totalTeachers) * 100)
      : 0;

  const pieData = [
    { name: "Hadir", value: data.todayStats.clockedIn, color: "#10b981" },
    {
      name: "Belum Absen",
      value: data.todayStats.notClockedIn,
      color: "#f59e0b",
    },
    { name: "Pulang", value: data.todayStats.clockedOut, color: "#6366f1" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p
            suppressHydrationWarning
            className="text-muted-foreground text-sm mt-1"
          >
            {today}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Lihat Semua Absensi
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalTeachers}</p>
                <p className="text-xs text-muted-foreground">Total Guru</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.todayStats.clockedIn}
                </p>
                <p className="text-xs text-muted-foreground">Hadir Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <UserX className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.todayStats.notClockedIn}
                </p>
                <p className="text-xs text-muted-foreground">Belum Absen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-violet-50 to-violet-100/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.todayStats.clockedOut}
                </p>
                <p className="text-xs text-muted-foreground">Sudah Pulang</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate Banner */}
      <Card className="border-0 shadow-sm overflow-hidden py-0">
        <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-5 sm:p-6 text-primary-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-primary-foreground/80">
                Tingkat Kehadiran Hari Ini
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold">{attendanceRate}%</p>
                <p className="text-sm text-primary-foreground/70">
                  dari {data.totalTeachers} guru
                </p>
              </div>
            </div>
            <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Hadir", value: attendanceRate },
                      { name: "Lainnya", value: 100 - attendanceRate },
                    ]}
                    innerRadius={25}
                    outerRadius={40}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="rgba(255,255,255,0.9)" />
                    <Cell fill="rgba(255,255,255,0.15)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              Hadir: {data.todayStats.clockedIn}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              Belum: {data.todayStats.notClockedIn}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
              <div className="h-2 w-2 rounded-full bg-white/60" />
              Pulang: {data.todayStats.clockedOut}
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                Absensi 7 Hari Terakhir
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.last7Days}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="clockIn"
                    name="Masuk"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="clockOut"
                    name="Pulang"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Today Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold">
                Status Kehadiran Hari Ini
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[250px] flex items-center justify-center">
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            <CardTitle className="text-sm font-semibold">
              Tren Absensi 6 Bulan Terakhir
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.monthlyStats}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Absen"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Not Clocked In List */}
      {isAdmin && data.todayStats.notClockedInNames.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">
                Guru Belum Absen Hari Ini
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {data.todayStats.notClockedInNames.map((name, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-amber-200 text-amber-700 bg-amber-50 font-normal"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                Absensi Terbaru
              </CardTitle>
            </div>
            {isAdmin && (
              <Link
                href="/attendance"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Lihat semua
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Masuk
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pulang
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Durasi
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentAttendance.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-sm">{a.userName}</span>
                    </td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">
                      {new Date(a.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant="outline"
                        className="border-emerald-200 text-emerald-600 bg-emerald-50 text-xs"
                      >
                        {a.timeIn || "-"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant="outline"
                        className="border-violet-200 text-violet-600 bg-violet-50 text-xs"
                      >
                        {a.timeOut || "-"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">
                      {a.duration || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y">
            {data.recentAttendance.map((a) => (
              <div key={a.id} className="py-3">
                <p className="font-medium text-sm">{a.userName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(a.date).toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <div className="flex gap-3 mt-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Masuk
                    </p>
                    <Badge
                      variant="outline"
                      className="border-emerald-200 text-emerald-600 bg-emerald-50 text-xs"
                    >
                      {a.timeIn || "-"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Pulang
                    </p>
                    <Badge
                      variant="outline"
                      className="border-violet-200 text-violet-600 bg-violet-50 text-xs"
                    >
                      {a.timeOut || "-"}
                    </Badge>
                  </div>
                  {a.duration && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Durasi
                      </p>
                      <p className="text-xs font-medium">{a.duration}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
