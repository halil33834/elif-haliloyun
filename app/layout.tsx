import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elif & Halil Oyun | Sevgili Oyunları",
  description: "Sevgilinle veya arkadaşınla oynayabileceğin gerçek zamanlı mini oyunlar."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-app-gradient bg-fixed">{children}</body>
    </html>
  );
}
