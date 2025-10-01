"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase";

interface Store {
  id: string;
  name: string;
  category: string;
  rating: number;
  price: string;
  time: string;
}

export default function StoreList({ category }: { category: string }) {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    async function fetchStores() {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("category", category);

      if (error) {
        console.error("Erro ao buscar lojas:", error.message);
      } else {
        setStores(data || []);
      }
    }

    fetchStores();
  }, [category]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{category}</h1>
      {stores.length === 0 ? (
        <p>Nenhuma loja encontrada.</p>
      ) : (
        <ul className="space-y-2">
          {stores.map((store) => (
            <li
              key={store.id}
              className="border p-3 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <h2 className="font-semibold">{store.name}</h2>
              <p>⭐ {store.rating}</p>
              <p>💰 {store.price}</p>
              <p>⏰ {store.time}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
