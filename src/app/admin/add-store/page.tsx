"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AddStorePage() {
  const [form, setForm] = useState({
    name: "",
    category: "",
    rating: "",
    price: "",
    time: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from("stores").insert([form]);
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Loja adicionada com sucesso!");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Adicionar Loja</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" placeholder="Nome" onChange={handleChange} className="border p-2 w-full" />
        <input name="category" placeholder="Categoria (restaurantes, supermercados, farmacias, lojas)" onChange={handleChange} className="border p-2 w-full" />
        <input name="rating" placeholder="Avaliação (ex: 4.5)" onChange={handleChange} className="border p-2 w-full" />
        <input name="price" placeholder="Preço (ex: 500 Kz)" onChange={handleChange} className="border p-2 w-full" />
        <input name="time" placeholder="Tempo (ex: 20-30 min)" onChange={handleChange} className="border p-2 w-full" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Salvar</button>
      </form>
    </div>
  );
}
