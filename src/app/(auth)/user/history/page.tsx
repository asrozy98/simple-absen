"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  History,
  Loader2,
  Search,
  CheckCircle2,
  Timer,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  duration: string | null;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/attendance?userId=${session?.user?.id}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAttendance(data);
        }
      } catch {
        toast.error("Gagal mengambil riwayat absensi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const filtered = attendance.filter(
    (a) =>
      a.date.includes(searchQuery)
  );

  const totalDays = attendance.length;
  const completedDays = attendance.filter((a) => a.timeOut).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Absensi</h1>
        <p className="text-muted-foreground text-sm mt-1">Catatan kehadiran Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDays}</p>
                <p className="text-xs text-muted-foreground">Total Hari</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedDays}</p>
                <p className="text-xs text-muted-foreground">Lengkap</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari tanggal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 bg-white"
        />
      </div>

      {/* Timeline */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <History className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">
                {searchQuery ? "Tidak ada data yang cocok" : "Belum ada riwayat absensi"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((record) => (
                <div key={record.id} className="p-4 hover:bg-muted/20 transition-colors">
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formatDate(record.date)}</p>
                    </div>
                    <div className="ml-auto">
                      {record.timeOut ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Selesai
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
                          <Timer className="h-3 w-3 mr-1" />
                          Bekerja
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Time Details */}
                  <div className="ml-10 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-emerald-50 p-3 text-center border border-emerald-100">
                      <LogInIcon className="h-3.5 w-3.5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-emerald-700">{record.timeIn || "-"}</p>
                      <p className="text-[10px] text-emerald-600/70 mt-0.5">Masuk</p>
                    </div>
                    <div className="rounded-xl bg-red-50 p-3 text-center border border-red-100">
                      <LogOutIcon className="h-3.5 w-3.5 text-red-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-red-700">{record.timeOut || "-"}</p>
                      <p className="text-[10px] text-red-600/70 mt-0.5">Pulang</p>
                    </div>
                    <div className="rounded-xl bg-primary/5 p-3 text-center border border-primary/10">
                      <Timer className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                      <p className="text-sm font-bold text-primary">{record.duration || "-"}</p>
                      <p className="text-[10px] text-primary/70 mt-0.5">Durasi</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  );
}
