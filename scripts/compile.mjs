import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const sourcePath = path.join(root, "contracts", "Escrow.sol");
const outDir = path.join(root, "artifacts");

const source = fs.readFileSync(sourcePath, "utf8");

const input = {
  language: "Solidity",
  sources: { "Escrow.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length > 0) {
  console.error("Compilation failed:");
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}

const contract = output.contracts["Escrow.sol"].Escrow;
const artifact = {
  contractName: "Escrow",
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
  compiler: solc.version(),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "Escrow.json"),
  `${JSON.stringify(artifact, null, 2)}\n`,
);

for (const w of (output.errors ?? []).filter((e) => e.severity === "warning")) {
  console.warn(w.formattedMessage);
}

const bytecodeBytes = (artifact.bytecode.length - 2) / 2;
console.log(`Compiled Escrow.sol with solc ${solc.version()}`);
console.log(
  `Artifact written to artifacts/Escrow.json (${bytecodeBytes} bytes bytecode)`,
);
