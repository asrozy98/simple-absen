import { NextResponse } from "next/server";
import { clockIn, clockOut, getAttendanceByUser, getAllAttendanceWithUser } from "@/lib/google-sheets";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (userId) {
      const attendance = await getAttendanceByUser(userId);
      return NextResponse.json(attendance);
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attendance = await getAllAttendanceWithUser();
    return NextResponse.json(attendance);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data absensi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, userId } = body;

    if (type === "clockin") {
      const attendance = await clockIn(userId || session.user.id);
      return NextResponse.json(attendance, { status: 201 });
    }

    if (type === "clockout") {
      const attendance = await clockOut(userId || session.user.id);
      return NextResponse.json(attendance);
    }

    return NextResponse.json({ error: "Type harus 'clockin' atau 'clockout'" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses absensi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
