import {
  Address,
  log,
  json,
  JSONValueKind,
  ethereum,
  TypedMap,
} from "@graphprotocol/graph-ts";

import { Token } from "../../generated/schema";

import { VERSION } from "../helpers/version";

import { chainId } from "../chainId";

import { tokenRegistry } from "../../data/tokenRegistry";

const networkMapping: TypedMap<i32, string> = new TypedMap()
networkMapping.set(1, "ethereumContract");
networkMapping.set(100, "gnosisContract");

export function createToken(address: Address, decimal: i32, symbol: string | null): void {

  if (address) {
    // Persist token data if it doesn't already exist
    let token = Token.load(address.toHex());

    if (token == null) {
      token = new Token(address.toHex());
      token.address = address;
      token.decimals = decimal
      token.symbol = symbol;
      token.tokenType = 3;
      token.save();
    } else {
      log.warning("Token {} already in registry", [address.toHex()]);
    }
  }
}

export function initRegistry(event: ethereum.Event): void {
  log.info("initRegistry: {}", [VERSION.toString()]);
  const networkKey = networkMapping.mustGet(chainId);
  const tokenList = json.fromString(tokenRegistry).toArray();
  const tokenListLength = tokenList.length;
  for (let i = 0; i < tokenListLength; i++) {
    const tokenObj = tokenList[i].toObject();
    const address = tokenObj.get(networkKey);
    if (!address || address.kind !== JSONValueKind.STRING) continue;
    const symbol = tokenObj.get("symbol");

    let finalSymbolVal: string | null = null
    if (symbol != null) finalSymbolVal = symbol.toString();
    const parsedAddress = Address.fromString(
      address.toString().toLowerCase()
    );
    createToken(
      parsedAddress,
      i32(18),
      finalSymbolVal
    );
  }
}

