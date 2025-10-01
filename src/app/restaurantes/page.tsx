"use client";

import StoreList from "@/components/StoreList";

export default function RestaurantesPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Restaurantes</h1>
      <StoreList category="Restaurantes" />
    </div>
  );
}
