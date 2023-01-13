import { DeployedToken } from "../../generated/Create2Deployer/Create2Deployer";
import { createToken } from "./registry";
  
export function handleCreatedToken(event: DeployedToken): void {
  createToken(event.params.newContract);
}
  