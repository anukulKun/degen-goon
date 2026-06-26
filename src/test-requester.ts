import dotenv from "dotenv";
import { AgentClient, EventType } from "@croo-network/sdk";
import type { Event } from "@croo-network/sdk";

dotenv.config();

async function getRequesterWallet(
  client: AgentClient,
  baseURL: string,
  sdkKey: string
): Promise<string | null> {
  try {
    const orders = await client.listOrders({ pageSize: 1, role: "requester" });
    if (orders.length > 0 && orders[0].requesterWalletAddress) {
      return orders[0].requesterWalletAddress;
    }
  } catch {
    /* no existing orders yet */
  }

  try {
    const res = await fetch(`${baseURL}/backend/v1/agents/me`, {
      headers: { Authorization: `Bearer ${sdkKey}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { walletAddress?: string; aaWallet?: string };
      return data.walletAddress ?? data.aaWallet ?? null;
    }
  } catch {
    /* endpoint may not exist */
  }

  return null;
}

async function main(): Promise<void> {
  const baseURL = process.env.CROO_API_URL;
  const wsURL = process.env.CROO_WS_URL;
  const sdkKey = process.env.CROO_SDK_KEY_REQUESTER;
  const serviceId = process.env.CROO_SERVICE_ID;

  if (!baseURL || !wsURL || !sdkKey || !serviceId) {
    console.error(
      "Missing required env vars: CROO_API_URL, CROO_WS_URL, CROO_SDK_KEY_REQUESTER, CROO_SERVICE_ID"
    );
    process.exit(1);
  }

  const client = new AgentClient({ baseURL, wsURL }, sdkKey);

  let stream;
  try {
    stream = await client.connectWebSocket();
    console.log("WebSocket connected to Croo Network");
  } catch (err) {
    console.error("Failed to connect WebSocket:", err);
    process.exit(1);
  }

  const wallet = await getRequesterWallet(client, baseURL, sdkKey);
  if (wallet) {
    console.log("Requester AA wallet address:", wallet);
    console.log("Deposit USDC to this address before paying orders.");
  } else {
    console.log(
      "Requester AA wallet address not found — will be shown after order is created."
    );
    console.log("Alternatively, check the Croo Dashboard for your AA wallet address.");
  }

  const timeout = setTimeout(() => {
    console.log("Timeout — no OrderCompleted received within 60s");
    stream?.close();
    process.exit(1);
  }, 60_000);

  stream.on(EventType.OrderCreated, async (event: Event) => {
    const orderId = event.order_id;
    if (!orderId) return;

    console.log("Order created:", orderId);

    try {
      const order = await client.getOrder(orderId);
      console.log("Requester AA wallet address:", order.requesterWalletAddress);

      await client.payOrder(orderId);
      console.log("Order paid:", orderId);
    } catch (err) {
      console.error("Failed to pay order:", err);
    }
  });

  stream.on(EventType.OrderCompleted, async (event: Event) => {
    const orderId = event.order_id;
    if (!orderId) return;

    console.log("Order completed:", orderId);

    try {
      const delivery = await client.getDelivery(orderId);
      console.log("Delivery result:", JSON.stringify(delivery, null, 2));
    } catch (err) {
      console.error("Failed to get delivery:", err);
    }

    clearTimeout(timeout);
    stream?.close();
    process.exit(0);
  });

  try {
    const negotiation = await client.negotiateOrder({
      serviceId,
      requirements: JSON.stringify({
        type: "text",
        value: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      }),
    });
    console.log("Negotiation created:", negotiation.negotiationId);
    console.log("Waiting for provider to accept, order to be created, and delivery...");
  } catch (err) {
    console.error("Failed to negotiate order:", err);
    clearTimeout(timeout);
    stream?.close();
    process.exit(1);
  }
}

main();
