import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/components/wallet/WalletProvider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "TradingHomie — Your AI-Powered Trading Companion",
  description:
    "Trade smarter with AI-powered swap routing, paper trading, and automated strategies on Arbitrum.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex h-full bg-gray-950 text-white">
        <WalletProvider>
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}