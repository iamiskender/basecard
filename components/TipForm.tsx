"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { encodeFunctionData, parseEther, concat } from "viem";
import { tipJarAbi, TIP_JAR_ADDRESS } from "@/lib/contract";
import { getDataSuffix } from "@/lib/builderCode";
import { activeChain } from "@/lib/wagmi";

// The contract caps the message at 140 BYTES. Counting characters here would
// let a Turkish or emoji message through the UI and revert onchain.
const MAX_MESSAGE_BYTES = 140;

export function TipForm({
  recipient,
  recipientLabel,
}: {
  recipient: `0x${string}`;
  recipientLabel: string;
}) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [amount, setAmount] = useState("0.001");
  const [message, setMessage] = useState("");

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const wrongChain = isConnected && chainId !== activeChain.id;
  const messageBytes = new TextEncoder().encode(message).length;
  const messageTooLong = messageBytes > MAX_MESSAGE_BYTES;
  const amountValid = Number(amount) > 0;

  function handleTip(e: React.FormEvent) {
    e.preventDefault();
    if (!TIP_JAR_ADDRESS || wrongChain || messageTooLong || !amountValid) return;

    const callData = encodeFunctionData({
      abi: tipJarAbi,
      functionName: "tip",
      args: [recipient, message],
    });

    const suffix = getDataSuffix();
    const data = suffix ? concat([callData, suffix]) : callData;

    sendTransaction({
      to: TIP_JAR_ADDRESS,
      data,
      value: parseEther(amount || "0"),
    });
  }

  if (!TIP_JAR_ADDRESS) {
    return (
      <div className="card">
        <p className="status-text">
          No TipJar address is configured. Set{" "}
          <code>NEXT_PUBLIC_TIP_JAR_ADDRESS</code> and reload.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="card">
        <span className="field-label">Connect a wallet</span>
        <div className="btn-grid">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isConnecting}
              className="btn btn-secondary"
            >
              {connector.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (wrongChain) {
    return (
      <div className="card">
        <p className="status-text" style={{ marginTop: 0 }}>
          Wrong network. Basecard runs on {activeChain.name}.
        </p>
        <button
          onClick={() => switchChain({ chainId: activeChain.id })}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 16 }}
        >
          Switch to {activeChain.name}
        </button>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="card">
        <p className="status-success" style={{ margin: "0 0 12px" }}>
          Tip sent to {recipientLabel}.
        </p>
        <a
          href={`${activeChain.blockExplorers?.default.url}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View on explorer
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleTip} className="card">
      <div className="connected-row">
        <span>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button type="button" onClick={() => disconnect()} className="btn-link">
          disconnect
        </button>
      </div>

      <label className="field-label" htmlFor="amount">
        Amount (ETH)
      </label>
      <input
        id="amount"
        type="number"
        step="0.0001"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="text-input"
        style={{ width: "100%", marginBottom: 20 }}
      />

      <label className="field-label" htmlFor="message">
        Message (optional)
      </label>
      <input
        id="message"
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="great work on this!"
        className="text-input"
        style={{ width: "100%" }}
      />
      <div
        className="status-text"
        style={{
          fontSize: 12,
          marginTop: 6,
          marginBottom: 20,
          color: messageTooLong ? "var(--danger)" : "var(--text-muted)",
        }}
      >
        {messageBytes} / {MAX_MESSAGE_BYTES} bytes
        {messageTooLong && " — too long for the contract"}
      </div>

      <button
        type="submit"
        disabled={isSending || isConfirming || messageTooLong || !amountValid}
        className="btn btn-primary"
        style={{ width: "100%" }}
      >
        {isSending || isConfirming
          ? "Sending..."
          : `Tip ${recipientLabel}`}
      </button>

      {sendError && (
        <p className="status-error" style={{ marginBottom: 0 }}>
          {sendError.message.split("\n")[0]}
        </p>
      )}
    </form>
  );
}
