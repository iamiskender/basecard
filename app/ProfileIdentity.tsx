"use client";

import { useState } from "react";
import { Avatar, Name, Identity } from "@coinbase/onchainkit/identity";
import { activeChain } from "@/lib/wagmi";

export function ProfileIdentity({ address }: { address: `0x${string}` }) {
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Identity address={address} chain={activeChain}>
      <div className="identity-row">
        <Avatar
          address={address}
          chain={activeChain}
          className="basecard-avatar"
        />
        <div>
          <Name
            address={address}
            chain={activeChain}
            className="basecard-name"
          />
          <button className="address-chip" onClick={copyAddress} type="button">
            {copied
              ? "Copied"
              : `${address.slice(0, 6)}...${address.slice(-4)}`}
          </button>
        </div>
      </div>
    </Identity>
  );
}
