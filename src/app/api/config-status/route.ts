import { NextResponse } from "next/server";
import { ESCROW_CONTRACT_ADDRESS, ONEINCH_API_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isConfigured(value: string | undefined | null): boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  const lower = v.toLowerCase();
  if (lower.includes("your_") || lower.includes("placeholder")) return false;
  return true;
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Reports which integrations are configured without leaking any secret values.
 */
export async function GET() {
  const walletConnect = isConfigured(
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  );
  const oneInch = isConfigured(ONEINCH_API_KEY);
  const alpaca =
    isConfigured(process.env.ALPACA_API_KEY) &&
    isConfigured(process.env.ALPACA_SECRET_KEY);
  const escrowConfigured = isConfigured(ESCROW_CONTRACT_ADDRESS);
  const escrowDeployed =
    escrowConfigured && ADDRESS_RE.test(ESCROW_CONTRACT_ADDRESS.trim());

  return NextResponse.json({
    walletConnect,
    oneInch,
    alpaca,
    escrowConfigured,
    escrowDeployed,
    arbitrumRpc: isConfigured(
      process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
    ),
  });
}
