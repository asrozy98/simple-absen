"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  BookOpen,
  BarChart3,
  Users,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Username atau password salah");
      setLoading(false);
      return;
    }

    toast.success("Login berhasil!");
    router.push("/dashboard");
    router.refresh();
  }

  const features = [
    { icon: BookOpen, label: "Absen Cepat", desc: "Klik satu kali" },
    { icon: BarChart3, label: "Laporan", desc: "Real-time" },
    { icon: Users, label: "Multi User", desc: "Admin & Guru" },
    { icon: CalendarDays, label: "Kalender", desc: "Per hari" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[oklch(0.45_0.12_170)] via-[oklch(0.50_0.14_170)] to-[oklch(0.40_0.10_175)] overflow-hidden">
        {/* Bg pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzRtMC00djJIMnYyaDM0bTAtNHYySDJ2MmgzNG0tMTQgMTZ2MkgydjJoMjJtMC00djJIMnYyaDIybTAtNHYySDJ2MmgyMm0tMTQgMTZ2MkgydjJoMjIiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-primary-foreground">
          <div className="mb-8 animate-fade-in">
            <div className="h-24 w-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 mx-auto shadow-2xl">
              <GraduationCap className="h-14 w-14" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-center mb-3">
              Absen Guru
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-sm text-center">
              Sistem Absensi Digital untuk Guru Sekolah
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8 max-w-sm w-full animate-fade-in-up-delay-2">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover-glow cursor-default"
              >
                <f.icon className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-primary-foreground/60 mt-1">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
              <GraduationCap className="h-9 w-9 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Absen Guru</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sistem Absensi Digital
            </p>
          </div>

          <div className="mb-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-muted-foreground mt-2">
              Masuk ke akun Anda untuk melakukan absensi
            </p>
          </div>

          <Card className="border-0 shadow-none bg-transparent p-6 animate-fade-in-up-delay-1">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Masukkan username Anda"
                    required
                    autoComplete="username"
                    className="h-11 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password Anda"
                      required
                      autoComplete="current-password"
                      className="h-11 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-8 animate-fade-in-up-delay-3">
            &copy; {new Date().getFullYear()} &nbsp; Absen Guru &mdash; Sistem
            Absensi Sekolah
          </p>
        </div>
      </div>
    </div>
  );
}
