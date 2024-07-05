import { DeployedToken } from "../../generated/Create2Deployer/Create2Deployer";
import { ERC20 } from "../../generated/Swapcat/ERC20";
import { createToken } from "./registry";
  
export function handleCreatedToken(event: DeployedToken): void {
  const erc20instance = ERC20.bind(event.params.newContract);
  const decimal = erc20instance.try_decimals()
  const symbol = erc20instance.try_symbol();
  
  let finalDecimalValue: i32 = i32(0);
  if (!decimal.reverted) finalDecimalValue = decimal.value;

  let finalSymbolValue: string | null = null;
  if (!symbol.reverted) finalSymbolValue = symbol.value;
  createToken(event.params.newContract, finalDecimalValue, finalSymbolValue);
}
  