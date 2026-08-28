import { createPublicClient, http, namehash } from "viem";
import { base, mainnet } from "viem/chains";
import { normalize } from "viem/ens";

// Basenames live in an L2Resolver on Base. The usual path is a mainnet ENS
// lookup, which reverts with OffchainLookup and sends the client to a CCIP
// gateway operated by Base. That gateway is an HTTP dependency, and when it is
// unreachable, resolution fails for every name at once rather than for one.
// Observed failure: "execution reverted: HTTP request failed" from viem's
// offchainLookup, with api.coinbase.com unreachable from the client network.
//
// ENS documents direct L2 resolution as the fallback when CCIP endpoints fail.
// Here it is the primary path instead: it is one eth_call against Base with no
// HTTP hop, it returns the same address the gateway would have returned, and
// it removes a whole class of outage from the critical path.
//
// Verified equal for iamiskender.base.eth:
//   cast call 0xC6d566A56A1aFf6508b41f6c90ff131615583BCD \
//     "addr(bytes32)(address)" $(cast namehash iamiskender.base.eth) \
//     --rpc-url https://mainnet.base.org
// https://github.com/base/basenames lists the deployment addresses.
const BASE_L2_RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD" as const;

const ZERO = "0x0000000000000000000000000000000000000000";

const l2ResolverAbi = [
  {
    type: "function",
    name: "addr",
    stateMutability: "view",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const baseClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

// viem's default mainnet endpoint has been observed to return 403, which
// silently broke resolution for every name. Pin an explicit public RPC.
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum.publicnode.com"),
});

/** Direct read from the Basenames L2Resolver. No gateway, no HTTP hop. */
async function resolveViaBaseL2(name: string): Promise<`0x${string}` | null> {
  try {
    const address = await baseClient.readContract({
      address: BASE_L2_RESOLVER,
      abi: l2ResolverAbi,
      functionName: "addr",
      args: [namehash(normalize(name))],
    });
    return address && address !== ZERO ? address : null;
  } catch (error) {
    console.error(`[resolveViaBaseL2] failed for "${name}":`, error);
    return null;
  }
}

/** Standard mainnet ENS lookup. Goes through the CCIP gateway for .base.eth. */
async function resolveViaEns(name: string): Promise<`0x${string}` | null> {
  try {
    return await mainnetClient.getEnsAddress({ name: normalize(name) });
  } catch (error) {
    console.error(`[resolveViaEns] failed for "${name}":`, error);
    return null;
  }
}

/**
 * Resolve a name to an address.
 *
 * .base.eth goes to the L2 resolver first, then falls back to mainnet ENS.
 * Anything else is a normal ENS name and only the mainnet path applies.
 * Each path gets a retry, since both have been seen to fail transiently for
 * names that are definitely registered.
 */
export async function resolveBasename(
  name: string
): Promise<`0x${string}` | null> {
  const isBasename = name.toLowerCase().endsWith(".base.eth");

  if (isBasename) {
    for (let i = 0; i < 2; i++) {
      const address = await resolveViaBaseL2(name);
      if (address) return address;
    }
  }

  for (let i = 0; i < 2; i++) {
    const address = await resolveViaEns(name);
    if (address) return address;
  }

  return null;
}
