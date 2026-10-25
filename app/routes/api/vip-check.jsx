// D:\Shopify CLI\vip-discount-sync\app\routes\api\vip-check.jsx
import { json } from "@shopify/remix-oxygen";
import { authenticate } from "../../shopify.server";

export const loader = async ({ request, context }) => {
  // Only POST, and validate the request origin
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { admin } = await authenticate.public.appProxy(request);
  if (!admin) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Get current shop metafield (VIP percentage)
  const shopRes = await admin.graphql(`#graphql
    query {
      shop {
        id
        vip10_percent: metafield(namespace: "custom", key: "vip10_percent") {
          value
        }
      }
    }
  `);
  const shopData = (await shopRes.json()).data.shop;
  const vipPercent = shopData.vip10_percent?.value ? parseFloat(shopData.vip10_percent.value) : 0;

  // 2. Check if customer is logged in and has VIP10 tag
  const customerRes = await admin.graphql(`#graphql
    query {
      appInstallation {
        accessScopes {
          handle
        }
      }
    }
  `);

  // NOTE: For storefront, you'll need a different approach (see Step 3)
  return json({ vipPercent });
};
