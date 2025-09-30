"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut(); // encerra sessão
    router.push("/"); // redireciona após sair (home ou login)
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        marginTop: "0",
        padding: "10px 14px",
        background: "#dc2626",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600"
      }}
    >
      Sair
    </button>
  );
}
