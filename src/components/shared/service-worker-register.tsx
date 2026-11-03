"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only.
 *
 * Development is intentionally excluded: a caching worker makes hot reload and
 * debugging unreliable, and there is no offline benefit on localhost.
 *
 * Update strategy: a new worker is installed on the next visit, waits, and is
 * activated when the user accepts the update (or on the following navigation).
 * The worker never caches admin, auth or API responses.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    let cancelled = false;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;

        registration.addEventListener("updatefound", () => {
          const installing = registration?.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // A newer version is ready; activate it on the next load.
              installing.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch (error) {
        console.warn("[isnesi] service worker registration failed", error);
      }
    };

    window.addEventListener("load", register);
    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}