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
      alert("TipJar contract address is not configured (NEXT_PUBLIC_TIP_JAR_ADDRESS).");
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
      <div style={{ marginTop: 24 }}>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isConnecting}
            style={{ marginRight: 8, padding: "10px 16px", borderRadius: 8 }}
          >
            Connect {connector.name}
          </button>
        ))}
      </div>
    );
  }

  if (wrongChain) {
    return (
      <div style={{ marginTop: 24 }}>
        <p>Wrong network. Basecard runs on {activeChain.name}.</p>
        <button
          onClick={() => switchChain({ chainId: activeChain.id })}
          style={{ padding: "10px 16px", borderRadius: 8 }}
        >
          Switch to {activeChain.name}
        </button>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div style={{ marginTop: 24 }}>
        <p>Tip sent to {recipientLabel}.</p>
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
    <form onSubmit={handleTip} style={{ marginTop: 24 }}>
      <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>
        Connected as {address?.slice(0, 6)}...{address?.slice(-4)}{" "}
        <button
          type="button"
          onClick={() => disconnect()}
          style={{ marginLeft: 8, background: "none", border: "none", color: "#4f7cff" }}
        >
          disconnect
        </button>
      </div>

      <label style={{ display: "block", marginBottom: 8 }}>
        Amount (ETH)
        <input
          type="number"
          step="0.0001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ display: "block", width: "100%", padding: 10, marginTop: 4, borderRadius: 8, border: "1px solid #333" }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        Message (optional)
        <input
          type="text"
          maxLength={140}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="great work on this!"
          style={{ display: "block", width: "100%", padding: 10, marginTop: 4, borderRadius: 8, border: "1px solid #333" }}
        />
      </label>

      <button
        type="submit"
        disabled={isSending || isConfirming}
        style={{ padding: "12px 20px", borderRadius: 8, width: "100%" }}
      >
        {isSending || isConfirming ? "Sending..." : `Tip ${recipientLabel}`}
      </button>

      {sendError && (
        <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>
          {sendError.message.split("\n")[0]}
        </p>
      )}
    </form>
  );
}
