const fs = require("fs");
const { exit } = require("process");

const generateFiles = (network) => {
  let chainValue = 1;
  const chainId = `${__dirname}/../src/chainId.ts`;

  if (network !== "xdai" && network !== "eth") {
    console.log(`Network ${network} not supported: [xdai | eth]`);
    exit(1);
  }

  const path = `${__dirname}/../subgraph/${network}.subgraph.yaml`;

  return fs.copyFile(path, "subgraph.yaml", err => {
    if (err) throw err;
    console.log("subgraph.yaml generated");
    if (network === "xdai") chainValue = 100;
    return fs.writeFile(
      chainId,
      `export const chainId: u32 = ${chainValue}`,
      err => {
        if (err) throw err;
        console.log("chainId value has been written");
        return 0;
      }
    );
  });
};

/**
 * List prompt example
 */

if (process.argv.length > 2) generateFiles(process.argv[2]);
