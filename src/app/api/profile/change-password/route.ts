import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { getUsers } from "@/lib/google-sheets";
import { google } from "googleapis";

async function getSheets() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
  const authClient = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: authClient });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Password lama dan password baru harus diisi" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password baru minimal 6 karakter" },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const user = users.find((u) => u.id === session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Password lama salah" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sheets = await getSheets();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || "";
    const rowIndex = users.findIndex((u) => u.id === session.user.id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const range = `Users!C${rowIndex + 2}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[hashedPassword]],
      },
    });

    return NextResponse.json({ message: "Password berhasil diubah" });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengubah password" },
      { status: 500 }
    );
  }
}
