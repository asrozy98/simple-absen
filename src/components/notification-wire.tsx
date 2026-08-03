"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64WithPadding = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64WithPadding);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationWire() {
  const subscribed = useRef(false);

  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (subscribed.current || !vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }
    subscribed.current = true;
    const key: string = vapidKey;

    let setup = async function init() {
      try {
        console.log("[notif] register SW");
        await navigator.serviceWorker.register("/sw.js");
        console.log("[notif] await ready SW");
        const registration = await navigator.serviceWorker.ready;

        let permission = Notification.permission;
        if (permission === "default") {
          console.log("[notif] request permission");
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted") {
          console.log("[notif] permission denied:", permission);
          return;
        }

        let sub = null;
        const subscribe = () =>
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          });
        // ponytail: no getSubscription() first — in Firefox the follow-up
        // subscribe() aborts with "Error retrieving push subscription".
        // subscribe() returns the existing subscription if present.
        for (let attempt = 1; attempt <= 3 && !sub; attempt++) {
          try {
            sub = await subscribe();
          } catch (err) {
            if (
              attempt === 3 ||
              !(err instanceof DOMException && err.name === "AbortError")
            ) {
              throw err;
            }
            console.log(`[notif] subscribe aborted, retry ${attempt}`);
            await new Promise((r) => setTimeout(r, 750 * attempt));
          }
        }
        if (!sub) throw new Error("subscribe() returned null");
        console.log("[notif] subscribed, endpoint:", sub.endpoint);

        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: JSON.stringify({
              endpoint: sub.endpoint,
              keys: sub.toJSON().keys,
            }),
          }),
        });
        if (!res.ok) {
          const result = await res.json().catch(() => ({}));
          console.error("[notif] subscribe API failed", res.status, result);
          toast.error(result.error || "Gagal menyimpan notifikasi");
          return;
        }
        console.log("[notif] token saved");
        toast.success("Notifikasi reminder absen aktif");
      } catch (err) {
        console.error("[notif] error:", err);
        toast.error(`Gagal mengaktifkan notifikasi: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    setup();
  }, []);

  return null;
}
