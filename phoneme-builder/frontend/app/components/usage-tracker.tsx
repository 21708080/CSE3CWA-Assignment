"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function UsageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const startedAt = Date.now();
    let sent = false;

    const sendTiming = () => {
      if (sent) return;

      const durationMs = Date.now() - startedAt;
      if (durationMs < 1000) return;
      sent = true;

      const payload = JSON.stringify({ path: pathname, durationMs });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/metrics/page-time",
          new Blob([payload], { type: "application/json" })
        );
        return;
      }

      void fetch("/api/metrics/page-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    };

    window.addEventListener("pagehide", sendTiming);

    return () => {
      window.removeEventListener("pagehide", sendTiming);
      sendTiming();
    };
  }, [pathname]);

  return null;
}
