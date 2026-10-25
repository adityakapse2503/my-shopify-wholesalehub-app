// D:\Shopify CLI\vip-discount-sync\app\routes\index.jsx
import { useState } from "react";
import { Button, Card, Text } from "@shopify/polaris";

export default function HomePage() {
  const [syncStatus, setSyncStatus] = useState("Not synced");
  const [previousVipPercent, setPreviousVipPercent] = useState(null);
  const [vipPercent, setVipPercent] = useState(null);

  const handleSync = async () => {
    setSyncStatus("Syncing...");

    try {
      const res = await fetch("/api/sync-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const contentType = res.headers.get("content-type") || "";
      const body = await res.text();

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Expected JSON but received a non-JSON response. ` +
            `HTTP ${res.status}. Response: ${body.slice(0, 200)}`,
        );
      }

      let data;

      try {
        data = JSON.parse(body);
      } catch {
        throw new Error(`Invalid JSON response. HTTP ${res.status}.`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Request failed with HTTP ${res.status}`);
      }

      setPreviousVipPercent(data.previousVipPercent);
      setVipPercent(data.vipPercent);
      if (data.previousVipPercent === null) {
        setSyncStatus("Synced successfully! No previous percentage was saved.");
      } else {
        const change = data.vipPercent - data.previousVipPercent;
        setSyncStatus(
          change === 0
            ? "Synced successfully! No percentage change since the last sync."
            : `Synced successfully! Change: ${change > 0 ? "+" : ""}${change} percentage points.`,
        );
      }
    } catch (err) {
      console.error("VIP sync request failed:", err);
      setSyncStatus(`Error: ${err.message}`);
    }
  };

  return (
    <Card>
      <Text as="h2" variant="headingMd">
        VIP Discount Sync Status
      </Text>
      <Text>{syncStatus}</Text>
      {vipPercent !== null && (
        <>
          <Text>
            Previous VIP10 percentage:{" "}
            <strong>
              {previousVipPercent === null ? "Not set" : `${previousVipPercent}%`}
            </strong>
          </Text>
          <Text>
            Updated VIP10 percentage: <strong>{vipPercent}%</strong>
          </Text>
        </>
      )}
      <Button onClick={handleSync} primary>
        Sync Now
      </Button>
    </Card>
  );
}
