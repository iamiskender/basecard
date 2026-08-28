# Basecard

Support any Base builder by their Basename. No signup, no custody, one transaction.

Type a Basename, land on that builder's page, send them ETH with an optional message. The tip goes straight to their wallet in the same call. Basecard never holds a balance.

## How it works

The `TipJar` contract is a pass-through. It forwards `msg.value` to the recipient inside the same transaction, records two counters, and emits an event. It has no `receive` or `fallback`, so a plain transfer to it reverts rather than stranding funds, and there is nothing to withdraw because nothing accumulates.

Basenames resolve through OnchainKit. Tips carry an ERC-8021 Builder Code suffix appended after the calldata, so they are attributable without changing the function signature.

## Deployment

| | |
|---|---|
| Network | Base Sepolia (84532) |
| TipJar | [`0x6fd261311DA2d2C34Fc8150a23d6e6aB04AaF7A5`](https://sepolia.basescan.org/address/0x6fd261311DA2d2C34Fc8150a23d6e6aB04AaF7A5) |

Base mainnet is not deployed yet. Set `NEXT_PUBLIC_CHAIN_ID=8453` and redeploy the contract when it is.

## Run it locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

`.env.example` already points at the deployed Sepolia contract, so tips work out of the box on testnet. Add an OnchainKit API key for Basename resolution; without one, addresses still work but names do not resolve.

## Contracts

Foundry project under `contracts/`.

```bash
cd contracts
forge install foundry-rs/forge-std
forge test
```

Deploy your own:

```bash
cast wallet import deployer --interactive
forge script script/DeployTipJar.s.sol \
  --rpc-url https://sepolia.base.org \
  --account deployer --broadcast
```

The script prints the line to paste into `.env.local`. The deployer key lives in an encrypted keystore, never in `.env`.

## Tests

14 tests, including the two that are easy to get wrong.

**Trailing calldata.** The frontend appends a Builder Code suffix after the encoded arguments. Solidity's decoder ignores trailing bytes, so `tip` behaves identically with and without one. If that were not true, every attributed tip would revert while unattributed ones worked, which is a bug you find in production or not at all. `test_AcceptsTrailingBuilderCodeSuffix` pins it.

**Smart contract wallets.** The contract uses `call` rather than `transfer`, because the 2300 gas stipend is not enough for a contract wallet and most Base builders use one. The test recipient deliberately costs more than the stipend, so a `transfer` implementation fails it.

One known mismatch, documented by `test_MessageLimitCountsBytesNotCharacters`: the contract caps messages at 140 **bytes** while the UI caps input at 140 **characters**. A message of 71 two-byte characters passes the UI and reverts onchain. The contract is right; the input needs a byte-aware counter.

## Stack

Next.js 14 (App Router), TypeScript, wagmi, viem, OnchainKit, Foundry.

## License

MIT
