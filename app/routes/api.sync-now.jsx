import { data } from "react-router";
import { authenticate } from "../shopify.server";
import { syncVipPercent } from "../services/vip-sync.server";

export async function action({ request }) {
  if (request.method !== "POST") {
    return data(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  const { admin, session } = await authenticate.admin(request);

  try {
    const { previousVipPercent, vipPercent } = await syncVipPercent(
      admin,
      session.shop
    );

    return data({
      success: true,
      previousVipPercent,
      vipPercent,
    });
  } catch (error) {
    console.error("VIP sync failed:", error);

    return data(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unknown sync error",
      },
      { status: 500 }
    );
  }
}