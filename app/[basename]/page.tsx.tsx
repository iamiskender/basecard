import {
  getAddress,
  Avatar,
  Name,
  Address,
  Identity,
} from "@coinbase/onchainkit/identity";
import { activeChain } from "@/lib/wagmi";
import { TipForm } from "@/components/TipForm";
import { notFound } from "next/navigation";

export default async function ProfilePage({
  params,
}: {
  params: { basename: string };
}) {
  const basename = decodeURIComponent(params.basename);

  // Basename -> address resolution. OnchainKit resolves against the
  // Basenames resolver for the configured chain. If this ever needs to
  // move off OnchainKit, the guide's canonical source for the resolver
  // contracts is the `base/basenames` repo — re-check current addresses
  // there before hardcoding anything.
  let address: `0x${string}` | null = null;
  try {
    address = await getAddress({ name: basename, chain: activeChain });
  } catch {
    address = null;
  }

  if (!address) {
    notFound();
  }

  return (
    <main>
      <Identity address={address} chain={activeChain}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar address={address} chain={activeChain} className="basecard-avatar" />
          <div>
            <Name address={address} chain={activeChain} className="basecard-name" />
            <Address address={address} className="basecard-address" />
          </div>
        </div>
      </Identity>
      <TipForm recipient={address} recipientLabel={basename} />
    </main>
  );
}
