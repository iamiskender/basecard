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
      <div style={{ marginTop:
