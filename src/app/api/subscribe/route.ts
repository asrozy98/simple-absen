import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addDeviceToken, deleteDeviceByToken } from "@/lib/google-sheets";

function parseUserAgent(ua: string) {
  const uaLower = ua.toLowerCase();
  let browser = "Browser lain";
  if (/edg\//.test(uaLower)) browser = "Edge";
  else if (/opr\//.test(uaLower) || /opera/.test(uaLower)) browser = "Opera";
  else if (/samsungbrowser/.test(uaLower)) browser = "Samsung Internet";
  else if (/firefox/.test(uaLower)) browser = "Firefox";
  else if (/chrome/.test(uaLower)) browser = "Chrome";
  else if (/safari/.test(uaLower)) browser = "Safari";

  let deviceType = "Desktop";
  if (/mobi|android|iphone|ipad|ipod/i.test(ua)) deviceType = "Mobile";

  let os = "Unknown";
  if (/windows/.test(uaLower)) os = "Windows";
  else if (/android/.test(uaLower)) os = "Android";
  else if (/iphone|ipad|ipod/.test(uaLower)) os = "iOS";
  else if (/mac os x/.test(uaLower) || /macintosh/.test(uaLower)) os = "macOS";
  else if (/linux/.test(uaLower)) os = "Linux";

  return { browser, deviceType, os };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const token = body.token;
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token wajib diisi" }, { status: 400 });
    }

    // validate it looks like a push subscription JSON
    try {
      const sub = JSON.parse(token);
      if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
        throw new Error("invalid");
      }
    } catch {
      return NextResponse.json({ error: "Format token tidak valid" }, { status: 400 });
    }

    const { browser, deviceType, os } = parseUserAgent(
      request.headers.get("user-agent") || "",
    );
    await addDeviceToken(session.user.id, token, browser, deviceType, os);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan perangkat" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const token = body.token;
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token wajib diisi" }, { status: 400 });
    }

    await deleteDeviceByToken(token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus perangkat" }, { status: 500 });
  }
}
