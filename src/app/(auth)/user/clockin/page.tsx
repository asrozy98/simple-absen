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
} from "lucide-react";
import { toast } from "sonner";

interface TodayAttendance {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  duration: string | null;
}

export default function ClockinPage() {
  const { data: session } = useSession();
  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/attendance?userId=${session?.user?.id}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          const today = new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Jakarta",
          });
          const todayRecord = data.find(
            (a: TodayAttendance) => a.date === today,
          );
          if (!cancelled) setTodayAttendance(todayRecord || null);
        }
      } catch {
        toast.error("Gagal mengambil data absensi");
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
    </div>
  );
}
