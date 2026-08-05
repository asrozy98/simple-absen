"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Trash2,
  Loader2,
  Search,
  MonitorSmartphone,
  Users,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface Device {
  id: string;
  userId: string;
  userName: string;
  updatedAt: string;
  browser: string;
  deviceType: string;
  os: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch {
      toast.error("Gagal mengambil data perangkat");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(device: Device) {
    if (
      !confirm(
        `Hapus perangkat "${device.userName}"? Guru tidak akan menerima notifikasi di perangkat ini.`,
      )
    )
      return;

    setDeleting(device.id);
    try {
      const res = await fetch("/api/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: device.id }),
      });
      if (!res.ok) {
        toast.error("Gagal menghapus perangkat");
        return;
      }
      toast.success("Perangkat berhasil dihapus");
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
    } catch {
      toast.error("Gagal menghapus perangkat");
    } finally {
      setDeleting(null);
    }
  }

  const filteredDevices = devices.filter((d) =>
    d.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const userCount = new Set(devices.map((d) => d.userId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Perangkat Notifikasi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Daftar browser/perangkat guru yang terdaftar untuk reminder absen
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devices.length}</p>
                <p className="text-xs text-muted-foreground">Total Perangkat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userCount}</p>
                <p className="text-xs text-muted-foreground">Guru Terdaftar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover-lift bg-gradient-to-br from-violet-50 to-violet-100/50 col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {devices.length - userCount}
                </p>
                <p className="text-xs text-muted-foreground">Device Ekstra</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama guru..."
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
          ) : filteredDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <MonitorSmartphone className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">
                {searchQuery
                  ? "Tidak ada perangkat yang cocok"
                  : "Belum ada perangkat terdaftar"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {!searchQuery &&
                  "Guru harus membuka aplikasi & mengizinkan notifikasi untuk terdaftar"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        No
                      </th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Guru
                      </th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Browser / Perangkat
                      </th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Terdaftar
                      </th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map((device, index) => (
                      <tr
                        key={device.id}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3.5 px-5 text-sm text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Smartphone className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm">
                              {device.userName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {device.browser || "Browser"}{" "}
                              {device.os && (
                                <span className="text-muted-foreground font-normal">
                                  · {device.os}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {device.deviceType || "Perangkat"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-muted-foreground">
                          {new Date(device.updatedAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(device)}
                            disabled={deleting === device.id}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            {deleting === device.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="ml-1.5">Hapus</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {device.userName}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0 border-primary/20 bg-primary/5 text-primary"
                          >
                            Aktif
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {device.browser || "Browser"}
                          {device.os ? ` · ${device.os}` : ""}
                          {" · "}
                          {device.deviceType || "Perangkat"}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Terdaftar{" "}
                          {new Date(device.updatedAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(device)}
                        disabled={deleting === device.id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                      >
                        {deleting === device.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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
