import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDevices,
  getUsers,
  deleteDeviceByToken,
} from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [devices, users] = await Promise.all([getDevices(), getUsers()]);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = devices
      .map((d) => ({
        id: d.id,
        userId: d.userId,
        userName: userMap.get(d.userId)?.name || "Unknown",
        updatedAt: d.updatedAt,
        browser: d.browser,
        deviceType: d.deviceType,
        os: d.os,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil data perangkat" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = body.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    const devices = await getDevices();
    const device = devices.find((d) => d.id === id);
    if (!device) {
      return NextResponse.json({ error: "Perangkat tidak ditemukan" }, { status: 404 });
    }

    await deleteDeviceByToken(device.token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus perangkat" }, { status: 500 });
  }
}
