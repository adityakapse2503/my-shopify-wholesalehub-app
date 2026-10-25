import { useState } from "react";

export default function Index() {
  const [syncStatus, setSyncStatus] = useState("Not synced");
  const [previousVipPercent, setPreviousVipPercent] = useState(null);
  const [vipPercent, setVipPercent] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    setSyncStatus("Syncing...");

    try {
      const response = await fetch("/api/sync-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Sync failed");
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
    } catch (error) {
      setSyncStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <s-page heading="VIP Discount Sync">
      <s-section heading="VIP Discount Sync Status">
        <s-paragraph>{syncStatus}</s-paragraph>

        {vipPercent !== null && (
          <>
            <s-paragraph>
              Previous VIP10 percentage: {previousVipPercent === null
                ? "Not set"
                : `${previousVipPercent}%`}
            </s-paragraph>
            <s-paragraph>
              Updated VIP10 percentage: {vipPercent}%
            </s-paragraph>
          </>
        )}

        <s-button
          onClick={handleSync}
          {...(loading ? { disabled: true } : {})}
        >
          {loading ? "Syncing..." : "Sync Now"}
        </s-button>
      </s-section>
    </s-page>
  );
}