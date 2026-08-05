import { NextResponse } from "next/server";
import webpush from "web-push";
import { todayJakarta } from "@/lib/utils";
import {
  getUsers,
  getAttendance,
  getDevices,
  deleteDeviceByToken,
  type Device,
} from "@/lib/google-sheets";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const contactEmail = process.env.NOTIFY_CONTACT_EMAIL || "";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Protected by shared secret (Cloudflare cron / manual trigger)
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!publicKey || !privateKey || !contactEmail) {
    return NextResponse.json(
      { error: "VAPID keys / contact email belum di-set" },
      { status: 500 },
    );
  }

  try {
    webpush.setVapidDetails(`mailto:${contactEmail}`, publicKey, privateKey);

    const url = new URL(request.url);
    const type = url.searchParams.get("type") === "out" ? "out" : "in";

    const today = todayJakarta();
    const users = (await getUsers()).filter((u) => u.role === "user");
    const attendanceToday = (await getAttendance()).filter(
      (a) => a.date === today,
    );

    // group devices once instead of N+1 getDevices() calls per user
    const devicesByUser = new Map<string, Device[]>();
    for (const d of await getDevices()) {
      const list = devicesByUser.get(d.userId);
      if (list) list.push(d);
      else devicesByUser.set(d.userId, [d]);
    }

    let targets = users;
    if (type === "in") {
      const clockedIn = new Set(
        attendanceToday.filter((a) => a.timeIn).map((a) => a.userId),
      );
      targets = users.filter((u) => !clockedIn.has(u.id));
    } else {
      const notClockedOut = attendanceToday.filter(
        (a) => a.timeIn && !a.timeOut,
      );
      const targetIds = new Set(notClockedOut.map((a) => a.userId));
      targets = users.filter((u) => targetIds.has(u.id));
    }

    const title =
      type === "in" ? "Reminder Absen Masuk" : "Reminder Absen Pulang";

    let notified = 0;
    let errors = 0;
    let pruned = 0;

    for (const user of targets) {
      const body =
        type === "in"
          ? `Halo ${user.name}, Anda belum absen masuk hari ini. Jangan lupa!`
          : `${user.name}, Anda sudah absen masuk tapi belum absen pulang. Jangan lupa!`;
      const devices = devicesByUser.get(user.id) || [];
      for (const device of devices) {
        try {
          let sub: { endpoint: string; keys: { p256dh: string; auth: string } };
          try {
            sub = JSON.parse(device.token);
          } catch {
            await deleteDeviceByToken(device.token);
            pruned++;
            continue;
          }
          await webpush.sendNotification(
            sub,
            JSON.stringify({
              title,
              body,
              icon: process.env.NEXT_PUBLIC_SCHOOL_LOGO || "/vercel.svg",
              badge: process.env.NEXT_PUBLIC_SCHOOL_LOGO || "/vercel.svg",
              url: "/user/clockin",
            }),
          );
          notified++;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await deleteDeviceByToken(device.token);
            pruned++;
          } else {
            errors++;
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      type,
      date: today,
      targets: targets.length,
      notified,
      errors,
      pruned,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengirim";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
