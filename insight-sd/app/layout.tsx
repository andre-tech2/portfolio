import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { TicketDataProvider } from "@/lib/context/TicketDataContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insight SD",
  description: "Dashboard local de análise do Service Desk",
};

const THEME_INIT_SCRIPT = `
try {
  if (localStorage.getItem('theme') === 'dark') {
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
        <TicketDataProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
        </TicketDataProvider>
      </body>
    </html>
  );
}
