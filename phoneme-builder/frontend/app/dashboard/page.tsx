"use client";

import { useCallback, useEffect, useState } from "react";
import SiteShell from "@/app/components/site-shell";

type Metrics = {
  summaries: {
    wordLists: number;
    activities: number;
    wordleActivities: number;
    wordSearchActivities: number;
  };
  generation: {
    successful: number;
    failed: number;
    totalAttempts: number;
    wordleUses: number;
    wordSearchUses: number;
    mostUsedActivityType: string;
  };
  pageTiming: {
    samples: number;
    averageDurationMs: number | null;
  };
  warnings: Array<{
    id: string;
    kind: "generation" | "word-list";
    message: string;
    createdAt: string | null;
  }>;
  generatedAt: string;
};

type Health = {
  status: "ok" | "error";
  service: string;
  database: "ok" | "error";
  responseTimeMs?: number;
};

function formatDuration(milliseconds: number | null) {
  if (milliseconds === null) return "No data yet";
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [status, setStatus] = useState("Loading monitoring data…");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch("/health", { cache: "no-store" }),
        fetch("/api/metrics", { cache: "no-store" }),
      ]);

      const healthBody = (await healthResponse.json().catch(() => null)) as Health | null;
      setHealth(
        healthBody ?? {
          status: healthResponse.ok ? "ok" : "error",
          service: "phoneme-builder",
          database: healthResponse.ok ? "ok" : "error",
        }
      );

      if (!metricsResponse.ok) {
        throw new Error(`Metrics request failed (${metricsResponse.status})`);
      }

      const metricsBody = (await metricsResponse.json()) as Metrics;
      setMetrics(metricsBody);
      setStatus("Dashboard is receiving database-backed monitoring data.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Monitoring data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const healthy = health?.status === "ok" && health.database === "ok";

  return (
    <SiteShell>
      <div className="page-stack">
        <section className="page-heading">
          <div>
            <span className="eyebrow">Instrumentation and observability</span>
            <h1>Operational dashboard</h1>
            <p>
              Live health, activity creation, generation outcomes, usage and warning indicators
              backed by PostgreSQL. Values refresh automatically every five seconds.
            </p>
          </div>
          <button className="button secondary" type="button" onClick={() => void load()} disabled={loading}>
            Refresh now
          </button>
        </section>

        <div
          className={healthy ? "dashboard-status healthy" : "dashboard-status unhealthy"}
          role="status"
          aria-live="polite"
        >
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{healthy ? "System healthy" : "System needs attention"}</strong>
            <span>
              API: {health?.status ?? "checking"} · Database: {health?.database ?? "checking"}
              {typeof health?.responseTimeMs === "number" ? ` · ${health.responseTimeMs} ms` : ""}
            </span>
          </div>
        </div>

        <section className="metrics-grid" aria-label="Operational metrics">
          <article className="metric-card">
            <span>Wordle activities</span>
            <strong>{metrics?.summaries.wordleActivities ?? "—"}</strong>
            <small>Saved activity configurations</small>
          </article>
          <article className="metric-card">
            <span>Word Search activities</span>
            <strong>{metrics?.summaries.wordSearchActivities ?? "—"}</strong>
            <small>Saved activity configurations</small>
          </article>
          <article className="metric-card">
            <span>Successful generations</span>
            <strong>{metrics?.generation.successful ?? "—"}</strong>
            <small>Standalone outputs created</small>
          </article>
          <article className="metric-card">
            <span>Failed generations</span>
            <strong>{metrics?.generation.failed ?? "—"}</strong>
            <small>Recorded generation failures</small>
          </article>
          <article className="metric-card">
            <span>Total generation attempts</span>
            <strong>{metrics?.generation.totalAttempts ?? "—"}</strong>
            <small>Successful + failed attempts</small>
          </article>
          <article className="metric-card">
            <span>Most-used activity</span>
            <strong className="metric-text">{metrics?.generation.mostUsedActivityType ?? "—"}</strong>
            <small>
              Wordle {metrics?.generation.wordleUses ?? 0} · Word Search {metrics?.generation.wordSearchUses ?? 0}
            </small>
          </article>
          <article className="metric-card">
            <span>Average time on page</span>
            <strong className="metric-text">
              {formatDuration(metrics?.pageTiming.averageDurationMs ?? null)}
            </strong>
            <small>{metrics?.pageTiming.samples ?? 0} recorded page visits</small>
          </article>
          <article className="metric-card">
            <span>Stored word lists</span>
            <strong>{metrics?.summaries.wordLists ?? "—"}</strong>
            <small>{metrics?.summaries.activities ?? 0} total saved activities</small>
          </article>
        </section>

        <div className="dashboard-columns">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Warnings and unusual states</span>
                <h2>Recent alerts</h2>
              </div>
              <span className="record-badge">{metrics?.warnings.length ?? 0} shown</span>
            </div>

            {metrics && metrics.warnings.length > 0 ? (
              <ul className="warning-list">
                {metrics.warnings.map((warning) => (
                  <li key={warning.id}>
                    <strong>{warning.kind === "generation" ? "Generation failure" : "Empty word list"}</strong>
                    <span>{warning.message}</span>
                    {warning.createdAt && (
                      <time dateTime={warning.createdAt}>
                        {new Date(warning.createdAt).toLocaleString()}
                      </time>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="notice">
                <strong>No current warnings.</strong>
                <span>Generation failures and empty word lists will appear here automatically.</span>
              </div>
            )}
          </section>

          <section className="panel">
            <span className="eyebrow">Monitoring evidence</span>
            <h2>What is being observed?</h2>
            <ul className="monitoring-list">
              <li><strong>/health</strong><span>Application and database availability</span></li>
              <li><strong>Generation events</strong><span>Successes, failures and activity-type usage</span></li>
              <li><strong>Page timings</strong><span>Average time visitors spend on application pages</span></li>
              <li><strong>Stored data</strong><span>Word lists and Wordle / Word Search creation summaries</span></li>
            </ul>
            <p className="dashboard-updated" aria-live="polite">
              {metrics
                ? `Last refreshed ${new Date(metrics.generatedAt).toLocaleTimeString()}.`
                : status}
            </p>
          </section>
        </div>

        <p className={status.includes("could not") || status.includes("failed") ? "status-message error" : "status-message success"}>
          {status}
        </p>
      </div>
    </SiteShell>
  );
}
