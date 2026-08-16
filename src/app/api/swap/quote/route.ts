import { NextResponse } from "next/server";
import { ARBITRUM_CHAIN_ID, ONEINCH_API_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ONEINCH_QUOTE_BASE = `https://api.1inch.dev/swap/v6.0/${ARBITRUM_CHAIN_ID}/quote`;

/**
 * Proxy for the 1inch Aggregation API v6.0 quote endpoint (Arbitrum One).
 * Keeps the API key server-side and sidesteps browser CORS restrictions.
 *
 * GET /api/swap/quote?src=0x..&dst=0x..&amount=1000000000000000000
 * `amount` is expressed in the source token's smallest unit (wei/base units).
 */
export async function GET(request: Request) {
  if (!ONEINCH_API_KEY) {
    return NextResponse.json(
      { error: "1inch API key not configured. Set NEXT_PUBLIC_1INCH_API_KEY." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src");
  const dst = searchParams.get("dst");
  const amount = searchParams.get("amount");

  if (!src || !dst || !amount) {
    return NextResponse.json(
      { error: "Missing required query params: src, dst, amount." },
      { status: 400 },
    );
  }

  if (src.toLowerCase() === dst.toLowerCase()) {
    return NextResponse.json(
      { error: "Source and destination tokens must differ." },
      { status: 400 },
    );
  }

  const url = new URL(ONEINCH_QUOTE_BASE);
  url.searchParams.set("src", src);
  url.searchParams.set("dst", dst);
  url.searchParams.set("amount", amount);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${ONEINCH_API_KEY}` },
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body.description ?? body.error ?? "";
      } catch {
        detail = await res.text();
      }
      return NextResponse.json(
        { error: `1inch quote failed (${res.status})${detail ? `: ${detail}` : ""}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the 1inch API. Please try again later." },
      { status: 502 },
    );
  }
}
