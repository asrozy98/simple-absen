import Sidebar from "@/components/sidebar";
import NotificationWire from "@/components/notification-wire";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <NotificationWire />
      <Sidebar />
      <div className="lg:pl-[260px]">
        <main className="container max-w-full py-6 px-4 sm:px-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
