"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

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

interface HoldingsData {
  timestamp: number;
  btc_balance: number;
  usd_balance: number;
}

interface HoldingsChartProps {
  address: string;
}

export function HoldingsChart({ address }: HoldingsChartProps) {
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

  const { data: btcPrice } = useQuery<{ bitcoin: { usd: number } }>({
    queryKey: ["btc-price"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch BTC price");
      }
      return await response.json();
    },
  });

  const chartData: HoldingsData[] =
    transactions && btcPrice
      ? transactions
          .filter((tx) => tx.status.block_time)
          .sort(
            (a, b) => (a.status.block_time || 0) - (b.status.block_time || 0)
          )
          .map((tx, index, sortedTxs) => {
            let runningBalance = 0;

            for (let i = 0; i <= index; i++) {
              const currentTx = sortedTxs[i];
              let txBalance = 0;

              currentTx.vout.forEach((output) => {
                if (output.scriptpubkey_address === address) {
                  txBalance += output.value;
                }
              });

              currentTx.vin.forEach((input) => {
                if (
                  input.prevout &&
                  input.prevout.scriptpubkey_address === address
                ) {
                  txBalance -= input.prevout.value;
                }
              });

              runningBalance += txBalance;
            }

            const btcBalance = runningBalance / 100000000;
            const usdBalance = btcBalance * btcPrice.bitcoin.usd;

            return {
              timestamp: tx.status.block_time || 0,
              btc_balance: btcBalance,
              usd_balance: usdBalance,
            };
          })
      : [];

  if (!address) {
    return (
      <div className="relative h-full w-full bg-greyscale-white p-6 flex items-center justify-center">
        <p className="text-dark-teal-2 font-mono">
          Select a Bitcoin address to view holdings chart
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-greyscale-white p-6">
      <ResponsiveContainer
        width="100%"
        height="100%"
        className="bg-greyscale-white dark:bg-dark-teal-1"
      >
        <AreaChart
          data={chartData}
          margin={{ top: 50, right: 30, left: 30, bottom: 50 }}
        >
          <XAxis
            dataKey="timestamp"
            textAnchor="end"
            scale="auto"
            tickFormatter={(value) => {
              const date = new Date((value as number) * 1_000);
              const formattedDate = date.toLocaleString("en-US", {
                day: "numeric",
                month: "short",
              });
              return formattedDate;
            }}
            interval="equidistantPreserveStart"
            stroke="#002C2F"
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            type="number"
            allowDataOverflow={true}
            stroke="#46ADB4"
            height={100}
            tickLine={false}
            axisLine={false}
            interval={1}
            tickFormatter={(value) => {
              if (!value) return `$0`;
              if (typeof value === "number") return `$${value.toFixed(0)}`;
              return `$0`;
            }}
            tickMargin={20}
          />
          <Tooltip content={<CustomToolTop />} cursor={false} />
          <CartesianGrid stroke="#0E656B" strokeWidth={1} vertical={false} />
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="1%" stopColor="#46ADB4" stopOpacity={0.7} />
              <stop offset="50%" stopColor="#46ADB4" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#46ADB4" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <Area
            fillOpacity={1}
            fill="url(#colorUv)"
            type="monotone"
            dataKey="usd_balance"
            stroke="#0E656B"
            activeDot={{
              stroke: "#E2B000",
              strokeWidth: 1,
              fill: "#FFFCDE",
              r: 8,
              strokeDasharray: "",
            }}
            dot={{
              stroke: "#E2B000",
              strokeWidth: 1,
              fill: "#E2B000",
              r: 8,
              strokeDasharray: "",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomToolTop({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as HoldingsData;

    return (
      <div className="flex h-full w-fit flex-col items-start justify-center gap-4 border border-[#E2B000] bg-[#FFFCDE] p-3 rounded shadow-lg">
        <p className="uppercase text-[#002C2F] font-mono text-sm">
          {new Date((label as number) * 1_000)
            .toLocaleString("default", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })
            .split(",")
            .join(" ")}
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-[#002C2F] font-mono text-xs uppercase">Balance</p>
          <p className="text-[#002C2F] font-mono font-medium">
            {data.btc_balance.toFixed(8)} BTC
          </p>
          <p className="text-sm text-[#002C2F] font-mono">
            {data.usd_balance.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USD
          </p>
        </div>
      </div>
    );
  }

  return null;
}
