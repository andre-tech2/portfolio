"use client";

import { DEPARTMENT_FILTER_ALL, useTicketData } from "@/lib/context/TicketDataContext";

export function DepartmentSelector() {
  const { availableDepartments, selectedDepartment, setSelectedDepartment } = useTicketData();

  if (availableDepartments.length === 0) return null;

  return (
    <select
      value={selectedDepartment}
      onChange={(e) => setSelectedDepartment(e.target.value)}
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
      title="Área/departamento considerado em todas as páginas"
    >
      <option value={DEPARTMENT_FILTER_ALL}>Todas as áreas</option>
      {availableDepartments.map((department) => (
        <option key={department} value={department}>
          {department}
        </option>
      ))}
    </select>
  );
}
