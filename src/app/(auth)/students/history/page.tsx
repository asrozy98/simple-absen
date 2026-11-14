"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, History } from "lucide-react";
import { todayJakarta } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  className: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  prayerType: string;
  status: string;
  createdAt: string;
}

export default function StudentAttendanceHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [filters, setFilters] = useState({
    date: todayJakarta(),
    prayerType: "Semua",
    className: "Semua",
  });

  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch("/api/students");
        const data: Student[] = await res.json();
        if (!cancelled) {
          setStudents(data);
          const classes = Array.from(new Set(data.map((s) => s.className))).sort();
          setAvailableClasses(classes);
        }
      } catch {
        if (!cancelled) toast.error("Gagal mengambil data siswa");
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let url = `/api/students/attendance?date=${filters.date}`;
      if (filters.prayerType !== "Semua") url += `&prayerType=${filters.prayerType}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setAttendance(data);
    } catch {
      toast.error("Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadHistory();
    })();
    return () => { cancelled = true; };
  }, [filters.date, filters.prayerType]);

  const getStudentInfo = (id: string) => {
    return students.find((s) => s.id === id) || { name: "N/A", className: "-" };
  };

  const filteredAttendance = attendance.filter((a) => {
    const student = getStudentInfo(a.studentId);
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filters.className === "Semua" || student.className === filters.className;
    return matchesSearch && matchesClass;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hadir": return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">Hadir</Badge>;
      case "Alfa": return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">Alfa</Badge>;
      case "Sakit": return <Badge className="bg-amber-50 text-amber-600 border-amber-200">Sakit</Badge>;
      case "Haid": return <Badge className="bg-purple-50 text-purple-600 border-purple-200">Haid</Badge>;
      case "Terlambat": return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Terlambat</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Sholat Siswa</h1>
        <p className="text-muted-foreground">Lihat dan cari rekapitulasi absensi sholat siswa.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Cari Nama Siswa</Label>
              <Input 
                placeholder="Ketik nama siswa..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Tanggal</Label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Jenis Sholat</Label>
              <Select
                value={filters.prayerType}
                onValueChange={(v) => v && setFilters({ ...filters, prayerType: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Jenis</SelectItem>
                  <SelectItem value="Dhuha">Dhuha</SelectItem>
                  <SelectItem value="Dhuhur">Dhuhur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Kelas</Label>
              <Select
                value={filters.className}
                onValueChange={(v) => v && setFilters({ ...filters, className: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua Kelas</SelectItem>
                  {availableClasses.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">No</TableHead>
                <TableHead className="min-w-[140px]">Nama Siswa</TableHead>
                <TableHead className="min-w-[80px]">Kelas</TableHead>
                <TableHead className="min-w-[100px]">Jenis Sholat</TableHead>
                <TableHead className="text-center min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[120px]">Waktu Input</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Memuat riwayat...</p>
                  </TableCell>
                </TableRow>
              ) : filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    Tidak ada data absensi untuk kriteria ini.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendance.map((record, index) => {
                  const student = getStudentInfo(record.studentId);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>{record.prayerType}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleTimeString("id-ID")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
