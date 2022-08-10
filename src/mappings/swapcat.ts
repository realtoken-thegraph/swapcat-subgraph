import { Bytes } from '@graphprotocol/graph-ts'
import { Offer, Account, OfferPrice, Purchase, Token } from '../types/schema'
import { MakeofferCall, BuyCall, DeleteofferCall } from '../types/Swapcat/Swapcat'

function getAccount (address: string): Account {
  let account = Account.load(address)
  if (account == null) {
    account = new Account(address)
    account.address = Bytes.fromHexString(address)
    account.offers = []
    account.purchases = []
    account.save()
  }
  return account
}

function getToken (address: string): Token {
  let token = Token.load(address)
  if (token == null) {
    token = new Token(address)
    token.address = Bytes.fromHexString(address)
    token.offers = []
    token.purchases = []
    token.save()
  }
  return token
}

export function handleMakeoffer (call: MakeofferCall): void {
  const seller = getAccount(call.from.toHex())
  const offerToken = getToken(call.inputs._offertoken.toHex())
  const buyerToken = getToken(call.inputs._buyertoken.toHex())

  if (call.inputs._offerid === 0) {
    const offer = new Offer(call.outputs.value0.toString())
    offer.seller = seller.id
    offer.offerToken = offerToken.id
    offer.buyerToken = buyerToken.id
    offer.purchases = []
    offer.createdAtBlock = call.block.number
    offer.createdAtTimestamp = call.block.timestamp

    const offerPrice = new OfferPrice(call.transaction.hash.toHex())
    offerPrice.offer = offer.id
    offerPrice.price = call.inputs._price
    offerPrice.createdAtBlock = call.block.number
    offerPrice.createdAtTimestamp = call.block.timestamp
    offerPrice.save()

    offer.prices = [offerPrice.id]
    offer.save()

    const offerTokenOffers = offerToken.offers
    offerTokenOffers.push(offer.id)
    offerToken.offers = offerTokenOffers
    offerToken.save()

    const buyerTokenOffers = buyerToken.offers
    buyerTokenOffers.push(offer.id)
    buyerToken.offers = buyerTokenOffers
    buyerToken.save()

    const sellerOffers = seller.offers
    sellerOffers.push(offer.id)
    seller.offers = sellerOffers
    seller.save()
  } else {
    const offer = Offer.load(call.inputs._offerid.toString())
    if (offer) {
      const offerPrice = new OfferPrice(call.transaction.hash.toHex())
      offerPrice.offer = offer.id
      offerPrice.price = call.inputs._price
      offerPrice.createdAtBlock = call.block.number
      offerPrice.createdAtTimestamp = call.block.timestamp
      offerPrice.save()

      const prices = offer.prices
      prices.push(offerPrice.id)
      offer.prices = prices
      offer.save()
    }
  }
}

export function handleBuy (call: BuyCall): void {
  const offer = Offer.load(call.inputs._offerid.toString())
  
  if (offer) {
    const buyer = getAccount(call.from.toHex())
    const offerToken = getToken(offer.offerToken)
    const buyerToken = getToken(offer.buyerToken)

    const purchase = new Purchase(call.transaction.hash.toHex())
    purchase.offer = offer.id
    purchase.buyer = buyer.id
    purchase.price = call.inputs._price
    purchase.quantity = call.inputs._offertokenamount
    purchase.createdAtBlock = call.block.number
    purchase.createdAtTimestamp = call.block.timestamp
    purchase.save()

    const buyerPurchases = buyer.purchases
    buyerPurchases.push(purchase.id)
    buyer.purchases = buyerPurchases
    buyer.save()

    const offerTokenPurchases = offerToken.purchases
    offerTokenPurchases.push(purchase.id)
    offerToken.purchases = offerTokenPurchases
    offerToken.save()

    const buyerTokenPurchases = buyerToken.purchases
    buyerTokenPurchases.push(purchase.id)
    buyerToken.purchases = buyerTokenPurchases
    buyerToken.save()

    const purchases = offer.purchases
    purchases.push(purchase.id)
    offer.purchases = purchases
    offer.save()
  }
}

export function handleDeleteoffer (call: DeleteofferCall): void {
  const offer = Offer.load(call.inputs._offerid.toString())
  if (offer) {
    offer.removedAtBlock = call.block.number
    offer.removedAtTimestamp = call.block.timestamp
    offer.save()
  }
}
