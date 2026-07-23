/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @wagmi/connectors' baseAccount connector pulls in @base-org/account's
  // Node entrypoint, which drags in @coinbase/cdp-sdk's optional x402
  // client packages (@x402/evm, @x402/svm, ...). This app only uses the
  // browser wallet-connect flow, never CDP/x402 server actions, so those
  // optional deps are neither installed nor needed -- tell webpack to
  // stub the whole cdp-sdk import out instead of trying to resolve it.
  webpack: (config) => {
    config.resolve.alias["@coinbase/cdp-sdk"] = false;
    return config;
  },
};

module.exports = nextConfig;
