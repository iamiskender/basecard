"use client";

import { Avatar, Name, Address } from "@coinbase/onchainkit/identity";
import { activeChain } from "@/lib/wagmi";

// Deliberately without OnchainKit's <Identity> wrapper. It renders its own
// surface, which sits on top of the page background as a dark band. The three
// pieces below each take address and chain directly, so the wrapper buys
// nothing here and costs the layout.
export function ProfileIdentity({ address }: { address: `0x${string}` }) {
  return (
    <div className="identity-row">
      <Avatar address={address} chain={activeChain} className="basecard-avatar" />
      <div>
        <Name address={address} chain={activeChain} className="basecard-name" />
        <Address address={address} className="address-chip" />
      </div>
    </div>
  );
}
