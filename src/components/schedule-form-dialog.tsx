"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
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
  label: string;
  value: string;
}

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: Teacher[];
  schedule: Schedule | null;
  onSubmit: (
    data: Omit<Schedule, "id" | "createdAt"> & { id?: string },
  ) => Promise<void>;
  submitting: boolean;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  teachers,
  schedule,
  onSubmit,
  submitting,
}: ScheduleFormDialogProps) {
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  // Initialize state directly from props (component is remounted via key when schedule changes)
  const [formData, setFormData] = useState(() => ({
    id: schedule?.id || "",
    userId: schedule?.userId || "",
    day: schedule?.day || "",
    startTime: schedule?.startTime || "",
    endTime: schedule?.endTime || "",
    subject: schedule?.subject || "",
    className: schedule?.className || "",
    room: schedule?.room || "",
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (
      !formData.userId ||
      !formData.day ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.subject ||
      !formData.className
    ) {
      toast.error("Harap isi semua field yang wajib");
      return;
    }

    // Time validation
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (
      !timeRegex.test(formData.startTime) ||
      !timeRegex.test(formData.endTime)
    ) {
      toast.error(
        "Format waktu tidak valid. Gunakan HH:mm (contoh: 08:00, 13:30)",
      );
      return;
    }

    await onSubmit(formData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Edit Jadwal" : "Tambah Jadwal Baru"}
          </DialogTitle>
          <DialogDescription>
            Isi detail jadwal mengajar guru. Format waktu: HH:mm (contoh: 08:00)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Teacher Select */}
          <div className="grid gap-2">
            <Label htmlFor="userId">Guru</Label>
            <Select
              items={teachers}
              value={formData.userId}
              onValueChange={(value) =>
                setFormData({ ...formData, userId: value || "" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih guru" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.value} value={teacher.value}>
                    {teacher.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Select */}
          <div className="grid gap-2">
            <Label htmlFor="day">Hari</Label>
            <Select
              items={teachers}
              value={formData.day}
              onValueChange={(value) =>
                setFormData({ ...formData, day: value || "" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih hari" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Inputs - Native Time Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Waktu Mulai</Label>
              <input
                id="startTime"
                type="time"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">Waktu Selesai</Label>
              <input
                id="endTime"
                type="time"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
            </div>
          </div>

          {/* Subject & Class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Mata Pelajaran</Label>
              <Input
                id="subject"
                placeholder="Matematika"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="className">Kelas</Label>
              <Input
                id="className"
                placeholder="X IPA 1"
                value={formData.className}
                onChange={(e) =>
                  setFormData({ ...formData, className: e.target.value })
                }
              />
            </div>
          </div>

          {/* Room */}
          <div className="grid gap-2">
            <Label htmlFor="room">Ruangan (Opsional)</Label>
            <Input
              id="room"
              placeholder="Lab Komputer 1"
              value={formData.room}
              onChange={(e) =>
                setFormData({ ...formData, room: e.target.value })
              }
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {schedule ? "Perbarui" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
