// src/app/layout.tsx
import "./globals.css";
import Providers from "../components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}