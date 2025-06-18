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
import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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
      <div className="bg-greyscale-white h-20 text-dark-teal-2 font-mono font-medium leading-[36.8px] text-[32px] flex items-center pl-4">
        {selectedAddress || "BTC ADDRESS HERE"}
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
        <div className="border-r-2 border-greyscale-6 max-w-[420px] w-full p-4">
          <AlertAddBtcAddress onAddressSelect={setSelectedAddress} />
        </div>
        <div className="w-3/4 mt-4">
          <div className="h-full w-full flex flex-col ">
            <div className="h-[50px] bg-greyscale-2 rounded-t border border-border-color mx-4">
              <div className="font-mono text-xl font-medium leading-6 p-3 ml-2">
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

  const totalPages = data ? Math.ceil(data.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = data ? data.slice(startIndex, endIndex) : [];

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
              TX ID
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              DATE
            </th>
            <th className="text-left py-3 px-2 font-mono text-sm font-medium text-dark-teal-2">
              AMOUNT (SATS)
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
              <td className="py-3 px-2 font-mono text-sm text-light-teal-1 font-normal">
                {tx.fee.toLocaleString()}
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

export function AlertAddBtcAddress({
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

// function HoldingsGraph({ address }: { address: string }) {
//   return (
//     <div className="relative h-full w-full bg-grayscale-white p-6 ">
//       <ResponsiveContainer
//         width="100%"
//         height="100%"
//         className="bg-grayscale-white dark:bg-dark-teal-1"
//       >
//         <AreaChart margin={{ top: 50, right: 30, left: 30, bottom: 50 }}>
//           <XAxis
//             dataKey="timestamp"
//             textAnchor="end"
//             scale={"auto"}
//             tickFormatter={(value) => {
//               const date = new Date((value as number) * 1_000);
//               const formattedDate = date.toLocaleString("en-US", {
//                 day: "numeric",
//                 month: "short",
//               });
//               return formattedDate;
//             }}
//             interval={0}
//             stroke="#002C2F"
//             tickLine={false}
//             tickMargin={10}
//           />
//           <YAxis
//             type="number"
//             allowDataOverflow={true}
//             stroke="#46ADB4"
//             height={100}
//             tickLine={false}
//             axisLine={false}
//             interval={1}
//             tickFormatter={(value) => {
//               if (!value) return `$0`;
//               if (typeof value === "number") return `$${value.toFixed(0)}`;
//               return `$0`;
//             }}
//             tickMargin={20}
//           />
//           <Tooltip cursor={false} />
//           <CartesianGrid stroke="#0E656B" strokeWidth={1} vertical={false} />
//           <defs>
//             <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="1%" stopColor="#46ADB4" stopOpacity={0.7} />
//               <stop offset="50%" stopColor="#46ADB4" stopOpacity={0.25} />
//               <stop offset="100%" stopColor="#46ADB4" stopOpacity={0.1} />
//             </linearGradient>
//           </defs>

//           <Area
//             fillOpacity={1}
//             fill="url(#colorUv)"
//             type="monotone"
//             dataKey="usd_balance"
//             stroke="#0E656B"
//             activeDot={{
//               stroke: "#E2B000",
//               strokeWidth: 1,
//               fill: "#FFFCDE",
//               r: 8,
//               strokeDasharray: "",
//             }}
//             dot={{
//               stroke: "#E2B000",
//               strokeWidth: 1,
//               fill: "#E2B000",
//               r: 8,
//               strokeDasharray: "",
//             }}
//           />
//         </AreaChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }
