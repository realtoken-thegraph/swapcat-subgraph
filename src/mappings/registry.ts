import {
  Address,
  log,
  ipfs,
  Bytes,
  json,
  JSONValueKind,
  ethereum,
  TypedMap,
} from "@graphprotocol/graph-ts";

import { Token } from "../../generated/schema";

import { VERSION } from "../helpers/version";

import { REGISTRY_HASH } from "../config";

import { chainId } from "../chainId";

const networkMapping: TypedMap<i32, string> = new TypedMap()
networkMapping.set(1, "ethereumContract");
networkMapping.set(100, "gnosisContract");

export function createToken(address: Address): void {

  if (address) {
    // Persist token data if it doesn't already exist
    let token = Token.load(address.toHex());

    if (token == null) {
      token = new Token(address.toHex());
      token.address = address;
      token.tokenType = 3;
      token.save();
    } else {
      log.warning("Token {} already in registry", [address.toHex()]);
    }
  }
}

export function initRegistry(event: ethereum.Event): void {
  log.info("initRegistry: {}", [VERSION.toString()]);
  const ipfsData = ipfs.cat(REGISTRY_HASH);
  if (ipfsData) {
    const networkKey = networkMapping.mustGet(chainId);
    const tokenList = json.fromBytes(ipfsData as Bytes).toArray();
    for (let i = 0; i < tokenList.length; i++) {
      const tokenObj = tokenList[i].toObject();
      const address = tokenObj.get(networkKey);
      if (!address || address.kind !== JSONValueKind.STRING) continue;

      const parsedAddress = Address.fromString(
        address.toString().toLowerCase()
      );
      createToken(parsedAddress)
    }
  } else {
    log.critical("ipfsdata is null: {}", [REGISTRY_HASH]);
  }
}
