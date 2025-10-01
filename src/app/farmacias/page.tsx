"use client";

import StoreList from "@/components/StoreList";

export default function FarmaciasPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Farmácias</h1>
      <StoreList category="Farmácias" />
    </div>
  );
}
