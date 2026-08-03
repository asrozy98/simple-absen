"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { ScheduleFormDialog } from "@/components/schedule-form-dialog";
import {
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Building,
  User,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  id: string;
  userId: string;
  userName?: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  room: string;
  createdAt: string;
}

interface Teacher {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface SelectOption {
  label: string;
  value: string;
}

export default function SchedulesPage() {
  // Note: session is not used directly but kept for future role checks
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );

  // Filter states
  const [dayFilter, setDayFilter] = useState<string>("");
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [schedulesRes, teachersRes] = await Promise.all([
        fetch("/api/schedules"),
        fetch("/api/teachers"),
      ]);

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setSchedules(schedulesData);
      }

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        // Filter hanya guru (role === "user")
        const filteredTeachers = teachersData
          .filter((t: Teacher) => t.role === "user")
          .map((t: Teacher) => ({ value: t.id, label: t.name }));
        setTeachers(filteredTeachers);
      }
    } catch (error) {
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesDay = !dayFilter || schedule.day === dayFilter;
    const matchesTeacher = !teacherFilter || schedule.userId === teacherFilter;
    const matchesSearch =
      !searchQuery ||
      schedule.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.userName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDay && matchesTeacher && matchesSearch;
  });

  function handleEdit(schedule: Schedule) {
    setSelectedSchedule(schedule);
    setShowDialog(true);
  }

  function handleCloseDialog() {
    setSelectedSchedule(null);
    setShowDialog(false);
  }

  async function handleSubmit(
    data: Omit<Schedule, "id" | "createdAt"> & { id?: string },
  ) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Gagal menyimpan jadwal");
        return;
      }

      toast.success(
        selectedSchedule
          ? "Jadwal berhasil diperbarui"
          : "Jadwal berhasil ditambahkan",
      );
      handleCloseDialog();
      loadData();
    } catch {
      toast.error("Gagal menyimpan jadwal");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;

    try {
      const res = await fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus jadwal");
        return;
      }

      toast.success("Jadwal berhasil dihapus");
      loadData();
    } catch {
      toast.error("Gagal menghapus jadwal");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal Mengajar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola jadwal mengajar guru per minggu
          </p>
        </div>
        <div>
          <Button
            className="shadow-md hover-scale"
            onClick={() => {
              setSelectedSchedule(null);
              setShowDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Jadwal
          </Button>

          <ScheduleFormDialog
            key={selectedSchedule?.id || "new"}
            open={showDialog}
            onOpenChange={handleCloseDialog}
            teachers={teachers}
            schedule={selectedSchedule}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari mata pelajaran, kelas, ruangan, atau guru..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Day Filter */}
            <div className="w-full sm:w-[180px]">
              <Select
                value={dayFilter}
                onValueChange={(value) => setDayFilter(value || "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter hari" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Hari</SelectItem>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Filter */}
            <div className="w-full sm:w-[200px]">
              <Select
                items={teachers}
                value={teacherFilter}
                onValueChange={(value) => setTeacherFilter(value || "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter guru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Guru</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.value} value={teacher.value}>
                      {teacher.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(dayFilter || teacherFilter || searchQuery) && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setDayFilter("");
                  setTeacherFilter("");
                  setSearchQuery("");
                }}
                title="Clear filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Guru</TableHead>
                <TableHead>Hari</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Ruangan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 opacity-30" />
                      <p>Tidak ada jadwal ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {schedule.userName || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {schedule.day}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-muted-foreground" />
                        <span>{schedule.className}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                        <span>{schedule.subject}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.room ? (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span>{schedule.room}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(schedule)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Menampilkan{" "}
          <span className="font-medium">{filteredSchedules.length}</span> jadwal
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Badge variant="outline" className="h-2 w-2 p-0 rounded-full" />
            Hari Aktif
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Format waktu: HH:mm
          </span>
        </div>
      </div>
    </div>
  );
}
