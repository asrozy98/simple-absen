// Script untuk seed jadwal mengajar dummy
// Run: node scripts/seed-schedules.js

const { google } = require("googleapis");

const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

if (!key.type || !spreadsheetId) {
  console.error("Error: GOOGLE_SERVICE_ACCOUNT_KEY dan GOOGLE_SPREADSHEET_ID harus di-set di .env.local");
  console.error("Run: GOOGLE_SERVICE_ACCOUNT_KEY=... GOOGLE_SPREADSHEET_ID=... node scripts/seed-schedules.js");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

async function seedSchedules() {
  try {
    // Cek apakah sheet "Schedules" sudah ada
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
    
    if (!existingSheets.includes("Schedules")) {
      // Buat sheet baru
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: "Schedules" } } }],
        },
      });
      console.log("✅ Sheet 'Schedules' berhasil dibuat");
    } else {
      console.log("📄 Sheet 'Schedules' sudah ada");
    }

    // Ambil data guru dari sheet Users
    const usersRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Users!A2:E",
    });
    const users = usersRes.data.values || [];
    
    // Filter hanya guru (role = "user")
    const teachers = users.filter((row) => row[4] === "user");
    
    if (teachers.length === 0) {
      console.error("❌ Tidak ada guru ditemukan di sheet Users. Jalankan seed-admin.js terlebih dahulu.");
      process.exit(1);
    }

    console.log(`👨‍🏫 Ditemukan ${teachers.length} guru`);

    // Data jadwal dummy
    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const subjects = ["Matematika", "Bahasa Indonesia", "IPA", "IPS", "Bahasa Inggris", "PJOK", "Seni Budaya"];
    const classNames = ["X IPA 1", "X IPA 2", "XI IPA 1", "XI IPA 2", "XII IPA 1", "X IPS 1", "X IPS 2"];
    const rooms = ["Kelas 1", "Kelas 2", "Lab Komputer 1", "Lab IPA", "Ruang Multimedia", ""];
    const timeSlots = [
      ["07:30", "09:00"],
      ["09:15", "10:45"],
      ["11:00", "12:30"],
      ["13:00", "14:30"],
      ["14:45", "16:15"],
    ];

    // Generate jadwal dummy (2-3 jadwal per guru)
    const dummySchedules = [];
    
    teachers.forEach((teacher, teacherIndex) => {
      const teacherId = teacher[0]; // Column A: id
      const teacherName = teacher[3]; // Column D: name
      
      // Setiap guru dapat 2-3 jadwal
      const numSchedules = 2 + (teacherIndex % 2); // 2 atau 3
      
      for (let i = 0; i < numSchedules; i++) {
        const day = days[i % days.length];
        const [startTime, endTime] = timeSlots[i % timeSlots.length];
        const subject = subjects[(teacherIndex + i) % subjects.length];
        const className = classNames[(teacherIndex * 2 + i) % classNames.length];
        const room = rooms[(teacherIndex + i) % rooms.length];
        
        dummySchedules.push({
          id: require('crypto').randomUUID(),
          userId: teacherId,
          day,
          startTime,
          endTime,
          subject,
          className,
          room,
          createdAt: new Date().toISOString(),
        });
        
        console.log(`  📅 ${teacherName}: ${day} ${startTime}-${endTime} - ${subject} (${className})`);
      }
    });

    // Clear existing data (opsional, hanya baris 2 dan seterusnya)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "Schedules!A2:I",
    });

    // Set headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Schedules!A1:I1",
      valueInputOption: "RAW",
      requestBody: {
        values: [["id", "userId", "day", "startTime", "endTime", "subject", "className", "room", "createdAt"]],
      },
    });

    // Insert dummy schedules
    const values = dummySchedules.map((s) => [
      s.id,
      s.userId,
      s.day,
      s.startTime,
      s.endTime,
      s.subject,
      s.className,
      s.room,
      s.createdAt,
    ]);

    if (values.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Schedules!A:I",
        valueInputOption: "RAW",
        requestBody: { values },
      });
      console.log(`✅ ${dummySchedules.length} jadwal dummy berhasil ditambahkan`);
    }

    console.log("\n🎉 Seed schedules selesai!");
    console.log("📋 Struktur sheet 'Schedules':");
    console.log("   A: id, B: userId, C: day, D: startTime, E: endTime");
    console.log("   F: subject, G: className, H: room, I: createdAt");
    console.log("\n👉 Login sebagai admin dan buka /schedules untuk mengelola jadwal");

  } catch (error) {
    console.error("❌ Error seeding schedules:", error.message);
    process.exit(1);
  }
}

// Polyfill untuk crypto.randomUUID
const crypto = require('crypto');

seedSchedules();