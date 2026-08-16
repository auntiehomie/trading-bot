import fs from "node:fs";
import path from "node:path";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

const root = process.cwd();
const artifactPath = path.join(root, "artifacts", "Escrow.json");

const RPC_URL =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ||
  "https://sepolia-rollup.arbitrum.io/rpc";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!fs.existsSync(artifactPath)) {
  console.error("No compiled artifact found. Run `npm run compile` first.");
  process.exit(1);
}

if (!PRIVATE_KEY || PRIVATE_KEY === "your_deployer_private_key_here") {
  console.error("PRIVATE_KEY not set. Add it to .env.local before deploying.");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace(/^0x/, "")}`);

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(RPC_URL),
});
const walletClient = createWalletClient({
  chain: arbitrumSepolia,
  transport: http(RPC_URL),
  account,
});

console.log(`Deploying Escrow from ${account.address} on Arbitrum Sepolia…`);

const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
});

console.log(`Deploy transaction: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });

console.log(`Escrow deployed at: ${receipt.contractAddress}`);
console.log(
  `\nSet ESCROW_CONTRACT_ADDRESS=${receipt.contractAddress} in your .env.local`,
);
