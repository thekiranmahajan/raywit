import { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientLayout from "./ClientLayout";

// Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://raywit"),
  title: "Gappe",
  description:
    "RayWit is a private chat for two authorized users. Password login with persistent chat history.",
  keywords: [
    "RayWit",
    "private chat",
    "two-user chat",
    "password login",
    "persistent history",
    "secure messaging",
  ],
  authors: [{ name: "RayWit" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1E1E2F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Google Site Verification */}
        <meta
          name="google-site-verification"
          content="6s1zvqQYarzATN68TYLQqk3G5xtx7d1tt7gGzm4aWzE"
        />

        {/* SEO Meta Tags */}
        <meta name="description" content={metadata.description ?? ""} />
        <meta
          name="keywords"
          content={
            Array.isArray(metadata.keywords)
              ? metadata.keywords.join(", ")
              : (metadata.keywords ?? "")
          }
        />
        <meta
          name="author"
          content={
            Array.isArray(metadata.authors) ? metadata.authors.join(", ") : ""
          }
        />

        <title>{String(metadata.title ?? "RayWit")}</title>

        {/* Fonts */}
        <link rel="icon" href="/favicon.ico" />
        {/* Fonts are now added in _document.tsx */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C0FQ6EPDCL"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C0FQ6EPDCL');
          `}
        </Script>
      </body>
    </html>
  );
}
