import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUsers, getAttendance, getAllAttendanceWithUser } from "@/lib/google-sheets";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await getUsers();
    const allAttendance = await getAttendance();
    const teachers = users.filter((u) => u.role === "user");

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

    const todayAttendance = allAttendance.filter((a) => a.date === today);
    const clockedIn = todayAttendance.filter((a) => a.timeIn);
    const clockedOut = todayAttendance.filter((a) => a.timeOut);
    const notClockedIn = teachers.filter(
      (t) => !todayAttendance.some((a) => a.userId === t.id && a.timeIn)
    );

    const last7Days: { date: string; label: string; total: number; clockIn: number; clockOut: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
      const dayAttendance = allAttendance.filter((a) => a.date === dateStr);
      last7Days.push({
        date: dateStr,
        label: dayLabel,
        total: dayAttendance.length,
        clockIn: dayAttendance.filter((a) => a.timeIn).length,
        clockOut: dayAttendance.filter((a) => a.timeOut).length,
      });
    }

    const monthlyStats: { month: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      const monthAttendance = allAttendance.filter((a) => a.date.startsWith(monthStr));
      monthlyStats.push({
        month: monthStr,
        label: monthLabel,
        total: monthAttendance.length,
      });
    }

    const hourlyDistribution: { hour: string; count: number }[] = [];
    for (let h = 6; h <= 18; h++) {
      const hourStr = String(h).padStart(2, "0");
      const count = todayAttendance.filter((a) => {
        if (!a.timeIn) return false;
        const hour = a.timeIn.split(":")[0];
        return hour === hourStr;
      }).length;
      hourlyDistribution.push({ hour: `${hourStr}:00`, count });
    }

    const allWithUser = await getAllAttendanceWithUser();
    const recentAttendance = allWithUser.slice(0, 10);

    return NextResponse.json({
      totalTeachers: teachers.length,
      totalAdmin: users.filter((u) => u.role === "admin").length,
      todayStats: {
        total: todayAttendance.length,
        clockedIn: clockedIn.length,
        clockedOut: clockedOut.length,
        notClockedIn: notClockedIn.length,
        notClockedInNames: notClockedIn.map((t) => t.name),
      },
      last7Days,
      monthlyStats,
      hourlyDistribution,
      recentAttendance,
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data dashboard" }, { status: 500 });
  }
}
