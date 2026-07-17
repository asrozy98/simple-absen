"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClipboardList, Loader2, Clock, Search, CheckCircle2, Timer, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  duration: string | null;
  userName: string;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/attendance");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAttendance(data);
        }
      } catch {
        toast.error("Gagal mengambil data absensi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const filtered = attendance.filter(
    (a) =>
      a.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.date.includes(searchQuery)
  );

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const todayCount = attendance.filter((a) => a.date === today).length;
  const completedCount = attendance.filter((a) => a.date === today && a.timeOut).length;
  const activeCount = attendance.filter((a) => a.date === today && a.timeIn && !a.timeOut).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekam Absensi</h1>
        <p className="text-muted-foreground text-sm mt-1">Pantau kehadiran semua guru hari ini</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{todayCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Hadir Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{completedCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{activeCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Sedang Bekerja</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama guru atau tanggal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 bg-white"
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ClipboardList className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">
                {searchQuery ? "Tidak ada data yang cocok" : "Belum ada rekam absensi"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">No</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Guru</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Masuk</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pulang</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durasi</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((record, index) => (
                      <tr
                        key={record.id}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3.5 px-5 text-sm text-muted-foreground">{index + 1}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                              {record.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{record.userName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-muted-foreground">{formatDate(record.date)}</td>
                        <td className="py-3.5 px-5">
                          {record.timeIn ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span className="text-sm font-medium">{record.timeIn}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          {record.timeOut ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              <span className="text-sm font-medium">{record.timeOut}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-sm font-medium">{record.duration || "-"}</td>
                        <td className="py-3.5 px-5">
                          {record.timeOut ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Selesai
                            </Badge>
                          ) : record.timeIn ? (
                            <Badge className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50">
                              <Timer className="h-3 w-3 mr-1" />
                              Bekerja
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Absen
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {filtered.map((record) => (
                  <div key={record.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                          {record.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{record.userName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                        </div>
                      </div>
                      {record.timeOut ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">
                          Selesai
                        </Badge>
                      ) : record.timeIn ? (
                        <Badge className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
                          Bekerja
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 ml-[46px]">
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <Clock className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
                        <p className="text-xs font-medium">{record.timeIn || "-"}</p>
                        <p className="text-[10px] text-muted-foreground">Masuk</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <Clock className="h-3 w-3 text-red-500 mx-auto mb-0.5" />
                        <p className="text-xs font-medium">{record.timeOut || "-"}</p>
                        <p className="text-[10px] text-muted-foreground">Pulang</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2 text-center">
                        <Timer className="h-3 w-3 text-primary mx-auto mb-0.5" />
                        <p className="text-xs font-medium">{record.duration || "-"}</p>
                        <p className="text-[10px] text-muted-foreground">Durasi</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
