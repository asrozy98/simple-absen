"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogIn,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Timer,
  BookOpen,
  GraduationCap,
  Building,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface TodayAttendance {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  duration: string | null;
}

interface ScheduleItem {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  room: string;
}

// Helper function to determine schedule status
function getScheduleStatus(schedule: ScheduleItem) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;

  if (
    currentTimeInMinutes >= startTimeInMinutes &&
    currentTimeInMinutes <= endTimeInMinutes
  ) {
    return {
      status: "ongoing",
      currentTimeInMinutes,
      startTimeInMinutes,
      endTimeInMinutes,
    };
  } else if (currentTimeInMinutes > endTimeInMinutes) {
    return {
      status: "completed",
      currentTimeInMinutes,
      startTimeInMinutes,
      endTimeInMinutes,
    };
  } else {
    return {
      status: "upcoming",
      currentTimeInMinutes,
      startTimeInMinutes,
      endTimeInMinutes,
    };
  }
}

// Progress value 0-100 for a schedule based on current time
function getProgressValue({
  status,
  currentTimeInMinutes,
  startTimeInMinutes,
  endTimeInMinutes,
}: ReturnType<typeof getScheduleStatus>) {
  if (status === "completed") return 100;
  if (status === "upcoming") return 0;
  return Math.min(
    100,
    Math.max(
      0,
      ((currentTimeInMinutes - startTimeInMinutes) /
        (endTimeInMinutes - startTimeInMinutes)) *
        100,
    ),
  );
}

