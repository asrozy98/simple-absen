import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUsers, addUser } from "@/lib/google-sheets";

export async function GET() {
  try {
    const users = await getUsers();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const teachers = users.map(({ password: _password, ...rest }) => rest);
    return NextResponse.json(teachers);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data guru" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name, role } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: "Username, password, dan nama harus diisi" }, { status: 400 });
    }

    const users = await getUsers();
    if (users.find((u) => u.username === username)) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await addUser({
      username,
      password: hashedPassword,
      name,
      role: role || "user",
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal mendaftarkan guru" }, { status: 500 });
  }
}
