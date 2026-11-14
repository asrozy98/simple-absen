"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Save, Search } from "lucide-react";
import { todayJakarta } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  className: string;
  gender: "L" | "P";
}

type AbsensiStatus = "Alfa" | "Hadir" | "Sakit" | "Haid" | "Terlambat";

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AbsensiStatus>>(
    {},
  );
  const [attendanceTime, setAttendanceTime] = useState<Record<string, string>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    date: todayJakarta(),
    prayerType: "Dhuha",
    className: "",
  });

  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/students");
        const data: Student[] = await res.json();
        const classes = Array.from(
          new Set(data.map((s) => s.className)),
        ).sort();
        setAvailableClasses(classes);
      } catch {
        toast.error("Gagal mengambil data kelas");
      }
    }
    fetchClasses();
  }, []);

  const nowStr = () =>
    new Date().toLocaleTimeString("en-GB", {
      timeZone: "Asia/Jakarta",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

  const loadStudents = async () => {
    if (!filters.className) {
      toast.error("Pilih kelas terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/students?className=${filters.className}`);
      const data: Student[] = await res.json();
      setStudents(data);

      const initialAttendance: Record<string, AbsensiStatus> = {};
      const initialTime: Record<string, string> = {};
      data.forEach((s) => {
        initialAttendance[s.id] = "Alfa";
        initialTime[s.id] = nowStr();
      });
      setAttendance(initialAttendance);
      setAttendanceTime(initialTime);

      const attRes = await fetch(
        `/api/students/attendance?date=${filters.date}&prayerType=${filters.prayerType}`,
      );
      const attData = await attRes.json();

      if (attData && attData.length > 0) {
        const existingAtt: Record<string, AbsensiStatus> = {
          ...initialAttendance,
        };
        const existingTime: Record<string, string> = { ...initialTime };
        attData.forEach(
          (a: { studentId: string; status: AbsensiStatus; time: string }) => {
            if (existingAtt[a.studentId]) {
              existingAtt[a.studentId] = a.status;
              existingTime[a.studentId] = a.time || nowStr();
            }
          },
        );
        setAttendance(existingAtt);
        setAttendanceTime(existingTime);
        toast.info("Memuat data absensi yang sudah ada");
      }
    } catch {
      toast.error("Gagal memuat daftar siswa");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AbsensiStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleTimeChange = (studentId: string, time: string) => {
    setAttendanceTime((prev) => ({ ...prev, [studentId]: time }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
        time: attendanceTime[studentId] || nowStr(),
      }));

      const res = await fetch("/api/students/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: filters.date,
          prayerType: filters.prayerType,
          records,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.warning(
            `${data.skipped?.length || 0} siswa sudah absen ${filters.prayerType} hari ini`,
          );
        } else {
          throw new Error(data.error || "Gagal menyimpan");
        }
        return;
      }

      const total = (data.saved || 0) + (data.updated || 0);
      if (data.updated && data.updated > 0) {
        toast.success(
          `${data.updated} siswa diperbarui${data.saved ? `, ${data.saved} baru` : ""}`,
        );
      } else if (data.skipped?.length > 0) {
        toast.info(
          `${data.saved} siswa disimpan, ${data.skipped.length} sudah absen (dilewati)`,
        );
      } else {
        toast.success(`${total} siswa berhasil disimpan`);
      }
    } catch {
      toast.error("Gagal menyimpan absensi");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Absensi Sholat Siswa</CardTitle>
          <CardDescription>
            Input absensi Dhuha dan Dhuhur untuk siswa per kelas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label className="text-xs">Tanggal</Label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters({ ...filters, date: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs">Jenis Sholat</Label>
              <Select
                value={filters.prayerType}
                onValueChange={(v) =>
                  setFilters({ ...filters, prayerType: v as string })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Sholat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dhuha">Dhuha</SelectItem>
                  <SelectItem value="Dhuhur">Dhuhur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs">Kelas</Label>
              <Select
                value={filters.className}
                onValueChange={(v) =>
                  setFilters({ ...filters, className: v as string })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs">Cari Nama</Label>
              <Input
                placeholder="Ketik nama siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center w-full sm:col-span-2 lg:col-span-1">
              <Button
                onClick={loadStudents}
                disabled={loading}
                size="xl"
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Tampilkan Siswa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daftar Siswa Kelas {filters.className}</CardTitle>
              <CardDescription>
                Default semua Alfa + waktu sekarang. Ubah yang Hadir/Sakit/ll,
                lalu klik Simpan — tidak perlu isi semua.
              </CardDescription>
            </div>
            <Button
              onClick={saveAttendance}
              disabled={saving}
              variant="default"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Absensi
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead className="min-w-[100px]">Nama Siswa</TableHead>
                    <TableHead className="text-center min-w-[200px]">
                      Status Absensi
                    </TableHead>
                    <TableHead className="w-[100px]">Gender</TableHead>
                    <TableHead className="text-center w-[120px]">
                      Waktu
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={student.id} className="h-14">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center min-h-[36px]">
                          <RadioGroup
                            value={attendance[student.id]}
                            onValueChange={(v) =>
                              handleStatusChange(student.id, v as AbsensiStatus)
                            }
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 items-center"
                          >
                            <label className="flex flex-col items-center gap-1 cursor-pointer whitespace-nowrap">
                              <RadioGroupItem
                                value="Hadir"
                                id={`h-${student.id}`}
                              />
                              <span className="text-xs text-emerald-600 font-medium">
                                Hadir
                              </span>
                            </label>
                            <label className="flex flex-col items-center gap-1 cursor-pointer whitespace-nowrap">
                              <RadioGroupItem
                                value="Alfa"
                                id={`a-${student.id}`}
                              />
                              <span className="text-xs text-destructive font-medium">
                                Alfa
                              </span>
                            </label>
                            <label className="flex flex-col items-center gap-1 cursor-pointer whitespace-nowrap">
                              <RadioGroupItem
                                value="Sakit"
                                id={`s-${student.id}`}
                              />
                              <span className="text-xs text-amber-600 font-medium">
                                Sakit
                              </span>
                            </label>
                            {student.gender === "P" ? (
                              <label className="flex flex-col items-center gap-1 cursor-pointer whitespace-nowrap">
                                <RadioGroupItem
                                  value="Haid"
                                  id={`m-${student.id}`}
                                />
                                <span className="text-xs text-purple-600 font-medium">
                                  Haid
                                </span>
                              </label>
                            ) : (
                              <div className="hidden" />
                            )}
                            <label className="flex flex-col items-center gap-1 cursor-pointer whitespace-nowrap">
                              <RadioGroupItem
                                value="Terlambat"
                                id={`t-${student.id}`}
                              />
                              <span className="text-xs text-blue-600 font-medium">
                                Terlambat
                              </span>
                            </label>
                          </RadioGroup>
                        </div>
                      </TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={attendanceTime[student.id] || ""}
                          onChange={(e) =>
                            handleTimeChange(student.id, e.target.value)
                          }
                          className="h-8 w-full text-xs text-center bg-transparent border-0 focus:ring-0"
                          readOnly
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
