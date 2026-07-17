/**
 * Script untuk membuat akun admin pertama di Google Sheets
 *
 * Cara pakai:
 *   node scripts/seed-admin.js <username> <password> <nama_lengkap>
 *
 * Contoh:
 *   node scripts/seed-admin.js admin admin123 "Admin Utama"
 */
const bcrypt = require("bcryptjs");

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];

  if (!username || !password || !name) {
    console.log("Cara pakai: node scripts/seed-admin.js <username> <password> <nama_lengkap>");
    console.log("Contoh:     node scripts/seed-admin.js admin admin123 \"Admin Utama\"");
    process.exit(1);
  }

  const { google } = require("googleapis");
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    console.error("Error: GOOGLE_SPREADSHEET_ID belum di-set di .env.local");
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Users!A:F",
    valueInputOption: "RAW",
    requestBody: {
      values: [[id, username, hashedPassword, name, "admin", createdAt]],
    },
  });

  console.log("Admin berhasil dibuat!");
  console.log("  Username:", username);
  console.log("  Nama:    ", name);
  console.log("  Role:    admin");
  console.log("");
  console.log("Sekarang Anda bisa login dengan username & password tersebut.");
}

main().catch(console.error);
