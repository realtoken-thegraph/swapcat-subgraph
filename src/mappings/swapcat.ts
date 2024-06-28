import { Address, Bytes } from "@graphprotocol/graph-ts";
import {
  Offer,
  Account,
  OfferPrice,
  Purchase,
  Token
} from "../../generated/schema";
import {
  MakeofferCall,
  BuyCall,
  DeleteofferCall
} from "../../generated/Swapcat/Swapcat";
import { ONE, ZERO } from "../helpers/number";

function getAccount(address: string): Account {
  let account = Account.load(address);
  if (account == null) {
    account = new Account(address);
    account.address = Bytes.fromHexString(address);
    account.save();
  }
  return account;
}

function getToken(address: string): Token {
  let token = Token.load(address);
  if (token == null) {
    token = new Token(address);
    token.address = Address.fromHexString(address);
    token.tokenType = 1;
    token.save();
  }
  return token;
}

export function handleMakeoffer(call: MakeofferCall): void {
  const inputs = call.inputs;
  const offerTokenAddress = inputs._offertoken.toHex();
  const buyerTokenAddress = inputs._buyertoken.toHex();

  let offerTokenEntity = Token.load(offerTokenAddress);
  let buyerTokenEntity = Token.load(buyerTokenAddress);
  if (offerTokenEntity == null && buyerTokenEntity == null) return;

  let totalTokenType = 0;
  if (offerTokenEntity !== null) totalTokenType += offerTokenEntity.tokenType;
  if (buyerTokenEntity !== null) totalTokenType += buyerTokenEntity.tokenType;

  if (totalTokenType < 3) return;

  const offerToken = getToken(offerTokenAddress);
  const buyerToken = getToken(buyerTokenAddress);

  const currentBlockTimestamp = call.block.timestamp;
  const currentBlockNumber = call.block.number;
  if (inputs._offerid == 0) {
    const seller = getAccount(call.from.toHex());
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
    offerPrice.price = inputs._price
    offerPrice.createdAtBlock = currentBlockNumber
    offerPrice.createdAtTimestamp = currentBlockTimestamp
    
    offerPrice.save();
    offer.save();
  } else {
    const offerId = inputs._offerid.toString();
    const offer = Offer.load(offerId);
    if (offer) {
      const offerPrice = new OfferPrice(offerId + '-' + offer.pricesCount.toString());
      offerPrice.offer = offer.id;
      offerPrice.price = inputs._price
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

    const purchase = new Purchase(offerId + '-' + offer.purchasesCount.toString());
    purchase.offer = offer.id;
    purchase.offerToken = offerToken.id;
    purchase.buyerToken = buyerToken.id;
    purchase.buyer = buyer.id;
    purchase.seller = seller.id;
    purchase.price = call.inputs._price;
    purchase.quantity = call.inputs._offertokenamount;
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
