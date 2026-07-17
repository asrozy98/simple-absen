import { google } from "googleapis";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  duration: string | null;
}

async function getSheets() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function getSpreadsheetId(): string {
  return process.env.GOOGLE_SPREADSHEET_ID || "";
}

async function ensureSheetExists(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, sheetName: string) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
  if (!existingSheets.includes(sheetName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
  }
}

export async function getUsers(): Promise<User[]> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureSheetExists(sheets, spreadsheetId, "Users");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Users!A2:F",
  });
  const rows = res.data.values || [];
  return rows.map((row) => ({
    id: row[0] || "",
    username: row[1] || "",
    password: row[2] || "",
    name: row[3] || "",
    role: (row[4] as "admin" | "user") || "user",
    createdAt: row[5] || "",
  }));
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.username === username) || null;
}

export async function addUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureSheetExists(sheets, spreadsheetId, "Users");

  const newUser: User = {
    id: crypto.randomUUID(),
    ...user,
    createdAt: new Date().toISOString(),
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Users!A:F",
    valueInputOption: "RAW",
    requestBody: {
      values: [[newUser.id, newUser.username, newUser.password, newUser.name, newUser.role, newUser.createdAt]],
    },
  });

  return newUser;
}

export async function getAttendance(): Promise<Attendance[]> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureSheetExists(sheets, spreadsheetId, "Attendance");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Attendance!A2:F",
  });
  const rows = res.data.values || [];
  return rows.map((row) => ({
    id: row[0] || "",
    userId: row[1] || "",
    date: row[2] || "",
    timeIn: row[3] || null,
    timeOut: row[4] || null,
    duration: row[5] || null,
  }));
}

export async function getAttendanceByUserAndDate(userId: string, date: string): Promise<Attendance | null> {
  const attendance = await getAttendance();
  return attendance.find((a) => a.userId === userId && a.date === date) || null;
}

export async function getAttendanceByUser(userId: string): Promise<Attendance[]> {
  const attendance = await getAttendance();
  return attendance.filter((a) => a.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
}

export async function clockIn(userId: string): Promise<Attendance> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureSheetExists(sheets, spreadsheetId, "Attendance");

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const now = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Jakarta", hour12: false });

  const existing = await getAttendanceByUserAndDate(userId, today);
  if (existing) {
    throw new Error("Sudah absen masuk hari ini");
  }

  const newAttendance: Attendance = {
    id: crypto.randomUUID(),
    userId,
    date: today,
    timeIn: now,
    timeOut: null,
    duration: null,
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Attendance!A:F",
    valueInputOption: "RAW",
    requestBody: {
      values: [[newAttendance.id, newAttendance.userId, newAttendance.date, newAttendance.timeIn, "", ""]],
    },
  });

  return newAttendance;
}

export async function clockOut(userId: string): Promise<Attendance> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const now = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Jakarta", hour12: false });

  const existing = await getAttendanceByUserAndDate(userId, today);
  if (!existing) {
    throw new Error("Belum absen masuk hari ini");
  }
  if (existing.timeOut) {
    throw new Error("Sudah absen pulang hari ini");
  }

  const timeInParts = existing.timeIn!.split(":").map(Number);
  const timeOutParts = now.split(":").map(Number);
  const timeInMinutes = timeInParts[0] * 60 + timeInParts[1];
  const timeOutMinutes = timeOutParts[0] * 60 + timeOutParts[1];
  const durationMinutes = timeOutMinutes - timeInMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const duration = `${hours}j ${minutes}m`;

  const attendance = await getAttendance();
  const rowIndex = attendance.findIndex((a) => a.id === existing.id);
  if (rowIndex === -1) throw new Error("Record not found");

  const sheetRange = `Attendance!E${rowIndex + 2}:F${rowIndex + 2}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [[now, duration]],
    },
  });

  return {
    ...existing,
    timeOut: now,
    duration,
  };
}

export async function getAllAttendanceWithUser(): Promise<(Attendance & { userName: string })[]> {
  const users = await getUsers();
  const attendance = await getAttendance();

  return attendance
    .map((a) => {
      const user = users.find((u) => u.id === a.userId);
      return {
        ...a,
        userName: user?.name || "Unknown",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
