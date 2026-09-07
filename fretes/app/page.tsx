"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShipmentData } from "@/lib/context/ShipmentDataContext";

export default function Home() {
  const router = useRouter();
  const { allShipmentsCount, isLoading } = useShipmentData();

  useEffect(() => {
    if (allShipmentsCount > 0) router.replace("/overview");
  }, [allShipmentsCount, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-[var(--text-muted)]">
      {isLoading ? "Carregando..." : null}
    </div>
  );
}
