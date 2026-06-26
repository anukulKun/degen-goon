import { AgentClient, EventType, DeliverableType } from "@croo-network/sdk";
import type { Event } from "@croo-network/sdk";
import { roastWallet } from "./roast";

export async function startProvider(): Promise<void> {
  const baseURL = process.env.CROO_API_URL;
  const wsURL = process.env.CROO_WS_URL;
  const sdkKey = process.env.CROO_SDK_KEY;

  if (!baseURL || !wsURL || !sdkKey) {
    console.error(
      "Missing CROO_API_URL, CROO_WS_URL, or CROO_SDK_KEY — provider disabled"
    );
    return;
  }

  const client = new AgentClient({ baseURL, wsURL }, sdkKey);

  let stream;
  try {
    stream = await client.connectWebSocket();
    console.log("WebSocket connected to Croo Network");
  } catch (err) {
    console.error("Failed to connect WebSocket:", err);
    return;
  }

  stream.on(EventType.NegotiationCreated, async (event: Event) => {
    const negotiationId = event.negotiation_id;
    if (!negotiationId) return;

    console.log("Negotiation received:", negotiationId);

    try {
      await client.acceptNegotiation(negotiationId);
      console.log("Negotiation accepted:", negotiationId);
    } catch (err) {
      console.error("Failed to accept negotiation:", err);
    }
  });

  stream.on(EventType.OrderPaid, async (event: Event) => {
    const orderId = event.order_id;
    if (!orderId) return;

    console.log("Order paid:", orderId);

    try {
      const order = await client.getOrder(orderId);
      const walletAddress = order.requesterWalletAddress;

      const roastResult = await roastWallet(walletAddress);
      console.log("Roast generated for wallet:", walletAddress);

      await client.deliverOrder(orderId, {
        deliverableType: DeliverableType.Schema,
        deliverableSchema: JSON.stringify(roastResult),
      });
      console.log("Delivered order:", orderId);
    } catch (err) {
      console.error("Failed to process paid order:", err);
    }
  });

  console.log("Provider started — listening for negotiations and orders");
}
