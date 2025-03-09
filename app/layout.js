import { Inter } from "next/font/google";
import "./globals.css";
import { getSEOTags } from "@/lib/seo";

const font = Inter({ subsets: ["latin"] });

export const metadata = getSEOTags({
  title: "Uncover the insights in your logs in seconds | LogNessMonster.com",
  description:
    "Transform raw log data into actionable insights with a powerful log analysis tool. Visualize patterns and detect anomalies in real-time.",
  canonicalUrlRelative: "/",
});

export const viewport = {
  themeColor: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${font.className} antialiased`}>{children}</body>
    </html>
  );
}
