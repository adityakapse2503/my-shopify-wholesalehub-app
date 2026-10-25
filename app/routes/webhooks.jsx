
import { authenticate } from "../shopify.server";
import { syncVipPercent } from "../services/vip-sync.server";

export const action = async ({ request }) => {
  const { topic, admin, shop } =
    await authenticate.webhook(request);

  const normalizedTopic = String(topic ?? "")
    .replace(/[^a-z]/gi, "")
    .toUpperCase();

  console.log(
    `[webhook] Received topic=${topic}, shop=${shop ?? "unknown"}`
  );

  const discountTopics = [
    "DISCOUNTSCREATE",
    "DISCOUNTSUPDATE",
    "DISCOUNTSDELETE",
  ];

  if (!discountTopics.includes(normalizedTopic)) {
    console.log(`[webhook] Ignoring topic=${topic}`);
    return new Response("OK", { status: 200 });
  }

  if (!admin || !shop) {
    console.error(
      `[webhook] Missing admin session or shop for ${topic}`
    );

    return new Response("Missing admin session or shop", {
      status: 500,
    });
  }

  try {
    const { previousVipPercent, vipPercent } =
      await syncVipPercent(admin, shop);

    console.log(
      `[webhook] VIP discount synced for ${shop}: ` +
      `${previousVipPercent ?? "unknown"}% -> ${vipPercent}%`
    );

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(
      `[webhook] VIP sync failed for ${shop}:`,
      error
    );

    return new Response("VIP sync failed", { status: 500 });
  }
};
