import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { ShipmentDataProvider } from "@/lib/context/ShipmentDataContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fretes",
  description: "Painel de desempenho de transportadoras",
};

const THEME_INIT_SCRIPT = `
try {
  if (localStorage.getItem('fretes-theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ShipmentDataProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
        </ShipmentDataProvider>
      </body>
    </html>
  );
}
