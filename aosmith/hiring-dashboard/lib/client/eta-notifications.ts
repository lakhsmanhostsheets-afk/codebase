const DB_NAME = "tasks-notifications";
const STORE = "meta";

export const ETA_SNOOZE_KEY = "tasks:snoozeUntil";
export const ETA_NOTIFIED_KEY = "tasks:notifiedEtaBreach";
export const SNOOZE_MINUTES = 15;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getMeta<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function setMeta(key: string, value: unknown) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function getEtaSnoozeUntil(): Promise<number | null> {
  const fromDb = await getMeta<number>(ETA_SNOOZE_KEY);
  if (fromDb) return fromDb;
  return readLocalStorage<number | null>(ETA_SNOOZE_KEY, null);
}

export async function setEtaSnoozeUntil(until: number | null) {
  if (until === null) {
    writeLocalStorage(ETA_SNOOZE_KEY, null);
    return;
  }
  await setMeta(ETA_SNOOZE_KEY, until);
  writeLocalStorage(ETA_SNOOZE_KEY, until);
}

export async function snoozeEtaAlerts() {
  const until = Date.now() + SNOOZE_MINUTES * 60 * 1000;
  await setEtaSnoozeUntil(until);
  return until;
}

export function getNotifiedEtaAlertIds(): string[] {
  return readLocalStorage<string[]>(ETA_NOTIFIED_KEY, []);
}

export function setNotifiedEtaAlertIds(ids: string[]) {
  writeLocalStorage(ETA_NOTIFIED_KEY, ids);
}

type ActionableNotificationOptions = NotificationOptions & {
  actions?: { action: string; title: string }[];
};

type EtaAlertNotification = {
  id: string;
  task: {
    id: string;
    title: string;
    dueAt: string | null;
  };
};

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function registerEtaNotificationWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register("/tasks-notifications-sw.js")
      .catch(() => null);
  }
  return registrationPromise;
}

export async function showEtaBreachNotifications(alerts: EtaAlertNotification[]) {
  if (!alerts.length) return [];

  const registration = await registerEtaNotificationWorker();
  const notified = new Set(getNotifiedEtaAlertIds());
  const pending = alerts.filter((alert) => !notified.has(alert.id));
  if (!pending.length) return [];

  if (registration && "showNotification" in registration) {
    if (pending.length === 1) {
      const alert = pending[0];
      const options: ActionableNotificationOptions = {
        body: `${alert.task.title} was due at ${alert.task.dueAt ?? "unknown time"}`,
        tag: `eta-breach-${alert.id}`,
        data: { url: `/tasks/${alert.task.id}` },
        actions: [
          { action: "open", title: "Open task" },
          { action: "snooze", title: `Snooze ${SNOOZE_MINUTES} min` },
        ],
      };
      await registration.showNotification("ETA breached", options as NotificationOptions);
    } else {
      const preview = pending
        .slice(0, 4)
        .map((alert) => `• ${alert.task.title}`)
        .join("\n");
      const extra = pending.length > 4 ? `\n+${pending.length - 4} more` : "";
      const options: ActionableNotificationOptions = {
        body: `${preview}${extra}`,
        tag: "eta-breach-summary",
        data: { url: "/tasks" },
        actions: [
          { action: "open", title: "View tasks" },
          { action: "snooze", title: `Snooze ${SNOOZE_MINUTES} min` },
        ],
      };
      await registration.showNotification(`${pending.length} tasks past due`, options as NotificationOptions);
    }
  } else if ("Notification" in window && Notification.permission === "granted") {
    if (pending.length === 1) {
      const alert = pending[0];
      new Notification("ETA breached", {
        body: `${alert.task.title} was due at ${alert.task.dueAt ?? "unknown time"}`,
        tag: `eta-breach-${alert.id}`,
      });
    } else {
      new Notification(`${pending.length} tasks past due`, {
        body: pending
          .slice(0, 4)
          .map((alert) => alert.task.title)
          .join(", "),
        tag: "eta-breach-summary",
      });
    }
  }

  const nextNotified = Array.from(new Set([...notified, ...pending.map((alert) => alert.id)]));
  setNotifiedEtaAlertIds(nextNotified);
  return nextNotified;
}

export function listenForEtaSnoozeMessages(onSnooze: (until: number) => void) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type !== "ETA_SNOOZE") return;
    const until = typeof event.data.snoozeUntil === "number"
      ? event.data.snoozeUntil
      : Date.now() + SNOOZE_MINUTES * 60 * 1000;
    writeLocalStorage(ETA_SNOOZE_KEY, until);
    onSnooze(until);
  };

  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}
