/**
 * Web Push notifications via the standard PushManager API.
 *
 * No FCM dependency. We register a service worker push subscription
 * with the browser, send the subscription JSON to our Edge Function,
 * and the Edge Function (in a follow-up implementation) uses web-push
 * library to deliver pushes signed with our VAPID keys.
 *
 * For the 10-requests/day workload, simply having the PWA open with
 * a Realtime subscription is enough — push is the "user has phone in
 * pocket" case. You can defer setting up push delivery until later
 * if you want; this hook still registers the subscription so it's
 * ready when you do.
 */
import { useCallback } from "react";
import { api } from "../services/api";
import { useToast } from "../contexts/ToastContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

export function usePushNotifications() {
  const toast = useToast();

  const enable = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }
    if (!VAPID_PUBLIC_KEY) {
      console.warn("VITE_VAPID_PUBLIC_KEY is not set; push will not work");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          // Cast: DOM lib expects BufferSource over a non-shared ArrayBuffer.
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }

      await api.registerDevice({
        pushToken: JSON.stringify(subscription),
        platform: "web",
        deviceLabel: navigator.userAgent.slice(0, 200),
      });

      toast.push({
        kind: "success",
        title: "Notifications enabled",
        body: "You'll be alerted when new approvals arrive.",
      });
      return true;
    } catch (err) {
      console.error("Enable push failed", err);
      toast.push({
        kind: "error",
        title: "Could not enable notifications",
        body: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }, [toast]);

  return { enable };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const norm = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(norm);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
