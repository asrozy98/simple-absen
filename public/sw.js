self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || "",
    icon: data.icon || "/vercel.svg",
    badge: "/vercel.svg",
    data: { url: data.url || "/user/clockin" },
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "Reminder Absen", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/user/clockin";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin)) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