// Vertical Timeline Component (Mobile)
function VerticalTimeline({ schedules }: { schedules: ScheduleItem[] }) {
  // Find the latest completed schedule index
  let lastCompletedIndex = -1;
  for (let i = 0; i < schedules.length; i++) {
    const { status } = getScheduleStatus(schedules[i]);
    if (status === "completed") {
      lastCompletedIndex = i;
    } else {
      break;
    }
  }

  return (
    <div className="relative">
      {/* Vertical Timeline Line - Continuous Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 z-0 bg-gradient-to-b from-primary/40 via-primary/30 to-emerald-500/20">
        {/* Highlight for completed segment */}
        <div
          className="absolute top-0 w-full bg-primary/40"
          style={{
            height: `${(lastCompletedIndex + 1) * (100 / schedules.length)}%`,
          }}
        ></div>
        {/* Highlight for ongoing segment */}
        {lastCompletedIndex + 1 < schedules.length && (
          <div
            className={`absolute w-full bg-primary animate-pulse`}
            style={{
              top: `${(lastCompletedIndex + 1) * (100 / schedules.length)}%`,
              height: `${100 / schedules.length}%`,
            }}
          ></div>
        )}
      </div>

      {/* Schedule Items */}
      <div className="relative space-y-6">
        {schedules.map((schedule, index) => {
          const statusInfo = getScheduleStatus(schedule);
          const { startTimeInMinutes, endTimeInMinutes } = statusInfo;
          const { status } = statusInfo;

          const isLeft = index % 2 === 0;

          return (
            <div
              key={schedule.id}
              className={`relative flex min-h-[80px] ${isLeft ? "justify-start" : "justify-end"}`}
            >
              {/* Timeline Node */}
              <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border-4 border-white shadow-md ${status === "ongoing" ? "bg-primary animate-pulse" : status === "completed" ? "bg-primary/40" : "bg-emerald-500"}`}
              >
                <div className="h-full w-full flex items-center justify-center text-[10px]">
                  {status === "ongoing" && "⚡"}
                  {status === "completed" && "✓"}
                  {status === "upcoming" && "⏰"}
                </div>
              </div>

              {/* Schedule Card */}
              <div
                className={`w-[calc(50%-20px)] min-w-[140px] ${isLeft ? "pr-6" : "pl-6"} animate-fade-in-up-delay-${(index % 3) + 1}`}
              >
                <div
                  className={`border rounded-lg p-3 hover-lift transition-all ${status === "ongoing" ? "bg-primary/10 border-primary animate-pulse" : status === "completed" ? "bg-muted/30 border-muted opacity-80" : "bg-emerald-50 border-emerald-200"}`}
                >
                  {/* Time Slot */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <div className="flex flex-col">
                        <div className="font-mono font-bold text-sm md:text-base">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>
                            {Math.floor(
                              (endTimeInMinutes - startTimeInMinutes) / 60,
                            )}
                            j{" "}
                            {Math.floor(
                              (endTimeInMinutes - startTimeInMinutes) % 60,
                            )}
                            m
                          </div>
                        </div>
                      </div>
                      <div
                        className={`h-9 w-9 rounded-lg flex-shrink-0 ${status === "ongoing" ? "bg-primary/20" : status === "completed" ? "bg-muted" : "bg-emerald-100"} flex items-center justify-center`}
                      >
                        <span className="font-bold text-xs">
                          {status === "ongoing"
                            ? "⚡"
                            : status === "completed"
                              ? "✓"
                              : "⏰"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subject & Class */}
                  <div className="space-y-1">
                    <div className="font-semibold text-xs line-clamp-1">
                      {schedule.subject}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between">
                      <div className="flex items-center gap-1 text-xs">
                        <GraduationCap className="h-3 w-3 text-muted-foreground" />
                        <span className="line-clamp-1">
                          {schedule.className}
                        </span>
                      </div>
                      {schedule.room && (
                        <div className="flex items-center gap-1 text-xs">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="line-clamp-1">{schedule.room}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-2">
                    <Progress
                      value={getProgressValue(statusInfo)}
                      className="h-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <div>
                        {status === "ongoing"
                          ? "Sedang berlangsung..."
                          : status === "completed"
                            ? "Selesai"
                            : "Akan datang"}
                      </div>
                      <span>
                        {index + 1}/{schedules.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Horizontal Timeline Component (Desktop)
function HorizontalTimeline({ schedules }: { schedules: ScheduleItem[] }) {
  const now = new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="relative">
      {/* Schedule Cards Container */}
      <div className="relative flex flex-nowrap overflow-x-auto pb-12 gap-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent z-10">
        {schedules.map((schedule, index) => {
          const statusInfo = getScheduleStatus(schedule);
          const { startTimeInMinutes, endTimeInMinutes } = statusInfo;
          const { status } = statusInfo;

          return (
            <div
              key={schedule.id}
              className="relative flex flex-col items-center px-2"
            >
              {/* Schedule Card */}
              <div
                className={`flex-shrink-0 w-[260px] md:w-[300px] snap-center border rounded-xl p-4 transition-all duration-300 ${status === "ongoing" ? "bg-primary/10 border-primary hover:bg-primary/20 animate-pulse" : status === "completed" ? "bg-muted/30 border-muted hover:bg-muted/40 opacity-80" : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"} hover-scale animate-fade-in-up-delay-${(index % 3) + 1}`}
              >
                {/* Time Slot */}
                <div className="mb-3">
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <div className="flex flex-col">
                      <div className="font-mono font-bold text-sm md:text-base">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>
                          {Math.floor(
                            (endTimeInMinutes - startTimeInMinutes) / 60,
                          )}
                          j{" "}
                          {Math.floor(
                            (endTimeInMinutes - startTimeInMinutes) % 60,
                          )}
                          m
                        </div>
                      </div>
                    </div>
                    <div
                      className={`h-9 w-9 rounded-lg flex-shrink-0 ${status === "ongoing" ? "bg-primary/20" : status === "completed" ? "bg-muted" : "bg-emerald-100"} flex items-center justify-center`}
                    >
                      <span className="font-bold text-xs">
                        {status === "ongoing"
                          ? "⚡"
                          : status === "completed"
                            ? "✓"
                            : "⏰"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subject & Class */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                    <span className="font-semibold text-xs md:text-sm line-clamp-1">
                      {schedule.subject}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs md:text-sm line-clamp-1">
                        {schedule.className}
                      </span>
                    </div>

                    {schedule.room && (
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs md:text-sm line-clamp-1">
                          {schedule.room}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-3">
                  <Progress
                    value={getProgressValue(statusInfo)}
                    className="h-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <div>
                      {status === "ongoing"
                        ? "Sedang berlangsung..."
                        : status === "completed"
                          ? "Selesai"
                          : "Akan datang"}
                    </div>
                    <span>
                      {index + 1}/{schedules.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Node Below Card */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                <div
                  className={`h-4 w-4 rounded-full border-2 border-white shadow-md ${status === "ongoing" ? "bg-primary animate-pulse" : status === "completed" ? "bg-primary/40" : "bg-emerald-500"}`}
                >
                  <div className="h-full w-full flex items-center justify-center text-[8px]">
                    {status === "ongoing" && "⚡"}
                    {status === "completed" && "✓"}
                    {status === "upcoming" && "⏰"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Horizontal Timeline Line BELOW Cards */}
      <div className="absolute left-0 right-0 bottom-4 z-0">
        <Progress
          value={(currentTimeInMinutes / (24 * 60)) * 100}
          className="h-0.5"
        />
      </div>
    </div>
  );
}

export default function ClockinPage() {
  const { data: session } = useSession();
  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [todaySchedules, setTodaySchedules] = useState<
    Array<{
      id: string;
      day: string;
      startTime: string;
      endTime: string;
      subject: string;
      className: string;
      room: string;
    }>
  >([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    async function load() {
      try {
        const [attendanceRes, schedulesRes] = await Promise.all([
          fetch(`/api/attendance?userId=${session?.user?.id}`),
          fetch("/api/schedules"),
        ]);

        if (!cancelled) {
          // Load attendance
          if (attendanceRes.ok) {
            const data = await attendanceRes.json();
            const today = new Date().toLocaleDateString("en-CA", {
              timeZone: "Asia/Jakarta",
            });
            const todayRecord = data.find(
              (a: TodayAttendance) => a.date === today,
            );
            setTodayAttendance(todayRecord || null);
          }

          // Load today's schedules
          if (schedulesRes.ok) {
            const schedulesData = await schedulesRes.json();
            const today = new Date().toLocaleDateString("id-ID", {
              timeZone: "Asia/Jakarta",
              weekday: "long",
            });
            // Capitalize first letter (e.g., "senin" → "Senin")
            const todayDay =
              today.charAt(0).toUpperCase() + today.slice(1).toLowerCase();
            const todaysSchedules = schedulesData
              .filter((s: { day: string }) => s.day === todayDay)
              .sort((a: { startTime: string }, b: { startTime: string }) =>
                a.startTime.localeCompare(b.startTime),
              );
            setTodaySchedules(todaysSchedules);
          }
        }
      } catch {
        toast.error("Gagal mengambil data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleClockIn() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clockin" }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Gagal absen masuk");
        return;
      }
      toast.success("Berhasil absen masuk!");
      const attendanceRes = await fetch(
        `/api/attendance?userId=${session?.user?.id}`,
      );
      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        const today = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        });
        const todayRecord = data.find((a: TodayAttendance) => a.date === today);
        setTodayAttendance(todayRecord || null);
      }
    } catch {
      toast.error("Gagal absen masuk");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClockOut() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clockout" }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Gagal absen pulang");
        return;
      }
      toast.success("Berhasil absen pulang!");
      const attendanceRes = await fetch(
        `/api/attendance?userId=${session?.user?.id}`,
      );
      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        const today = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Jakarta",
        });
        const todayRecord = data.find((a: TodayAttendance) => a.date === today);
        setTodayAttendance(todayRecord || null);
      }
    } catch {
      toast.error("Gagal absen pulang");
    } finally {
      setSubmitting(false);
    }
  }

  const hasClockedIn = !!todayAttendance?.timeIn;
  const hasClockedOut = !!todayAttendance?.timeOut;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Absen Hari Ini</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selamat datang,{" "}
          <span className="font-medium text-foreground">
            {session?.user?.name}
          </span>
        </p>
      </div>

      {/* Clock Card */}
      <Card className="border-0 shadow-sm hover-lift overflow-hidden py-0">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 sm:p-8 text-primary-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <p
                suppressHydrationWarning
                className="text-primary-foreground/70 text-sm font-medium mb-1"
              >
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p
                suppressHydrationWarning
                className="text-4xl sm:text-5xl font-bold font-mono tracking-tight"
              >
                {currentTime ||
                  new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
                <LogIn className="h-4 w-4 mx-auto mb-1 opacity-80" />
                <p className="text-xs text-primary-foreground/70">Masuk</p>
                <p className="font-bold text-sm mt-0.5">
                  {todayAttendance?.timeIn || "-"}
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
                <LogOut className="h-4 w-4 mx-auto mb-1 opacity-80" />
                <p className="text-xs text-primary-foreground/70">Pulang</p>
                <p className="font-bold text-sm mt-0.5">
                  {todayAttendance?.timeOut || "-"}
                </p>
              </div>
              {todayAttendance?.duration && (
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <Timer className="h-4 w-4 mx-auto mb-1 opacity-80" />
                  <p className="text-xs text-primary-foreground/70">Durasi</p>
                  <p className="font-bold text-sm mt-0.5">
                    {todayAttendance.duration}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Area */}
      {loading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Clock In Card */}
          <Card
            className={`border-0 shadow-sm hover-lift transition-all ${
              hasClockedIn
                ? "bg-emerald-50/50"
                : "hover:shadow-md cursor-pointer"
            }`}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <div
                  className={`h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                    hasClockedIn ? "bg-emerald-100" : "bg-primary/10"
                  }`}
                >
                  {hasClockedIn ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <LogIn className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h3 className="font-semibold mb-1">Absen Masuk</h3>
                {hasClockedIn ? (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {todayAttendance?.timeIn}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    Klik untuk absen masuk hari ini
                  </p>
                )}
                {!hasClockedIn && (
                  <Button
                    className="w-full mt-4 shadow-md shadow-primary/20 hover-scale"
                    onClick={handleClockIn}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    Absen Masuk
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clock Out Card */}
          <Card
            className={`border-0 shadow-sm hover-lift transition-all ${
              !hasClockedIn
                ? "bg-muted/30 opacity-60"
                : hasClockedOut
                  ? "bg-emerald-50/50"
                  : "hover:shadow-md cursor-pointer"
            }`}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <div
                  className={`h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                    hasClockedOut
                      ? "bg-emerald-100"
                      : hasClockedIn
                        ? "bg-red-50"
                        : "bg-muted"
                  }`}
                >
                  {hasClockedOut ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <LogOut
                      className={`h-8 w-8 ${hasClockedIn ? "text-red-500" : "text-muted-foreground"}`}
                    />
                  )}
                </div>
                <h3 className="font-semibold mb-1">Absen Pulang</h3>
                {hasClockedOut ? (
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {todayAttendance?.timeOut}
                  </Badge>
                ) : !hasClockedIn ? (
                  <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Absen masuk terlebih dahulu
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    Klik untuk absen pulang
                  </p>
                )}
                {hasClockedIn && !hasClockedOut && (
                  <Button
                    className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 hover-scale"
                    onClick={handleClockOut}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Absen Pulang
                  </Button>
                )}
                {hasClockedOut && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs text-emerald-600 font-medium">
                      Absen hari ini sudah selesai!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today Summary */}
      {hasClockedIn && (
        <Card className="border-0 shadow-sm bg-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {hasClockedOut
                  ? "Anda telah menyelesaikan absensi hari ini. Sampai jumpa besok!"
                  : "Anda sudah absen masuk. Jangan lupa untuk absen pulang nanti."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule Timeline - Dual Mode (Vertical Mobile / Horizontal Desktop) */}
      {todaySchedules.length > 0 && (
        <Card className="border-0 shadow-sm hover-lift animate-fade-in">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Jadwal Mengajar Hari Ini
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {todaySchedules.length} sesi
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
            </div>

            {/* Dual Mode Timeline */}
            <div className="relative">
              {/* Mobile Vertical Timeline */}
              <div className="lg:hidden">
                <VerticalTimeline schedules={todaySchedules} />
              </div>

              {/* Desktop Horizontal Timeline */}
              <div className="hidden lg:block">
                <HorizontalTimeline schedules={todaySchedules} />
              </div>

              {/* Timeline Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span>Akan Datang</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                  <span>Sedang Berlangsung</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                  <span>Selesai</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Schedule Today */}
      {!loading && todaySchedules.length === 0 && (
        <Card className="border-0 shadow-sm bg-muted/10">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Tidak ada jadwal mengajar hari ini
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Hubungi administrator untuk mengatur jadwal
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
