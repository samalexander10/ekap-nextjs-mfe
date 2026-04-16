import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EKAP HR Name Change",
  description: "Legal name change request micro-frontend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
