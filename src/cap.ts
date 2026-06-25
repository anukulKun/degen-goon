import { v4 as uuid } from "uuid";

export interface CapPayload {
  from: string;
  to: string;
  value: string;
  data?: string;
  chainId?: number;
}

export interface CapSignature {
  message: string;
  signature: string;
  publicKey: string;
  capId?: string;
}

export class CapSdk {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sign(payload: CapPayload): Promise<CapSignature> {
    const message = JSON.stringify(payload);
    const dummyKey = `0x${"a".repeat(40)}`;
    const dummySig = `0x${"b".repeat(130)}`;

    return {
      message,
      signature: dummySig,
      publicKey: dummyKey,
      capId: uuid(),
    };
  }

  async verify(signature: CapSignature): Promise<boolean> {
    return signature.signature.length === 132 && signature.signature.startsWith("0x");
  }

  getApiKey(): string {
    return this.apiKey;
  }
}
