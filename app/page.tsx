"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();

  function goToProfile(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    router.push(`/${name.endsWith(".base.eth") ? name : `${name}.base.eth`}`);
  }

  return (
    <main>
      <h1>Basecard</h1>
      <p>
        Support any Base builder directly, by their Basename. No signup, no
        custody — tips go straight to their wallet onchain.
      </p>
      <form onSubmit={goToProfile} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="yourfriend.base.eth"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #333" }}
        />
        <button type="submit" style={{ padding: "10px 16px", borderRadius: 8 }}>
          View
        </button>
      </form>
      <p style={{ marginTop: 32, fontSize: 13, opacity: 0.6 }}>
        Have a Basename yourself? Share <code>basecard.app/yourname.base.eth</code>{" "}
        so people can support you.
      </p>
    </main>
  );
}
