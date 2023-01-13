import { Address, Bytes } from "@graphprotocol/graph-ts";
import {
  Offer,
  Account,
  OfferPrice,
  Purchase,
  Token
} from "../../generated/schema";
import { ERC20 } from "../../generated/Swapcat/ERC20";
import {
  MakeofferCall,
  BuyCall,
  DeleteofferCall
} from "../../generated/Swapcat/Swapcat";
import { ONE, toDecimal, ZERO } from "../helpers/number";

function getAccount(address: string): Account {
  let account = Account.load(address);
  if (account == null) {
    account = new Account(address);
    account.address = Bytes.fromHexString(address);
    account.save();
  }
  return account;
}

function getToken(address: string): Token | null {
  let token = Token.load(address);
  if (token == null) {
    token = new Token(address);

    const contract = ERC20.bind(Address.fromString(address));

    if (contract) {
      const decimals = contract.try_decimals();
      const name = contract.try_name();
      const symbol = contract.try_symbol();

      if (decimals.reverted || name.reverted || symbol.reverted) return null;
      token.decimals = decimals.value
      token.name = name.value;
      token.symbol =  symbol.value;
    } else return null

    token.address = Address.fromHexString(address);
    token.tokenType = 1;
    token.save();
  }
  return token;
}

export function handleMakeoffer(call: MakeofferCall): void {
  const seller = getAccount(call.from.toHex());
  const offerTokenAddress = call.inputs._offertoken.toHex();
  const buyerTokenAddress = call.inputs._buyertoken.toHex();

  let offerTokenEntity = Token.load(offerTokenAddress);
  let buyerTokenEntity = Token.load(buyerTokenAddress)
  if (offerTokenEntity === null && buyerTokenEntity === null) return;

  let totalTokenType = 0;
  if (offerTokenEntity !== null) totalTokenType += offerTokenEntity.tokenType;
  if (buyerTokenEntity !== null) totalTokenType += buyerTokenEntity.tokenType;

  if (totalTokenType < 3) return;

  const offerToken = getToken(offerTokenAddress);
  const buyerToken = getToken(buyerTokenAddress);

  if (offerToken === null || buyerToken === null) return;

  const currentBlockTimestamp = call.block.timestamp;
  const currentBlockNumber = call.block.number;
  if (call.inputs._offerid === 0) {
    const newOfferId = call.outputs.value0.toString();
    const offer = new Offer(newOfferId);
    offer.seller = seller.id;
    offer.offerToken = offerToken.id;
    offer.buyerToken = buyerToken.id;
    offer.createdAtBlock = currentBlockNumber
    offer.createdAtTimestamp = currentBlockTimestamp
    offer.purchasesCount = ZERO;
    offer.pricesCount = ONE;

    const offerPrice = new OfferPrice(newOfferId + '-0');
    offerPrice.offer = offer.id;
    offerPrice.price = toDecimal(call.inputs._price, buyerToken.decimals);
    offerPrice.createdAtBlock = currentBlockNumber
    offerPrice.createdAtTimestamp = currentBlockTimestamp
    
    offerPrice.save();
    offer.save();
  } else {
    const offerId = call.inputs._offerid.toString();
    const offer = Offer.load(offerId);
    if (offer) {
      const offerPrice = new OfferPrice(offerId + '-' + offer.pricesCount.toString());
      offerPrice.offer = offer.id;
      offerPrice.price = toDecimal(call.inputs._price, buyerToken.decimals);
      offerPrice.createdAtBlock = currentBlockNumber
      offerPrice.createdAtTimestamp = currentBlockTimestamp
      offerPrice.save();

      offer.pricesCount = offer.pricesCount.plus(ONE);
      offer.save();
    }
  }
}

export function handleBuy(call: BuyCall): void {
  const offerId = call.inputs._offerid.toString();
  const offer = Offer.load(offerId);

  if (offer) {
    const buyer = getAccount(call.from.toHex());
    const seller = getAccount(offer.seller);
    const offerToken = getToken(offer.offerToken);
    const buyerToken = getToken(offer.buyerToken);

    if (offerToken === null || buyerToken === null) return;
    const purchase = new Purchase(offerId + '-' + offer.purchasesCount.toString());
    purchase.offer = offer.id;
    purchase.offerToken = offerToken.id;
    purchase.buyerToken = buyerToken.id;
    purchase.buyer = buyer.id;
    purchase.seller = seller.id;
    purchase.price = toDecimal(call.inputs._price, buyerToken.decimals);
    purchase.quantity = toDecimal(call.inputs._offertokenamount, offerToken.decimals);
    purchase.createdAtBlock = call.block.number;
    purchase.createdAtTimestamp = call.block.timestamp;
    purchase.save();


    offer.purchasesCount = offer.purchasesCount.plus(ONE);
    offer.save();
  }
}

export function handleDeleteoffer(call: DeleteofferCall): void {
  const offer = Offer.load(call.inputs._offerid.toString());
  if (offer) {
    offer.removedAtBlock = call.block.number;
    offer.removedAtTimestamp = call.block.timestamp;
    offer.save();
  }
}
