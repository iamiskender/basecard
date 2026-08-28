// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TipJar} from "../src/TipJar.sol";

/// Deploy TipJar and print the address to paste into NEXT_PUBLIC_TIP_JAR_ADDRESS.
///
/// Base Sepolia:
///   forge script script/DeployTipJar.s.sol \
///     --rpc-url https://sepolia.base.org \
///     --account deployer \
///     --broadcast --verify
///
/// Base mainnet: swap the RPC for https://mainnet.base.org and set
/// NEXT_PUBLIC_CHAIN_ID=8453 in the frontend.
///
/// Import the deployer key once with `cast wallet import deployer --interactive`
/// rather than putting a raw key in .env. The key never touches the repo.
contract DeployTipJar is Script {
    function run() external returns (TipJar tipJar) {
        vm.startBroadcast();
        tipJar = new TipJar();
        vm.stopBroadcast();

        console.log("TipJar deployed to:", address(tipJar));
        console.log("chain id:", block.chainid);
        console.log("");
        console.log("Add to .env.local:");
        console.log(
            string.concat(
                "NEXT_PUBLIC_TIP_JAR_ADDRESS=", vm.toString(address(tipJar))
            )
        );
    }
}
