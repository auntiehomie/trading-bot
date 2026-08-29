/**
 * Alerting infrastructure — Discord + Telegram notifications for trading events.
 * Adapted from Liquidation Bot patterns (src/telegramBot.ts + src/alerts.ts).
 */

export type AlertLevel = "info" | "warning" | "error" | "success";

export interface AlertPayload {
  level: AlertLevel;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: number;
}

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

const LEVEL_EMOJI: Record<AlertLevel, string> = {
  info: "ℹ️",
  warning: "⚠️",
  error: "🚨",
  success: "✅",
};

const LEVEL_COLOR: Record<AlertLevel, number> = {
  info: 0x5865f2,      // blurple
  warning: 0xfee75c,   // yellow
  error: 0xed4245,     // red
  success: 0x57f287,   // green
};

/** Send an alert to all configured channels (Discord + Telegram). */
export async function sendAlert(payload: AlertPayload): Promise<void> {
  const ts = payload.timestamp ?? Date.now();
  const promises: Promise<void>[] = [];

  if (DISCORD_WEBHOOK_URL) {
    promises.push(sendDiscordAlert(payload, ts));
  }
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    promises.push(sendTelegramAlert(payload, ts));
  }

  // Always log to console as a baseline
  const level = payload.level.toUpperCase().padEnd(7);
  console.log(`[${level}] ${payload.title}: ${payload.message}`);

  await Promise.allSettled(promises);
}

async function sendDiscordAlert(payload: AlertPayload, ts: number): Promise<void> {
  const body = {
    embeds: [{
      title: `${LEVEL_EMOJI[payload.level]} ${payload.title}`,
      description: payload.message,
      color: LEVEL_COLOR[payload.level],
      timestamp: new Date(ts).toISOString(),
      fields: payload.data
        ? Object.entries(payload.data).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true,
          }))
        : undefined,
    }],
  };

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`Discord webhook returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.warn("Failed to send Discord alert:", err);
  }
}

async function sendTelegramAlert(payload: AlertPayload, ts: number): Promise<void> {
  const text = `${LEVEL_EMOJI[payload.level]} *${payload.title}*\n${payload.message}\n\n_${new Date(ts).toISOString()}_`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      console.warn(`Telegram API returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.warn("Failed to send Telegram alert:", err);
  }
}

// ── Convenience builders ─────────────────────────────────────────────────────

export function tradeExecutedAlert(params: {
  asset: string;
  side: "buy" | "sell";
  amount: number;
  price: number;
  txHash?: string;
}): AlertPayload {
  return {
    level: "success",
    title: `Trade Executed — ${params.side.toUpperCase()} ${params.asset}`,
    message: `${params.amount} ${params.asset} at $${params.price.toFixed(2)}`,
    data: params.txHash ? { txHash: params.txHash } : undefined,
  };
}

export function tradeFailedAlert(params: {
  asset: string;
  reason: string;
  txHash?: string;
}): AlertPayload {
  return {
    level: "error",
    title: `Trade Failed — ${params.asset}`,
    message: params.reason,
    data: params.txHash ? { txHash: params.txHash } : undefined,
  };
}

export function gasSpikeAlert(currentGwei: number, threshold: number): AlertPayload {
  return {
    level: "warning",
    title: "Gas Price Spike",
    message: `Current gas: ${currentGwei.toFixed(1)} gwei (threshold: ${threshold} gwei)`,
  };
}

export function pnlSummaryAlert(params: {
  totalPnl: number;
  tradeCount: number;
  winRate: number;
}): AlertPayload {
  const sign = params.totalPnl >= 0 ? "+" : "";
  return {
    level: params.totalPnl >= 0 ? "success" : "warning",
    title: "P&L Summary",
    message: `Total P&L: ${sign}$${params.totalPnl.toFixed(2)} | Trades: ${params.tradeCount} | Win rate: ${(params.winRate * 100).toFixed(1)}%`,
  };
}
