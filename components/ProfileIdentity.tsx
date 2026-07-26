"use client";

import { Avatar, Name, Address, Identity } from "@coinbase/onchainkit/identity";
import { activeChain } from "@/lib/wagmi";

export function ProfileIdentity({ address }: { address: `0x${string}` }) {
  return (
    <Identity address={address} chain={activeChain}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar address={address} chain={activeChain} className="basecard-avatar" />
        <div>
          <Name address={address} chain={activeChain} className="basecard-name" />
          <Address address={address} className="basecard-address" />
        </div>
      </div>
    </Identity>
  );
}
