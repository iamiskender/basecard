import { getAddress } from "@coinbase/onchainkit/identity";
import { activeChain } from "@/lib/wagmi";
import { TipForm } from "@/components/TipForm";
import { ProfileIdentity } from "@/components/ProfileIdentity";
import { notFound } from "next/navigation";

// The Basename resolver call (OnchainKit -> Coinbase's domain resolver
// API) has been observed to fail intermittently in production even for
// names that resolve successfully seconds later — not a bug in this
// code, the upstream API is occasionally flaky. Retrying a couple of
// times before giving up avoids showing a false "not found" for a name
// that's actually registered.
async function resolveWithRetry(
  name: string,
  attempts = 3
): Promise<`0x${string}` | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const address = await getAddress({ name, chain: activeChain });
      if (address) return address;
    } catch {
      // fall through to retry
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
    }
  }
  return null;
}

export default async function ProfilePage({
  params,
}: {
  params: { basename: string };
}) {
  const basename = decodeURIComponent(params.basename);
  const address = await resolveWithRetry(basename);

  if (!address) {
    notFound();
  }

  return (
    <main>
      <ProfileIdentity address={address} />
      <TipForm recipient={address} recipientLabel={basename} />
    </main>
  );
}
