"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CadastroPage() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    telefone: "",
    idade: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nome: form.nome,
          telefone: form.telefone,
          idade: form.idade,
        },
      },
    });

    if (error) {
      setErr(error.message);
    } else {
      setMsg(
        "Cadastro criado! Verifique o e-mail para confirmar a conta."
      );
      console.log("Supabase signUp:", data);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Cadastro KIMAAKI</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          name="nome"
          placeholder="Nome completo"
          value={form.nome}
          onChange={onChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={onChange}
          required
        />
        <input
          name="telefone"
          placeholder="Telefone"
          value={form.telefone}
          onChange={onChange}
        />
        <input
          name="idade"
          type="number"
          placeholder="Idade"
          value={form.idade}
          onChange={onChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Processando..." : "Finalizar"}
        </button>
      </form>

      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>Erro: {err}</p>}
    </div>
  );
}
