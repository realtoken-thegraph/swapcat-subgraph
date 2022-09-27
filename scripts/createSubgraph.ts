import * as fs from "fs";
import { exit } from "process";

const generateFiles = (network: string) => {
  if (network !== "xdai" && network !== "eth") {
    console.log(`Network ${network} not supported: [xdai | eth]`);
    exit(1);
  }

  const path = `${__dirname}/../subgraph/${network}.subgraph.yaml`;

  return fs.copyFile(path, "subgraph.yaml", err => {
    if (err) throw err;
    console.log("subgraph.yaml generated");
  });
};

/**
 * List prompt example
 */

if (process.argv.length > 2) generateFiles(process.argv[2]);
