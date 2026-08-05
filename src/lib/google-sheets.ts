import { google } from "googleapis";
import { todayJakarta } from "@/lib/utils";

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

export interface Device {
  id: string;
  userId: string;
  token: string;
  updatedAt: string;
  browser: string;
  deviceType: string;
  os: string;
}

export interface Schedule {
  id: string;
  userId: string;
  day: string; // "Senin", "Selasa", "Rabu", "Kamis", "Jumat"
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  subject: string;
  className: string;
  room: string;
  createdAt: string;
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

async function getSheets() {
  if (!sheetsClient) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    sheetsClient = google.sheets({ version: "v4", auth });
  }
  return sheetsClient;
}

function getSpreadsheetId(): string {
  return process.env.GOOGLE_SPREADSHEET_ID || "";
}

const SHEET_HEADERS: Record<string, string[]> = {
  Users: ["id", "username", "password", "name", "role", "createdAt"],
  Attendance: ["id", "userId", "date", "timeIn", "timeOut", "duration"],
  Schedules: ["id", "userId", "day", "startTime", "endTime", "subject", "className", "room", "createdAt"],
  Devices: ["id", "userId", "token", "updatedAt", "browser", "deviceType", "os"],
};

// cache per sheet (keyed by spreadsheetId) to skip the metadata/header
// round-trip on every read — ponytail: fine for a fixed spreadsheet per deploy
const confirmedSheets = new Set<string>();
const confirmedHeaderLen = new Map<string, number>();

async function ensureSheetExists(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, sheetName: string) {
  const cacheKey = `${spreadsheetId}:${sheetName}`;
  if (confirmedSheets.has(cacheKey)) return;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
  if (!existingSheets.includes(sheetName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    const headers = SHEET_HEADERS[sheetName];
    if (headers) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
  }
  confirmedSheets.add(cacheKey);
}

async function ensureSheetHeaders(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, sheetName: string) {
  const expected = SHEET_HEADERS[sheetName];
  if (!expected) return;
  await ensureSheetExists(sheets, spreadsheetId, sheetName);
  const cacheKey = `${spreadsheetId}:${sheetName}`;
  const known = confirmedHeaderLen.get(cacheKey);
  if (known !== undefined && known >= expected.length) return;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1`,
  });
  const current = res.data.values?.[0] || [];
  if (current.length >= expected.length) {
    confirmedHeaderLen.set(cacheKey, current.length);
    return;
  }
  const missing = expected.slice(current.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${String.fromCharCode(64 + current.length + 1)}1`,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });
  confirmedHeaderLen.set(cacheKey, expected.length);
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

  const today = todayJakarta();
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

  const today = todayJakarta();
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
  let durationMinutes = timeOutMinutes - timeInMinutes;
  if (durationMinutes < 0) durationMinutes += 1440; // lintas tengah malam
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

export async function getSchedules(): Promise<Schedule[]> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureSheetExists(sheets, spreadsheetId, "Schedules");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Schedules!A2:I",
  });
  const rows = res.data.values || [];
  return rows.map((row) => ({
    id: row[0] || "",
    userId: row[1] || "",
    day: row[2] || "",
    startTime: row[3] || "",
    endTime: row[4] || "",
    subject: row[5] || "",
    className: row[6] || "",
    room: row[7] || "",
    createdAt: row[8] || "",
  }));
}

export async function getSchedulesByUser(userId: string): Promise<Schedule[]> {
  const schedules = await getSchedules();
  return schedules.filter((s) => s.userId === userId);
}

export async function getSchedulesByDay(day: string): Promise<Schedule[]> {
  const schedules = await getSchedules();
  return schedules.filter((s) => s.day === day);
}

export async function addSchedule(schedule: Omit<Schedule, "id" | "createdAt">): Promise<Schedule> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureSheetExists(sheets, spreadsheetId, "Schedules");

  const newSchedule: Schedule = {
    id: crypto.randomUUID(),
    ...schedule,
    createdAt: new Date().toISOString(),
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Schedules!A:I",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        newSchedule.id,
        newSchedule.userId,
        newSchedule.day,
        newSchedule.startTime,
        newSchedule.endTime,
        newSchedule.subject,
        newSchedule.className,
        newSchedule.room,
        newSchedule.createdAt,
      ]],
    },
  });

  return newSchedule;
}

export async function updateSchedule(id: string, schedule: Omit<Schedule, "id" | "createdAt">): Promise<Schedule> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();

  const schedules = await getSchedules();
  const rowIndex = schedules.findIndex((s) => s.id === id);
  if (rowIndex === -1) throw new Error("Schedule not found");

  const updatedSchedule: Schedule = {
    id,
    ...schedule,
    createdAt: schedules[rowIndex].createdAt, // Keep original createdAt
  };

  const sheetRange = `Schedules!A${rowIndex + 2}:I${rowIndex + 2}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        updatedSchedule.id,
        updatedSchedule.userId,
        updatedSchedule.day,
        updatedSchedule.startTime,
        updatedSchedule.endTime,
        updatedSchedule.subject,
        updatedSchedule.className,
        updatedSchedule.room,
        updatedSchedule.createdAt,
      ]],
    },
  });

  return updatedSchedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();

  const schedules = await getSchedules();
  const rowIndex = schedules.findIndex((s) => s.id === id);
  if (rowIndex === -1) throw new Error("Schedule not found");

  const sheetRange = `Schedules!A${rowIndex + 2}:I${rowIndex + 2}`;
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: sheetRange,
  });
}

export async function getDevices(): Promise<Device[]> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureSheetExists(sheets, spreadsheetId, "Devices");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Devices!A2:G",
  });
  const rows = res.data.values || [];
  return rows.map((row) => ({
    id: row[0] || "",
    userId: row[1] || "",
    token: row[2] || "",
    updatedAt: row[3] || "",
    browser: row[4] || "",
    deviceType: row[5] || "",
    os: row[6] || "",
  }));
}

export async function addDeviceToken(
  userId: string,
  token: string,
  browser: string,
  deviceType: string,
  os: string,
): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();
  await ensureSheetExists(sheets, spreadsheetId, "Devices");
  await ensureSheetHeaders(sheets, spreadsheetId, "Devices");

  const devices = await getDevices();
  const existingIndex = devices.findIndex((d) => d.token === token);

  if (existingIndex !== -1) {
    // dedupe: update userId + updatedAt + device info in place
    const sheetRange = `Devices!B${existingIndex + 2}:G${existingIndex + 2}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheetRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [[userId, token, new Date().toISOString(), browser, deviceType, os]],
      },
    });
    return;
  }

  const newDevice: Device = {
    id: crypto.randomUUID(),
    userId,
    token,
    updatedAt: new Date().toISOString(),
    browser,
    deviceType,
    os,
  };
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Devices!A:G",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        newDevice.id,
        newDevice.userId,
        newDevice.token,
        newDevice.updatedAt,
        newDevice.browser,
        newDevice.deviceType,
        newDevice.os,
      ]],
    },
  });
}

async function deleteDeviceRow(match: (d: Device) => boolean): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = getSpreadsheetId();

  const devices = await getDevices();
  const rowIndex = devices.findIndex(match);
  if (rowIndex === -1) return;

  const sheetRange = `Devices!A${rowIndex + 2}:G${rowIndex + 2}`;
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: sheetRange,
  });
}

export async function deleteDeviceByToken(token: string): Promise<void> {
  await deleteDeviceRow((d) => d.token === token);
}

export async function deleteDeviceById(id: string): Promise<void> {
  await deleteDeviceRow((d) => d.id === id);
}
