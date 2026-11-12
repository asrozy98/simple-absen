import { NextResponse } from "next/server";
import { getStudents, addStudent } from "@/lib/google-sheets";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");

    let students = await getStudents();
    if (className) {
      students = students.filter((s) => s.className === className);
    }

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data siswa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const student = await addStudent(body);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah siswa" }, { status: 500 });
  }
}
