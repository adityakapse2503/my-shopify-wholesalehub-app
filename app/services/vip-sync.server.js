// D:\Shopify CLI\vip-discount-sync\app\services\vip-sync.server.js
import db from "../db.server";

const DISCOUNT_CODE = "VIP10";
const METAFIELD = { namespace: "custom", key: "vip10_percent" };

export async function syncVipPercent(admin, shopDomain) {
  if (!shopDomain) {
    throw new Error("Shop domain is required to track VIP percentage changes");
  }

  // 1. Read the discount by code
  const res = await admin.graphql(
    `#graphql
    query ($code: String!) {
      codeDiscountNodeByCode(code: $code) {
        codeDiscount {
          __typename
          ... on DiscountCodeBasic {
            status
            customerGets {
              value {
                __typename
                ... on DiscountPercentage { percentage }
              }
            }
          }
        }
      }
    }`,
    { variables: { code: DISCOUNT_CODE } }
  );
  
  const json = await res.json();
  const d = json.data?.codeDiscountNodeByCode?.codeDiscount;

  let percent = 0; // 0 = no VIP discount
  if (
    d?.__typename === "DiscountCodeBasic" &&
    d.status === "ACTIVE" &&
    d.customerGets?.value?.__typename === "DiscountPercentage"
  ) {
    // Shopify stores percentage as decimal (0.1 = 10%)
    // We convert to integer for easier theme handling (10 = 10%)
    percent = Math.round(d.customerGets.value.percentage * 100);
  }

  // 2. Get shop id
  const shopRes = await admin.graphql(`#graphql
    {
      shop {
        id
        metafield(namespace: "${METAFIELD.namespace}", key: "${METAFIELD.key}") {
          value
        }
      }
    }`);
  const shop = (await shopRes.json()).data.shop;
  const shopId = shop.id;
  const metafieldPercent = shop.metafield
    ? Number(shop.metafield.value)
    : null;

  if (
    metafieldPercent !== null &&
    !Number.isFinite(metafieldPercent)
  ) {
    throw new Error("Stored VIP percentage is not a valid number");
  }

  const syncState = await db.vipDiscountSyncState.findUnique({
    where: { shop: shopDomain },
  });
  const previousVipPercent = syncState
    ? syncState.currentPercent === percent
      ? syncState.previousPercent
      : syncState.currentPercent
    : metafieldPercent;

  await db.vipDiscountSyncState.upsert({
    where: { shop: shopDomain },
    create: {
      shop: shopDomain,
      previousPercent: previousVipPercent,
      currentPercent: percent,
    },
    update: {
      previousPercent: previousVipPercent,
      currentPercent: percent,
    },
  });

  // 3. Write metafield
  const set = await admin.graphql(
    `#graphql
    mutation ($m: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $m) {
        metafields { id }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        m: [{
          ownerId: shopId,
          namespace: METAFIELD.namespace,
          key: METAFIELD.key,
          type: "number_decimal",
          value: String(percent),
        }],
      },
    }
  );
  
  const errs = (await set.json()).data.metafieldsSet.userErrors;
  if (errs.length) {
    throw new Error(`Metafield sync error: ${JSON.stringify(errs)}`);
  }
  
  console.log(`✅ VIP discount synced: ${percent}%`);
  return { previousVipPercent, vipPercent: percent };
}
