/**
 * Tes kirim push notification ke semua token di tab "Devices".
 *
 * Cara pakai:
 *   node scripts/test-push.js
 *
 * Perlu env: GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SPREADSHEET_ID,
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, NOTIFY_CONTACT_EMAIL
 */
const webpush = require("web-push");
require("dotenv").config({ path: ".env.local" });

const { google } = require("googleapis");
const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

async function main() {
  webpush.setVapidDetails(
    `mailto:${process.env.NOTIFY_CONTACT_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    range: "Devices!A2:D",
  });
  const rows = res.data.values || [];
  if (rows.length === 0) {
    console.log("Tidak ada token di tab Devices.");
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification(
        JSON.parse(row[2]),
        JSON.stringify({
          title: "Tes Notifikasi",
          body: "Ini notifikasi percobaan dari aplikasi absensi.",
          icon: process.env.NEXT_PUBLIC_SCHOOL_LOGO || "/icon.svg",
          badge: process.env.NEXT_PUBLIC_SCHOOL_LOGO || "/icon.svg",
          url: "/user/clockin",
        }),
      );
      ok++;
      console.log("OK    ->", row[3] || "(tanpa timestamp)");
    } catch (err) {
      fail++;
      console.log(
        "GAGAL ->",
        err.statusCode || err.message,
        row[3] || "(tanpa timestamp)",
      );
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log("  (token basi — akan di-prune otomatis saat cron jalan)");
      }
    }
  }
  console.log(`Selesai. Terkirim: ${ok}, Gagal: ${fail}`);
}

main().catch((e) => console.error("ERR", e.message));
