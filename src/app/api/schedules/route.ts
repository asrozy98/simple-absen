import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  getUsers,
} from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const day = searchParams.get("day");

    let schedules = await getSchedules();

    // Role-based filtering
    if (session.user.role === "admin") {
      // Admin can see all or filter by userId/day
      if (userId) {
        schedules = schedules.filter((s) => s.userId === userId);
      }
    } else {
      // Guru only sees their own schedules
      schedules = schedules.filter((s) => s.userId === session.user.id);
    }

    // Additional day filter
    if (day) {
      schedules = schedules.filter((s) => s.day === day);
    }

    // Get user names for admin view
    if (session.user.role === "admin") {
      const users = await getUsers();
      const schedulesWithNames = schedules.map((schedule) => {
        const user = users.find((u) => u.id === schedule.userId);
        return {
          ...schedule,
          userName: user?.name || "Unknown",
        };
      });
      return NextResponse.json(schedulesWithNames);
    }

    return NextResponse.json(schedules);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, userId, day, startTime, endTime, subject, className, room } = body;

    // Basic validation
    if (!userId || !day || !startTime || !endTime || !subject || !className) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const validDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    if (!validDays.includes(day)) {
      return NextResponse.json(
        {
          error:
            "Invalid day. Must be Senin, Selasa, Rabu, Kamis, Jumat, Sabtu",
        },
        { status: 400 },
      );
    }

    // Time format validation (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:mm (e.g., 08:00, 13:30)" },
        { status: 400 },
      );
    }

    let result;
    if (id) {
      // Update existing schedule
      result = await updateSchedule(id, {
        userId,
        day,
        startTime,
        endTime,
        subject,
        className,
        room: room || "",
      });
    } else {
      // Create new schedule
      result = await addSchedule({
        userId,
        day,
        startTime,
        endTime,
        subject,
        className,
        room: room || "",
      });
    }

    return NextResponse.json(result, { status: id ? 200 : 201 });
  } catch (error) {
    console.error("Error saving schedule:", error);
    return NextResponse.json(
      { error: "Failed to save schedule" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 },
      );
    }

    await deleteSchedule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 },
    );
  }
}
