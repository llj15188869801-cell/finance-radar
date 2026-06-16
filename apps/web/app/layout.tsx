import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { Disclaimer } from "../components/Disclaimer";
import "./globals.css";
import "./auth.css";

export const metadata: Metadata = {
  title: { default: "财讯雷达", template: "%s · 财讯雷达" },
  description: "把多信源财经信息整理成可核验的热点、影响与风险提示。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        {children}
        <footer>
          <Disclaimer />
          <span>© 2026 财讯雷达 · 信息来自公开信源</span>
        </footer>
      </body>
    </html>
  );
}
