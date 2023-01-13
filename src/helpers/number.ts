import { BigDecimal, BigInt, Address } from '@graphprotocol/graph-ts'

export const ZERO = BigInt.fromI32(0)
export const ONE = BigInt.fromI32(1)

export const ZERO_ADDRESS = Address.zero();

export function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  const precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal()

  return value.divDecimal(precision)
}