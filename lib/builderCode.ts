import { Attribution } from "ox/erc8021";

// Set this to your registered Base Builder Code. Every tip transaction
// gets this appended as a calldata suffix so it's attributed to Basecard
// in Base Builder Code analytics. Leave the env var unset in local dev —
// dataSuffix is simply omitted rather than sent empty/malformed.
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE;

export function getDataSuffix(): `0x${string}` | undefined {
  if (!BUILDER_CODE) return undefined;
  return Attribution.toDataSuffix({ codes: [BUILDER_CODE] });
}
