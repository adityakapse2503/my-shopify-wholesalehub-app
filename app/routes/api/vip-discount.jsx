// D:\Shopify CLI\vip-discount-sync\app\routes\api\vip-discount.jsx
import { json } from "@shopify/remix-oxygen";
import { authenticate } from "../../shopify.server";

export const loader = async ({ request, context }) => {
  const { admin, session } = await authenticate.public.appProxy(request);

  // Get the VIP percentage from shop metafield
  const shopRes = await admin.graphql(`#graphql
    query {
      shop {
        id
        vipPercent: metafield(namespace: "custom", key: "vip10_percent") {
          value
        }
      }
    }
  `);
  
  const shopData = (await shopRes.json()).data;
  const vipPercent = shopData?.shop?.vipPercent?.value ? parseFloat(shopData.shop.vipPercent.value) : 0;

  return json({ vipPercent, shop: session.shop });
};
