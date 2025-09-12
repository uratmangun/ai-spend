import { z } from "zod";
// Avoid importing types from xmcp to keep compatibility with Zod v4

// Define the schema for tool parameters
export const schema = {
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("Ethereum address to check balance for (0x-prefixed, 40 hex chars)"),
  network: z
    .enum(["base-sepolia", "base"]).optional()
    .describe("Network identifier. Defaults to base-sepolia"),
};

// Define tool metadata
export const metadata = {
  name: "check_balance",
  description: "Check ETH balance of an address on Base or Base Sepolia via Coinbase CDP RPC (eth_getBalance)",
  annotations: {
    title: "Check ETH balance via Coinbase CDP",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
} as const;

// Tool implementation
export default async function check_balance({
  address,
  network,
}: {
  address: string;
  network?: "base-sepolia" | "base";
}) {
  const targetNetwork = network || "base-sepolia";

  // Resolve RPC endpoint
  // 1) Prefer explicit per-network endpoints
  const rpcFromEnv =
    (targetNetwork === "base-sepolia"
      ? process.env.CDP_RPC_URL_BASE_SEPOLIA
      : process.env.CDP_RPC_URL_BASE) || "";

  // 2) Or construct from client API key (safe for client usage per CDP docs)
  const clientKey =
    process.env.CDP_CLIENT_API_KEY || process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY || "";

  const endpoint = rpcFromEnv
    ? rpcFromEnv
    : clientKey
      ? `https://api.developer.coinbase.com/rpc/v1/${targetNetwork}/${clientKey}`
      : "";

  if (!endpoint) {
    const setup =
      `Missing CDP RPC configuration. Set one of:\n` +
      `- CDP_RPC_URL_BASE_SEPOLIA / CDP_RPC_URL_BASE (full RPC URL with key), or\n` +
      `- CDP_CLIENT_API_KEY (we will construct https://api.developer.coinbase.com/rpc/v1/${targetNetwork}/<KEY>)`;
    return {
      content: [
        {
          type: "text",
          text: `Error: ${setup}`,
        },
      ],
    };
  }

  // Build JSON-RPC payload for eth_getBalance
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: [address, "latest"],
  } as const;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        content: [
          {
            type: "text",
            text: `CDP RPC error (${res.status}): ${body}`,
          },
        ],
      };
    }

    const data = (await res.json()) as {
      jsonrpc: string;
      id: number;
      result?: string;
      error?: { code: number; message: string };
    };

    if (data.error) {
      return {
        content: [
          {
            type: "text",
            text: `RPC error ${data.error.code}: ${data.error.message}`,
          },
        ],
      };
    }

    const hexBalance = data.result || "0x0";

    // Convert to BigInt and format to ether
    // Lazy import to avoid top-level deps if not needed
    const { formatEther } = await import("viem");
    const weiBigInt = BigInt(hexBalance);
    const ether = formatEther(weiBigInt);

    const summary = [
      `Network: ${targetNetwork}`,
      `Address: ${address}`,
      `Balance (wei): ${weiBigInt.toString()}`,
      `Balance (ETH): ${ether}`,
      `Endpoint: ${endpoint.replace(/\/[^/]+$/, "/<REDACTED>")}`,
    ].join("\n");

    return {
      content: [{ type: "text", text: summary }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
}
