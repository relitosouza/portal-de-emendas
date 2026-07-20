import type { Metadata } from "next";
import "./globals.css";
import VLibras from "@/components/shared/vlibras";
import AccessibilityBar from "@/components/shared/accessibility-bar";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

// Fallback: Use system fonts. Google Fonts can be re-enabled once network is available
// Original fonts: Plus_Jakarta_Sans, JetBrains_Mono from next/font/google
// For offline builds, we use CSS fallbacks in globals.css

const plusJakarta = { variable: "--font-plus-jakarta" };
const jetbrainsMono = { variable: "--font-jetbrains-mono" };

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Portal das Emendas | Prefeitura de Osasco",
    template: "%s | Portal das Emendas de Osasco",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Prefeitura Municipal de Osasco" }],
  creator: "Prefeitura Municipal de Osasco",
  publisher: "Prefeitura Municipal de Osasco",
  category: "Transparência pública",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE_NAME,
    title: "Portal das Emendas | Prefeitura de Osasco",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/mockup.png",
        width: 1024,
        height: 497,
        alt: "Painel do Portal das Emendas de Osasco",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal das Emendas | Prefeitura de Osasco",
    description: SITE_DESCRIPTION,
    images: ["/mockup.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  keywords: [
    "emendas parlamentares",
    "emendas Osasco",
    "transparência pública",
    "execução orçamentária",
    "Prefeitura de Osasco",
  ],
  icons: {
    icon: "/brasao.ico",
    apple: "/brasao-osasco.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {/* Skip navigation — eMAG 2.1 / WCAG 2.4.1 */}
        <a href="#conteudo-principal" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <AccessibilityBar />
        <div id="conteudo-principal" tabIndex={-1}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
        <VLibras />
      </body>
    </html>
  );
}
