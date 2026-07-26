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
      <div className="wordmark">
        <span className="wordmark-dot" />
        Basecard
      </div>

      <h1 className="hero-title">
        Support any Base builder,
        <br />
        by their Basename.
      </h1>
      <p className="hero-subtitle">
        No signup, no custody. Tips go straight to their wallet, onchain,
        in one transaction.
      </p>

      <form onSubmit={goToProfile} className="field-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="yourfriend.base.eth"
          className="text-input"
        />
        <button type="submit" className="btn btn-primary">
          View
        </button>
      </form>

      <p className="helper-text">
        Have a Basename yourself? Share{" "}
        <code>basecard.app/yourname.base.eth</code> so people can support
        you.
      </p>
    </main>
  );
}
