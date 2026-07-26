import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { getAddress as getAddressOnchainKit } from "@coinbase/onchainkit/identity";
import { activeChain } from "@/lib/wagmi";

// Basenames (*.base.eth) are fully ENS-spec-compliant: resolving one is
// no different from resolving any other ENS name. The standard path is
// a normal ENS lookup against Ethereum mainnet (which transparently
// CCIP-reads from Base's L2 registry under the hood) — this does not
// depend on any Coinbase-operated API and so isn't subject to that
// API's own rate limits. See: https://docs.base.org/base-account/basenames
//
// viem's default mainnet RPC endpoint has been observed to reject
// requests outright (HTTP 403), which silently broke resolution for
// every name, not just flaky ones. Using an explicit, well-known public
// RPC instead of the library default.
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum.publicnode.com"),
});

async function resolveViaEns(name: string): Promise<`0x${string}` | null> {
  try {
    return await mainnetClient.getEnsAddress({ name: normalize(name) });
  } catch (error) {
    console.error(`[resolveViaEns] failed for "${name}":`, error);
    return null;
  }
}

async function resolveViaOnchainKit(
  name: string
): Promise<`0x${string}` | null> {
  try {
    return await getAddressOnchainKit({ name, chain: activeChain });
  } catch (error) {
    console.error(`[resolveViaOnchainKit] failed for "${name}":`, error);
    return null;
  }
}

/**
 * Resolve a Basename to an address. Tries the standard ENS path first
 * (no Coinbase API dependency); falls back to OnchainKit's resolver if
 * that somehow fails. Each path gets a couple of retries before moving
 * on, since both have been observed to fail transiently even for names
 * that are definitely registered.
 */
export async function resolveBasename(
  name: string
): Promise<`0x${string}` | null> {
  for (let i = 0; i < 2; i++) {
    const address = await resolveViaEns(name);
    if (address) return address;
  }

  for (let i = 0; i < 2; i++) {
    const address = await resolveViaOnchainKit(name);
    if (address) return address;
  }

  return null;
}
