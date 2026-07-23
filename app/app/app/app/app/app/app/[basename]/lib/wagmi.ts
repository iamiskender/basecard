import { baseSepolia, base } from "wagmi/chains";
import { createConfig, cookieStorage, createStorage, http } from "wagmi";
// NOTE: the build guide's example imports `baseAccount` from
// "@base-org/account/wagmi", but the installed @base-org/account version
// does not expose that subpath (verified against node_modules at build
// time -- only ".", "./payment", "./ui-assets" are exported). wagmi ships
// its own `baseAccount` connector, which is what's actually used here.
// Re-check both packages' current exports before assuming either is
// correct -- this is exactly the kind of fast-moving SDK detail the
// guide flags under "Current-Info Requirements".
import { injected, baseAccount } from "wagmi/connectors";

// Base Sepolia is the default network for this project per the build
// guide ("use Base Sepolia first for new builds"). Base Mainnet is wired
// in so switching to production is a one-line change once the app is
// ready, not a rewrite.
const targetChain =
  process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia;

export const config = createConfig({
  chains: [targetChain],
  connectors: [
    injected(),
    baseAccount({ appName: "Basecard" }),
  ],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
  },
});

export const activeChain = targetChain;

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
