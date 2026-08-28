// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TipJar} from "../src/TipJar.sol";

contract Reverter {
    receive() external payable {
        revert("nope");
    }
}

contract SmartWallet {
    uint256 public received;

    // Deliberately more expensive than the 2300 gas stipend, so a TipJar that
    // used transfer() instead of call() would fail this test.
    mapping(uint256 => uint256) private log;
    uint256 private n;

    receive() external payable {
        received += msg.value;
        log[n] = block.timestamp;
        n += 1;
    }
}

contract TipJarTest is Test {
    TipJar internal jar;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    event Tip(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp,
        string message
    );

    function setUp() public {
        jar = new TipJar();
        vm.deal(alice, 10 ether);
    }

    function test_ForwardsTheFullValue() public {
        uint256 before = bob.balance;

        vm.prank(alice);
        jar.tip{value: 1 ether}(bob, "great work on this!");

        assertEq(bob.balance - before, 1 ether);
        assertEq(address(jar).balance, 0, "jar must never hold a balance");
    }

    function test_RecordsTotals() public {
        vm.startPrank(alice);
        jar.tip{value: 0.4 ether}(bob, "one");
        jar.tip{value: 0.6 ether}(bob, "two");
        vm.stopPrank();

        assertEq(jar.totalReceived(bob), 1 ether);
        assertEq(jar.tipCount(bob), 2);
    }

    function test_EmitsTip() public {
        vm.expectEmit(true, true, true, true);
        emit Tip(alice, bob, 0.1 ether, block.timestamp, "hello");

        vm.prank(alice);
        jar.tip{value: 0.1 ether}(bob, "hello");
    }

    /// The frontend appends an ERC-8021 Builder Code suffix after the encoded
    /// calldata. If the decoder rejected trailing bytes, every attributed tip
    /// would revert while unattributed ones worked, which is the kind of bug
    /// that only shows up in production.
    function test_AcceptsTrailingBuilderCodeSuffix() public {
        bytes memory callData = abi.encodeCall(TipJar.tip, (bob, "thanks"));
        bytes memory suffix = hex"8021deadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
        bytes memory withSuffix = bytes.concat(callData, suffix);

        uint256 before = bob.balance;

        vm.prank(alice);
        (bool ok, ) = address(jar).call{value: 0.25 ether}(withSuffix);

        assertTrue(ok, "trailing suffix must not break decoding");
        assertEq(bob.balance - before, 0.25 ether);
        assertEq(jar.tipCount(bob), 1);
    }

    function test_WorksWithASmartContractWallet() public {
        SmartWallet wallet = new SmartWallet();

        vm.prank(alice);
        jar.tip{value: 0.5 ether}(address(wallet), "for the wallet");

        assertEq(wallet.received(), 0.5 ether);
    }

    function test_AcceptsAnEmptyMessage() public {
        vm.prank(alice);
        jar.tip{value: 0.01 ether}(bob, "");
        assertEq(jar.tipCount(bob), 1);
    }

    function test_AcceptsExactlyMaxMessageBytes() public {
        string memory message = _repeat("a", 140);

        vm.prank(alice);
        jar.tip{value: 0.01 ether}(bob, message);
        assertEq(jar.tipCount(bob), 1);
    }

    function test_RevertsOnMessageOverLimit() public {
        string memory message = _repeat("a", 141);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(TipJar.MessageTooLong.selector, 141, 140));
        jar.tip{value: 0.01 ether}(bob, message);
    }

    /// The limit is counted in bytes. A multi-byte character therefore costs
    /// more than one against it, which the UI's character cap does not know.
    function test_MessageLimitCountsBytesNotCharacters() public {
        // 71 copies of a two-byte character is 142 bytes.
        string memory message = _repeat(unicode"ş", 71);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(TipJar.MessageTooLong.selector, 142, 140));
        jar.tip{value: 0.01 ether}(bob, message);
    }

    function test_RevertsOnZeroRecipient() public {
        vm.prank(alice);
        vm.expectRevert(TipJar.ZeroRecipient.selector);
        jar.tip{value: 1 ether}(address(0), "");
    }

    function test_RevertsOnZeroValue() public {
        vm.prank(alice);
        vm.expectRevert(TipJar.ZeroAmount.selector);
        jar.tip{value: 0}(bob, "");
    }

    function test_RevertsWhenRecipientRejects() public {
        Reverter reverter = new Reverter();

        vm.prank(alice);
        vm.expectRevert(TipJar.TransferFailed.selector);
        jar.tip{value: 1 ether}(address(reverter), "");
    }

    /// No receive or fallback, so a plain send reverts rather than leaving ETH
    /// in a contract with no way to withdraw it.
    function test_RejectsAPlainTransfer() public {
        vm.prank(alice);
        (bool ok, ) = address(jar).call{value: 1 ether}("");
        assertFalse(ok, "a plain transfer must not succeed");
        assertEq(address(jar).balance, 0);
    }

    function testFuzz_ForwardsAnyNonZeroAmount(uint96 amount) public {
        vm.assume(amount > 0);
        vm.deal(alice, amount);

        uint256 before = bob.balance;
        vm.prank(alice);
        jar.tip{value: amount}(bob, "fuzz");

        assertEq(bob.balance - before, amount);
        assertEq(jar.totalReceived(bob), amount);
        assertEq(address(jar).balance, 0);
    }

    function _repeat(string memory unit, uint256 times)
        internal
        pure
        returns (string memory out)
    {
        bytes memory buffer;
        for (uint256 i = 0; i < times; i++) {
            buffer = bytes.concat(buffer, bytes(unit));
        }
        out = string(buffer);
    }
}
