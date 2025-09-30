"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestSupabase() {
  const [result, setResult] = useState<any>(null);

  async function handleTest() {
    const { data, error } = await supabase.auth.signUp({
      email: "teste" + Date.now() + "@gmail.com",
      password: "12345678",
    });
    setResult({ data, error });
  }

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={handleTest} style={{ padding: "10px", background: "green", color: "white" }}>
        Testar Supabase
      </button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
