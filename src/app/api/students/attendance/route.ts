import { NextResponse } from "next/server";
import { bulkSaveStudentAttendance, getStudentAttendance } from "@/lib/google-sheets";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const prayerType = searchParams.get("prayerType");

    const attendance = await getStudentAttendance(date || undefined, prayerType || undefined);
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data absensi siswa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, prayerType, records } = body;

    if (!date || !prayerType || !records) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const result = await bulkSaveStudentAttendance(session.user.id, date, prayerType, records);
    
    // All records already existed and none were updated (shouldn't happen now with upsert)
    if (result.saved === 0 && result.updated === 0 && result.skipped.length > 0) {
      return NextResponse.json(
        { 
          error: "Semua siswa sudah memiliki absensi untuk sholat ini hari ini",
          skipped: result.skipped
        }, 
        { status: 409 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      saved: result.saved,
      updated: result.updated,
      skipped: result.skipped 
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
  }
}
