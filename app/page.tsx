"use client";

import Image from "next/image";
import logo from "@/public/images/Logo.svg";
import viewIcon from "@/public/images/view-icon.svg";
import btcIcon from "@/public/images/btc-icon.svg";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import radarImg from "@/public/images/radar-1.png";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { HoldingsChart } from "@/components/holdings-chart";
import btcImage from "@/public/images/btc-shape.svg";

interface Transaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address: string;
      value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface FormattedTransaction extends Transaction {
  amount: number;
  type: "received" | "sent";
  netAmount: number;
  runningBalance: number;
}

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
function Dashboard() {
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  useEffect(() => {
    const savedAddress = localStorage.getItem("selectedBtcAddress");
    if (savedAddress) {
      setSelectedAddress(savedAddress);
    }
  }, []);

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address);
    localStorage.setItem("selectedBtcAddress", address);
  };

  return (
    <section className="bg-greyscale-white min-h-svh w-full">
      <nav className="bg-[#F0F1F1] flex flex-row items-center justify-between px-6 h-20">
        <div className="grid grid-cols-2 items-center h-full">
          <Image src={logo} alt="logo" />
          <p className="text-dark-teal-2 font-mono font-medium leading-6 text-xl">
            DASHBOARD
          </p>
        </div>
        <Image src={viewIcon} alt="view eye" />
      </nav>
      <div className="bg-greyscale-white h-18 text-dark-teal-2 font-mono font-medium leading-[114%] tracking-[5%] text-2xl flex items-center justify-between px-4">
        <div>{selectedAddress || "BTC ADDRESS HERE"}</div>
        {selectedAddress && <AddressBalance address={selectedAddress} />}
      </div>
      <div className="flex flex-row w-full">
        <div className="bg-[#F0F1F1] py-4 border-t-2 border-border-color border-r-2 border-b-2 max-w-[420px] w-full">
          <p className="text-dark-teal-2 font-mono text-xl font-medium leading-6 px-4">
            QUICK ACTIONS
          </p>
        </div>
        <div className="bg-[#F0F1F1] py-4 border-t-2 border-border-color w-full border-b-2"></div>
      </div>
      <div className="flex flex-row w-full min-h-svh">
        <div className="border-r-2 border-greyscale-6 max-w-[420px] w-full p-4 min-h-svh">
          <AlertAddBtcAddress onAddressSelect={handleAddressSelect} />
        </div>
        <div className="w-3/4 mt-4">
          <div className="h-full w-full flex flex-col gap-4">
            <div className="h-[400px] bg-greyscale-2 rounded-t border border-border-color mx-4">
              <div className="font-mono text-xl font-medium leading-6 py-3 ml-2">
                HOLDINGS
              </div>
              <div className="bg-greyscale-white border border-border-color rounded-b h-[350px]">
                <HoldingsChart address={selectedAddress} />
              </div>
            </div>
            <div className="h-[50px] bg-greyscale-2 rounded-t border border-border-color mx-4">
              <div className="font-mono text-xl font-medium leading-6 py-3 ml-2">
                TRANSACTIONS
              </div>
              <div className="bg-greyscale-white border border-border-color rounded-b flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  {selectedAddress && (
                    <TransactionHistory address={selectedAddress} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AddressBalance({ address }: { address: string }) {
  const { data } = useQuery<Transaction[]>({
    queryKey: ["transactions", address],
    queryFn: async () => {
      const response = await fetch(
        `https://mempool.space/api/address/${address}/txs`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return await response.json();
    },
    enabled: !!address,
  });

  const addressBalance = data
    ? data.reduce((balance, tx) => {
        let txBalance = 0;

        // Add outputs sent to this address
        tx.vout.forEach((output) => {
          if (output.scriptpubkey_address === address) {
            txBalance += output.value;
          }
        });

        // Subtract inputs spent from this address
        tx.vin.forEach((input) => {
          if (input.prevout && input.prevout.scriptpubkey_address === address) {
            txBalance -= input.prevout.value;
          }
        });

        return balance + txBalance;
      }, 0)
    : 0;

  return (
    <div className="text-right">
      <div className="font-mono text-2xl font-medium text-black leading-[114%] tracking-[5%] flex flex-row gap-2 items-center">
        <Image src={btcImage} alt="btc shape" />
        {(addressBalance / 100000000).toFixed(8)} BTC
      </div>
    </div>
  );
}

function TransactionHistory({ address }: { address: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { isPending, error, data } = useQuery<Transaction[]>({
    queryKey: ["transactions", address],
    queryFn: async () => {
      const response = await fetch(
        `https://mempool.space/api/address/${address}/txs`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return await response.json();
    },
    enabled: !!address,
  });

  // Format transactions with calculated amounts for display
  const formattedTransactions: FormattedTransaction[] = data
    ? data
        .map((tx) => {
          let amount = 0;
          let type: "received" | "sent" = "sent";

          // Calculate net amount for this transaction
          tx.vout.forEach((output) => {
            if (output.scriptpubkey_address === address) {
              amount += output.value;
              type = "received";
            }
          });

          tx.vin.forEach((input) => {
            if (
              input.prevout &&
              input.prevout.scriptpubkey_address === address
            ) {
              amount -= input.prevout.value;
              type = "sent";
            }
          });

          return {
            ...tx,
            amount: Math.abs(amount),
            type,
            netAmount: amount,
            runningBalance: 0, // Will be calculated after sorting
          };
        })
        // Sort by date (oldest first for running balance calculation)
        .sort((a, b) => {
          const timeA = a.status.block_time || 0;
          const timeB = b.status.block_time || 0;
          return timeA - timeB;
        })
        // Calculate running balance
        .map((tx, index, sortedTxs) => {
          const runningBalance = sortedTxs
            .slice(0, index + 1)
            .reduce((balance, prevTx) => balance + prevTx.netAmount, 0);

          return {
            ...tx,
            runningBalance,
          };
        })
        // Sort by date (newest first for display)
        .reverse()
    : [];

  const totalPages = formattedTransactions
    ? Math.ceil(formattedTransactions.length / itemsPerPage)
    : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = formattedTransactions
    ? formattedTransactions.slice(startIndex, endIndex)
    : [];

  if (isPending)
    return (
      <div className="p-4 text-center text-dark-teal-2 font-mono">
        Loading transactions...
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-center text-red-500 font-mono">
        Error: {error.message}
      </div>
    );

  if (!data || data.length === 0)
    return (
      <div className="p-4 text-center text-dark-teal-2 font-mono">
        No transactions found
      </div>
    );

  return (
    <div className="">
      <table className="w-full">
        <thead>
          <tr className="h-[50px] bg-greyscale-2 w-full rounded border border-border-color mx-4">
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              TYPE
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              TX ID
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              DATE
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              AMOUNT (BTC)
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              BALANCE (BTC)
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              STATUS
            </th>
          </tr>
        </thead>
        <tbody>
          {currentTransactions.map((tx) => (
            <tr
              key={tx.txid}
              className="border-b border-greyscale-6 hover:bg-greyscale-0"
            >
              <td className="py-3 px-2 font-mono text-sm font-medium">
                <span className="px-2 py-1 rounded text-sm text-light-teal-1">
                  {tx.type === "received" ? "RECEIVE" : "SEND"}
                </span>
              </td>
              <td className="py-3 px-2 font-mono text-sm text-light-teal-1 font-normal">
                <div className="truncate max-w-[150px]" title={tx.txid}>
                  {tx.txid}
                </div>
              </td>

              <td className="py-3 px-2 font-mono text-sm text-light-teal-1 font-normal">
                {tx.status.block_time
                  ? new Date(tx.status.block_time * 1000).toLocaleDateString()
                  : "-"}
              </td>

              <td className="py-3 px-2 font-mono text-sm font-normal">
                <div
                  className={`${
                    tx.type === "received" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "received" ? "+" : "-"}
                  {(tx.amount / 100000000).toFixed(8)}
                </div>
              </td>
              <td className="py-3 px-2 font-mono text-sm text-dark-teal-2 font-medium">
                {(tx.runningBalance / 100000000).toFixed(8)}
              </td>
              <td className="py-3 px-2">
                <span
                  className={`font-mono text-sm px-2 py-1 rounded ${
                    tx.status.confirmed
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {tx.status.confirmed ? "COMPLETED" : "PENDING"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

function AlertAddBtcAddress({
  onAddressSelect,
}: {
  onAddressSelect: (address: string) => void;
}) {
  const [inputAddress, setInputAddress] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddAddress = () => {
    if (inputAddress.trim()) {
      onAddressSelect(inputAddress.trim());
      setIsOpen(false);
      setInputAddress("");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild className="flex justify-start items-center">
        <Button
          className="h-[60px] text-uppercase text-dark-teal-5 font-mono font-normal text-xl leading-6"
          variant="outline"
        >
          <Image src={btcIcon} alt="btc icon" height={20} />
          ADD BTC ADDRESS
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogCancel className="flex flex-row justify-end">
            <X />
          </AlertDialogCancel>
          <AlertDialogTitle className="bg-[#F0F1F1] border border-t-greyscale-6 h-12 py-4 px-8 w-full  flex items-center text-dark-teal-2">
            ADD BTC ADDRESS
          </AlertDialogTitle>

          <div className="grid grid-cols-2 h-full">
            <div className="flex flex-col justify-between py-4 px-8  border-2 border-t-greyscale-6 border-b-greyscale-6 border-l-greyscale-6">
              <div className="flex flex-col gap-8">
                <AlertDialogDescription className="text-dark-teal-2 font-medium text-xl leading-6 tracking-[-0.5%] ">
                  Enter the address below to add to your vault
                </AlertDialogDescription>
                <div className="flex flex-col gap-2 ">
                  <p className="text-lg font-mono font-medium leading-[21.6px] tracking-[-0.09px] text-[#001E20]">
                    ADDRESS
                  </p>
                  <Input
                    placeholder="Enter address here"
                    value={inputAddress}
                    onChange={(e) => setInputAddress(e.target.value)}
                    maxLength={46}
                  />
                  <p className="text-[#00474B] font-mono text-base font-normal leading-[19.2px] tracking-[-0.08px]">
                    46 characters maximum
                  </p>
                </div>
              </div>
              <div>
                {!inputAddress ? (
                  <div className="pb-4">
                    <AlertDialogAction
                      onClick={handleAddAddress}
                      disabled
                      className="bg-light-teal-1 h-12 w-46 border-1"
                    >
                      Next
                    </AlertDialogAction>
                  </div>
                ) : (
                  <div className="pb-4">
                    <AlertDialogAction
                      onClick={handleAddAddress}
                      className="bg-light-teal-1 h-12 w-46  border-1"
                    >
                      Next
                    </AlertDialogAction>
                  </div>
                )}
              </div>
            </div>

            <Image src={radarImg} alt="radar img" className="" />
          </div>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
