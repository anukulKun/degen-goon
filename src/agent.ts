import { ethers } from "ethers";
import { CapSdk } from "./cap";
import { roastWallet, RoastResult } from "./roast";

export interface AgentRequest {
  address: string;
  action?: "roast" | "analyze";
}

export interface AgentResponse {
  success: boolean;
  data?: RoastResult;
  error?: string;
}

export class DegenAgent {
  private cap: CapSdk;

  constructor(capApiKey: string) {
    this.cap = new CapSdk(capApiKey);
  }

  async handle(request: AgentRequest): Promise<AgentResponse> {
    if (!ethers.isAddress(request.address)) {
      return { success: false, error: "Invalid Ethereum address" };
    }

    const action = request.action ?? "roast";

    if (action === "roast") {
      const result = await roastWallet(request.address);
      return { success: true, data: result };
    }

    return { success: false, error: `Unknown action: ${action}` };
  }
}
