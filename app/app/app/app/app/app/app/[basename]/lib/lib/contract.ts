// TipJar ABI (only the pieces the frontend needs). Keep this in sync with
// contracts/src/TipJar.sol — if you change the contract, regenerate this.
export const tipJarAbi = [
  {
    type: "function",
    name: "tip",
    stateMutability: "payable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "message", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "totalReceived",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "tipCount",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Tip",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "message", type: "string", indexed: false },
    ],
    anonymous: false,
  },
] as const;

// Set after running the deploy script (script/DeployTipJar.s.sol).
// Do not hardcode a placeholder as if it were real — an empty/undeployed
// address should fail loudly in development rather than silently.
export const TIP_JAR_ADDRESS = process.env
  .NEXT_PUBLIC_TIP_JAR_ADDRESS as `0x${string}` | undefined;
