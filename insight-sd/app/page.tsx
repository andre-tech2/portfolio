"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/layout/EmptyState";
import { useTicketData } from "@/lib/context/TicketDataContext";

export default function Home() {
  const router = useRouter();
  const { allTicketsCount, isLoading } = useTicketData();

  useEffect(() => {
    if (allTicketsCount > 0) router.replace("/overview");
  }, [allTicketsCount, router]);

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-[var(--text-muted)]">Carregando...</div>;
  }

  if (allTicketsCount === 0) {
    return <EmptyState />;
  }

  return null;
}
