// Deploy EscrowFactory to Arbitrum Sepolia
// Usage: PRIVATE_KEY=0x... npx tsx scripts/deploy-factory.ts

import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

// Compiled bytecode for EscrowFactory
const escrowFactoryBytecode = process.env.ESCROW_FACTORY_BYTECODE || "";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: PRIVATE_KEY environment variable is required");
    console.error("Usage: PRIVATE_KEY=0x... npx tsx scripts/deploy-factory.ts");
    process.exit(1);
  }

  if (!escrowFactoryBytecode) {
    console.error("Error: ESCROW_FACTORY_BYTECODE environment variable is required");
    console.error("");
    console.error("First compile the contracts, then set the bytecode:");
    console.error("");
    console.error("  Option 1: Use Foundry (recommended)");
    console.error("    forge install openzeppelin/openzeppelin-contracts");
    console.error("    forge build");
    console.error("    BYTECODE=$(cat out/EscrowFactory.sol/EscrowFactory.json | jq -r '.bytecode.object')");
    console.error("");
    console.error("  Option 2: Use solc directly");
    console.error("    npx solc --optimize --combined-json abi,bin contracts/Escrow.sol contracts/EscrowFactory.sol");
    console.error("");
   process.exit(1);
 }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  console.log(`Deploying from: ${account.address}`);

  // Create clients
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    transport: http(),
    account,
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${balance} wei (${Number(balance) / 1e18} ETH)`);

  if (balance === BigInt(0)) {
    console.error("Error: Account has no ETH to pay gas fees");
    console.error("Get testnet ETH from: hattps://faucet.quicknode.com/arbitrum/sepolia");
    process.exit(1);
  }

  console.log("Deploying EscrowFactory...");

  try {
    const hash = await walletClient.deployContract({
      abi: [],
      bytecode: escrowFactoryBytecode as `0x${string}`,
      account,
    });

    console.log(`Transaction sent: ${hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      const factoryAddress = receipt.contractAddress;
      console.log("");
      console.log("=== Deployment Successful ===");
      console.log(`EscrowFactory deployed at: ${factoryAddress}`);
      console.log(`Transaction hash: ${hash}`);
      console.log("");
      console.log("Next steps:");
      console.log(`1. Add to .env.local:`);
      console.log(`   NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=${factoryAddress}`);
      console.log("");
      console.log(`2. Verify on Arbiscan:`);
      console.log(`   https://sepolia.arbiscan.io/address/${factoryAddress}`);
    } else {
      console.error("Deployment failed (transaction reverted)");
    }
  } catch (error) {
    console.error("Deployment error:", error);
    process.exit(1);
  }
}

main();