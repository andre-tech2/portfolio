"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRangeSelector } from "./DateRangeSelector";
import { RegionSelector } from "./RegionSelector";
import { Logo } from "./Logo";
import { useShipmentData } from "@/lib/context/ShipmentDataContext";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

const NAV_ITEMS = [
  { href: "/overview", label: "Visão Geral" },
  { href: "/carriers", label: "Transportadoras" },
  { href: "/occurrences", label: "Ocorrências" },
  { href: "/regions", label: "Regiões" },
  { href: "/recommendations", label: "Recomendações" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { meta, allShipmentsCount, metrics, dateRangePreset } = useShipmentData();
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return (
    <header className="no-print sticky top-0 z-40 bg-[var(--brand)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 rounded-lg" style={{ boxShadow: "0 0 20px rgba(0,0,0,0.35)" }} />
          <div>
            <p className="text-sm font-bold tracking-wide text-white">
              FRETES{" "}
              <a
                href="https://www.linkedin.com/in/andrelsandre"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-normal tracking-normal text-white/60 hover:text-white hover:underline"
              >
                por André André
              </a>
            </p>
            {meta && (
              <p className="text-[11px] text-white/70">
                {dateRangePreset === "all" ? `${meta.shipmentCount} envios` : `${metrics?.totalShipments ?? 0} de ${allShipmentsCount} envios`}
              </p>
            )}
          </div>
        </div>

        {allShipmentsCount > 0 && (
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {allShipmentsCount > 0 && <RegionSelector />}
          {allShipmentsCount > 0 && <DateRangeSelector />}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
            className="rounded-md p-2 text-lg leading-none text-white/70 transition-colors hover:text-white"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <Link
            href="/settings"
            title="Configurações"
            aria-label="Configurações"
            className={`rounded-md p-2 text-lg leading-none transition-colors ${
              pathname === "/settings" ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            ⚙
          </Link>
        </div>
      </div>
    </header>
  );
}
