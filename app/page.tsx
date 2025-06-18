"use client";

import Image from "next/image";
import logo from "@/public/images/Logo.svg";
import viewIcon from "@/public/images/view-icon.svg";
import btcIcon from "@/public/images/btc-icon.svg";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
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
import { X, Star, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { HoldingsChart } from "@/components/holdings-chart";
import btcImage from "@/public/images/btc-shape.svg";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [starredTransactions, setStarredTransactions] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const savedAddress = localStorage.getItem("selectedBtcAddress");
    if (savedAddress) {
      setSelectedAddress(savedAddress);
    }
  }, []);

  // Load starred transactions when address changes
  useEffect(() => {
    if (!selectedAddress) {
      setStarredTransactions(new Set());
      return;
    }
    const saved = localStorage.getItem(
      `starred-transactions-${selectedAddress}`
    );
    if (saved) {
      setStarredTransactions(new Set(JSON.parse(saved)));
    } else {
      setStarredTransactions(new Set());
    }
  }, [selectedAddress]);

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address);
    localStorage.setItem("selectedBtcAddress", address);
  };

  // Toggle star function to be shared between components
  const toggleStar = (txid: string) => {
    const newStarred = new Set(starredTransactions);
    if (newStarred.has(txid)) {
      newStarred.delete(txid);
    } else {
      newStarred.add(txid);
    }
    setStarredTransactions(newStarred);
    localStorage.setItem(
      `starred-transactions-${selectedAddress}`,
      JSON.stringify([...newStarred])
    );
  };

  const truncatedAddress = `${selectedAddress.slice(
    0,
    10
  )}...${selectedAddress.slice(-10)}`;

  return (
    <div className="bg-greyscale-white min-h-svh w-full">
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
        <div>{truncatedAddress || "BTC ADDRESS HERE"}</div>
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
      <div className="grid grid-cols-[420px_1fr] min-h-svh">
        <div className="flex flex-col gap-8 w-full p-4  border-r-2 border-border-color">
          <AlertAddBtcAddress onAddressSelect={handleAddressSelect} />{" "}
          <ScrollArea className="h-[720px] w-full">
            <StarredTransactions
              address={selectedAddress}
              starredTransactions={starredTransactions}
              toggleStar={toggleStar}
            />
          </ScrollArea>
        </div>
        <div className="w-full">
          <div className="h-full w-full flex flex-col gap-4 mt-4">
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
                    <TransactionHistory
                      address={selectedAddress}
                      starredTransactions={starredTransactions}
                      toggleStar={toggleStar}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

  const { data: priceData } = useQuery<{ USD: number }>({
    queryKey: ["btc-price-mempool"],
    queryFn: async () => {
      const response = await fetch("https://mempool.space/api/v1/prices");
      if (!response.ok) {
        throw new Error("Failed to fetch BTC price");
      }
      return await response.json();
    },
    refetchInterval: 60000, // Refetch every minute
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

  const btcBalance = Math.max(0, addressBalance / 100000000);
  const usdValue = priceData ? btcBalance * priceData.USD : 0;

  return (
    <div className="text-right">
      <div className="font-mono text-2xl font-medium text-black leading-[114%] tracking-[5%] flex flex-row gap-2 items-center justify-end">
        <Image src={btcImage} alt="btc shape" />
        <div className="flex flex-row items-center gap-4">
          <div>{btcBalance.toFixed(8)} BTC</div>
          {priceData && (
            <div className="text-light-teal-1 font-mono leading-[28.8px] text-2xl font-normal">
              $
              {usdValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USD
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionHistory({
  address,
  starredTransactions,
  toggleStar,
}: {
  address: string;
  starredTransactions: Set<string>;
  toggleStar: (txid: string) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const itemsPerPage = 5;

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "newest" ? "oldest" : "newest");
  };

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

  const formattedTransactions: FormattedTransaction[] = data
    ? data
        .map((tx) => {
          let amount = 0;
          let type: "received" | "sent" = "sent";

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
            runningBalance: 0,
          };
        })

        .sort((a, b) => {
          const timeA = a.status.block_time || 0;
          const timeB = b.status.block_time || 0;
          return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
        })

        .map((tx, index, sortedTxs) => {
          const runningBalance = sortedTxs
            .slice(0, index + 1)
            .reduce((balance, prevTx) => balance + prevTx.netAmount, 0);

          return {
            ...tx,
            runningBalance,
          };
        })
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
            <th></th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              TYPE
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              TX ID
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              <button
                onClick={toggleSortOrder}
                className="flex items-center gap-1 hover:text-dark-teal-1 transition-colors"
              >
                DATE
                <div>
                  {sortOrder === "newest" ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronUp size={16} />
                  )}
                </div>
              </button>
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
              <td className="py-3 px-2">
                <button
                  onClick={() => toggleStar(tx.txid)}
                  className="hover:scale-110 transition-transform"
                  title={
                    starredTransactions.has(tx.txid)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <Star
                    size={16}
                    className={`${
                      starredTransactions.has(tx.txid)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-400 hover:text-yellow-400"
                    }`}
                  />
                </button>
              </td>
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
                {Math.max(0, tx.runningBalance / 100000000).toFixed(8)}
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

function StarredTransactions({
  address,
  starredTransactions,
  toggleStar,
}: {
  address: string;
  starredTransactions: Set<string>;
  toggleStar: (txid: string) => void;
}) {
  const { data: transactions } = useQuery<Transaction[]>({
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

  // Filter starred transactions
  const starredTxs =
    transactions?.filter((tx) => starredTransactions.has(tx.txid)) || [];

  if (!address) {
    return (
      <div className="mt-6">
        <h3 className="font-mono text-lg font-medium text-dark-teal-2 mb-4">
          STARRED TRANSACTIONS
        </h3>
        <p className="text-dark-teal-2 font-mono text-sm">
          Select an address to view starred transactions
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="font-mono text-lg font-medium text-dark-teal-2 mb-4">
        STARRED TRANSACTIONS
      </h3>
      {starredTxs.length === 0 ? (
        <p className="text-dark-teal-2 font-mono text-sm">
          No starred transactions yet
        </p>
      ) : (
        <div className="space-y-3">
          {starredTxs.map((tx) => {
            // Calculate transaction amount
            let amount = 0;
            let type: "received" | "sent" = "sent";

            // Check outputs first
            tx.vout.forEach((output) => {
              if (output.scriptpubkey_address === address) {
                amount += output.value;
              }
            });

            // Check inputs
            tx.vin.forEach((input) => {
              if (
                input.prevout &&
                input.prevout.scriptpubkey_address === address
              ) {
                amount -= input.prevout.value;
              }
            });

            // Determine type based on net amount
            if (amount > 0) {
              type = "received";
            } else {
              type = "sent";
              amount = Math.abs(amount);
            }

            return (
              <div
                key={tx.txid}
                className="bg-greyscale-0 border border-greyscale-6 rounded p-3 hover:bg-greyscale-1"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      type === "received"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {type === "received" ? "RECEIVE" : "SEND"}
                  </span>
                  <button
                    onClick={() => toggleStar(tx.txid)}
                    className="hover:scale-110 transition-transform"
                    title="Remove from favorites"
                  >
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                  </button>
                </div>
                <div className="font-mono text-xs text-dark-teal-2 mb-1">
                  {tx.txid.substring(0, 16)}...
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`font-mono text-sm ${
                      type === "received" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {type === "received" ? "+" : "-"}
                    {(amount / 100000000).toFixed(8)} BTC
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {tx.status.block_time
                      ? new Date(
                          tx.status.block_time * 1000
                        ).toLocaleDateString()
                      : "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
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
  const [validationError, setValidationError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const validateAddress = async (address: string) => {
    const addr = address.trim();
    if (!addr) {
      setValidationError("");
      return false;
    }

    setIsValidating(true);
    setValidationError("");

    try {
      const response = await fetch(
        `https://mempool.space/api/v1/validate-address/${addr}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.isvalid) {
          setValidationError("");
          return true;
        } else {
          setValidationError("Invalid Bitcoin address format");
          return false;
        }
      } else {
        setValidationError("Invalid Bitcoin address format");
        return false;
      }
    } catch (error) {
      console.error(error);
      setValidationError(
        "Unable to validate address. Please check your connection."
      );
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddAddress = async () => {
    const address = inputAddress.trim();
    if (address) {
      const isValid = await validateAddress(address);

      console.log(isValid);
      if (isValid) {
        onAddressSelect(address);
        setIsOpen(false);
        setInputAddress("");
        setValidationError("");
      }
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
                    className={validationError ? "border-red-500" : ""}
                  />
                  {validationError && (
                    <p className="text-red-500 font-mono text-sm font-normal leading-[16.8px] tracking-[-0.07px]">
                      {validationError}
                    </p>
                  )}
                  <p className="text-[#00474B] font-mono text-base font-normal leading-[19.2px] tracking-[-0.08px]">
                    46 characters maximum
                  </p>
                </div>
              </div>
              <div>
                {!inputAddress ? (
                  <div className="pb-4">
                    <Button
                      onClick={handleAddAddress}
                      disabled
                      className="bg-light-teal-1 h-12 w-46 border-1"
                    >
                      Next
                    </Button>
                  </div>
                ) : (
                  <div className="pb-4">
                    <Button
                      onClick={handleAddAddress}
                      disabled={isValidating}
                      className="bg-light-teal-1 h-12 w-46  border-1"
                    >
                      {isValidating ? "Validating..." : "Next"}
                    </Button>
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
