// D:\Shopify CLI\vip-discount-sync\app\routes\webhooks.jsx
import { authenticate } from "../shopify.server";
import { syncVipPercent } from "../services/vip-sync.server";

export const action = async ({ request }) => {
  const { topic, admin, shop } = await authenticate.webhook(request);
  
  if (!admin) return new Response();

  // Check for discount-related webhooks
  if (
    topic === "DISCOUNTS_CREATE" ||
    topic === "DISCOUNTS_UPDATE" ||
    topic === "DISCOUNTS_DELETE"
  ) {
    try {
      const { vipPercent } = await syncVipPercent(admin, shop);
      console.log(`✅ VIP discount synced: ${vipPercent}%`);
    } catch (err) {
      console.error("❌ Sync failed:", err.message);
    }
  }

  return new Response("OK", { status: 200 });
};
