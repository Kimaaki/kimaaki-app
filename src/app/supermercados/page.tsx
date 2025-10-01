"use client";

import StoreList from "@/components/StoreList";

export default function SupermercadosPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supermercados</h1>
      <StoreList category="Supermercados" />
    </div>
  );
}
