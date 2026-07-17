"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, Users, Search, MoreHorizontal, Shield, GraduationCap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Teacher {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/teachers");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTeachers(data);
        }
      } catch {
        toast.error("Gagal mengambil data guru");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleAddTeacher(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      role: formData.get("role") as string,
    };

    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Gagal mendaftarkan guru");
        return;
      }

      toast.success("Guru berhasil didaftarkan!");
      setDialogOpen(false);
      (e.target as HTMLFormElement).reset();

      const listRes = await fetch("/api/teachers");
      if (listRes.ok) {
        const listData = await listRes.json();
        setTeachers(listData);
      }
    } catch {
      toast.error("Gagal mendaftarkan guru");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAdmin = teachers.filter((t) => t.role === "admin").length;
  const totalGuru = teachers.filter((t) => t.role === "user").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Guru</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola akun dan data guru sekolah</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setShowPassword(false); }}>
          <DialogTrigger render={<Button className="shadow-md shadow-primary/20" />}>
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Guru
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Guru Baru</DialogTitle>
              <DialogDescription>
                Isi data berikut untuk mendaftarkan guru baru
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTeacher} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="budi123"
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      required
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                  defaultValue="user"
                >
                  <option value="user">Guru</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-primary/5 to-primary/10 border-primary/10">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teachers.length}</p>
                <p className="text-xs text-muted-foreground">Total Guru</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalGuru}</p>
                <p className="text-xs text-muted-foreground">Guru</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-violet-50 to-violet-100/50 col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAdmin}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau username..."
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
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">
                {searchQuery ? "Tidak ada guru yang cocok" : "Belum ada guru terdaftar"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {!searchQuery && "Klik tombol \"Tambah Guru\" untuk menambahkan"}
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
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terdaftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((teacher, index) => (
                      <tr
                        key={teacher.id}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3.5 px-5 text-sm text-muted-foreground">{index + 1}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {teacher.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{teacher.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-muted-foreground">{teacher.username}</td>
                        <td className="py-3.5 px-5">
                          <Badge
                            variant="outline"
                            className={
                              teacher.role === "admin"
                                ? "border-violet-200 text-violet-600 bg-violet-50"
                                : "border-emerald-200 text-emerald-600 bg-emerald-50"
                            }
                          >
                            {teacher.role === "admin" ? (
                              <Shield className="h-3 w-3 mr-1" />
                            ) : (
                              <GraduationCap className="h-3 w-3 mr-1" />
                            )}
                            {teacher.role === "admin" ? "Admin" : "Guru"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-muted-foreground">
                          {new Date(teacher.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{teacher.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${
                              teacher.role === "admin"
                                ? "border-violet-200 text-violet-600 bg-violet-50"
                                : "border-emerald-200 text-emerald-600 bg-emerald-50"
                            }`}
                          >
                            {teacher.role === "admin" ? "Admin" : "Guru"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">@{teacher.username}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(teacher.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
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
