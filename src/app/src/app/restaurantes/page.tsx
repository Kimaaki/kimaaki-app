import StoreList from "@/components/StoreList";

export default function RestaurantesPage() {
  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">🍽️ Restaurantes</h1>
      <StoreList category="Restaurantes" />
    </main>
  );
}
