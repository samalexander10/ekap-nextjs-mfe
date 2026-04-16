import type { Metadata } from "next";
import "./globals.css";
import { SideNav } from "@/components/SideNav";
import { TopBar } from "@/components/TopBar";

export const metadata: Metadata = {
  title: "EKAP — Employee Knowledge & Assistance Platform",
  description: "Your intelligent HR assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ekap-surface text-slate-900 antialiased">
        <div className="flex h-screen overflow-hidden">
          <SideNav />
          <div className="flex flex-col flex-1 overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
