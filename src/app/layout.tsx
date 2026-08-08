import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "./ClientProviders";
import LayoutShell from "./LayoutShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "abbeslim. | Life OS — Kişisel Kontrol Merkezi",
  description: "Ders notlarınız, görevleriniz, hedefleriniz ve günlük yaşamınızı tek bir yerden yönetin. AI destekli akıllı arama, takvim, finans takibi ve daha fazlası.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-128.png", type: "image/png", sizes: "128x128" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var lang = JSON.parse(localStorage.getItem('lifeos-language')).state.language;
                if (lang) {
                  document.documentElement.lang = lang;
                  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full`}>
        <ClientProviders>
          <LayoutShell>
            {children}
          </LayoutShell>
        </ClientProviders>
      </body>
    </html>
  );
}

