// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TipJar
/// @notice Forwards an ETH tip to a recipient and records the totals onchain.
/// @dev The contract is a pass-through. It never holds a balance: every tip is
///      forwarded within the same call, and there is no receive or fallback, so
///      a plain transfer to this address reverts instead of stranding funds.
///
///      Callers may append extra bytes after the ABI-encoded calldata. Basecard
///      does exactly this to attach an ERC-8021 Builder Code suffix. Solidity's
///      decoder ignores trailing calldata beyond what the parameters describe,
///      so `tip` behaves identically with and without a suffix. That behaviour
///      is load-bearing here rather than incidental, and it is covered by a test.
contract TipJar {
    /// @notice Total wei forwarded to each recipient.
    mapping(address => uint256) public totalReceived;

    /// @notice Number of tips forwarded to each recipient.
    mapping(address => uint256) public tipCount;

    /// @notice Longest message accepted, in bytes. The UI caps input at 140
    ///         characters; this is the same limit enforced onchain, counted in
    ///         bytes rather than characters.
    uint256 public constant MAX_MESSAGE_BYTES = 140;

    event Tip(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp,
        string message
    );

    error ZeroRecipient();
    error ZeroAmount();
    error MessageTooLong(uint256 length, uint256 maxLength);
    error TransferFailed();

    /// @notice Send ETH to `recipient` with an optional public message.
    /// @param recipient Address that receives the full `msg.value`.
    /// @param message Optional note, stored in the event rather than in storage.
    function tip(address recipient, string calldata message) external payable {
        if (recipient == address(0)) revert ZeroRecipient();
        if (msg.value == 0) revert ZeroAmount();

        uint256 length = bytes(message).length;
        if (length > MAX_MESSAGE_BYTES) {
            revert MessageTooLong(length, MAX_MESSAGE_BYTES);
        }

        // Effects before interaction. A recipient that re-enters lands in a
        // fresh tip with its own msg.value, and the counters above are already
        // settled, so there is nothing for it to observe mid-update.
        totalReceived[recipient] += msg.value;
        tipCount[recipient] += 1;

        emit Tip(msg.sender, recipient, msg.value, block.timestamp, message);

        // call rather than transfer: the 2300 gas stipend is not enough for a
        // smart contract wallet, and most Base builders use one.
        (bool ok, ) = recipient.call{value: msg.value}("");
        if (!ok) revert TransferFailed();
    }
}
