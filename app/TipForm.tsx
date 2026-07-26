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

  function handleTip(e: React.FormEvent) {
    e.preventDefault();
    if (!TIP_JAR_ADDRESS) {
      alert(
        "TipJar contract address is not configured (NEXT_PUBLIC_TIP_JAR_ADDRESS)."
      );
      return;
    }
    if (wrongChain) return;

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

  if (!isConnected) {
    return (
      <div className="card">
        <span className="field-label">Connect a wallet to send a tip</span>
        <div className="btn-grid">
          {connectors.slice(0, 6).map((connector) => (
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
        >
          Switch to {activeChain.name}
        </button>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="card">
        <p className="status-success" style={{ marginTop: 0 }}>
          Tip sent to {recipientLabel}.
        </p>
        <a
          href={`${activeChain.blockExplorers?.default.url}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View on explorer →
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
        <button
          type="button"
          onClick={() => disconnect()}
          className="btn-link"
        >
          disconnect
        </button>
      </div>

      <label style={{ display: "block", marginBottom: 16 }}>
        <span className="field-label">Amount (ETH)</span>
        <input
          type="number"
          step="0.0001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-input"
          style={{ width: "100%" }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 20 }}>
        <span className="field-label">Message (optional)</span>
        <input
          type="text"
          maxLength={140}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="great work on this!"
          className="text-input"
          style={{ width: "100%" }}
        />
      </label>

      <button
        type="submit"
        disabled={isSending || isConfirming}
        className="btn btn-primary"
        style={{ width: "100%" }}
      >
        {isSending || isConfirming ? "Sending..." : `Tip ${recipientLabel}`}
      </button>

      {sendError && (
        <p className="status-error">{sendError.message.split("\n")[0]}</p>
      )}
    </form>
  );
}
