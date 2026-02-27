import gmailIcon from "@/assets/mail-icons/gmail.png";
import outlookIcon from "@/assets/mail-icons/outlook.png";
import yahooIcon from "@/assets/mail-icons/yahoo.png";
import icloudIcon from "@/assets/mail-icons/icloud.png";
import qqIcon from "@/assets/mail-icons/qq.png";
import neteaseIcon from "@/assets/mail-icons/163.png";
import protonIcon from "@/assets/mail-icons/proton.png";

export type EmailProviderIconMap = Record<string, string>;

type EmailIconRegistry = {
  version: number;
  builtIn: EmailProviderIconMap;
  custom: EmailProviderIconMap;
};

const STORAGE_KEY = "synaply.mail.provider-icons";
const STORAGE_VERSION = 1;
const ICON_DB_NAME = "synaply-mail-icon-db";
const ICON_STORE_NAME = "icons";
const ICON_DB_VERSION = 1;
const ICON_UPDATE_EVENT = "synaply-mail-icons-updated";

export const DEFAULT_EMAIL_PROVIDER_ICONS: EmailProviderIconMap = {
  "gmail.com": gmailIcon.src,
  "googlemail.com": gmailIcon.src,
  "outlook.com": outlookIcon.src,
  "hotmail.com": outlookIcon.src,
  "live.com": outlookIcon.src,
  "msn.com": outlookIcon.src,
  "yahoo.com": yahooIcon.src,
  "yahoo.co.jp": yahooIcon.src,
  "icloud.com": icloudIcon.src,
  "me.com": icloudIcon.src,
  "mac.com": icloudIcon.src,
  "qq.com": qqIcon.src,
  "163.com": neteaseIcon.src,
  "126.com": neteaseIcon.src,
  "protonmail.com": protonIcon.src,
  "proton.me": protonIcon.src,
};

const defaultRegistry: EmailIconRegistry = {
  version: STORAGE_VERSION,
  builtIn: DEFAULT_EMAIL_PROVIDER_ICONS,
  custom: {},
};

let cachedRegistry: EmailIconRegistry | null = null;
let idbIconCache: EmailProviderIconMap = {};

const isBrowser = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";
const canUseIndexedDb = () =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const normalizeDomain = (value: string) => {
  const domain = value.includes("@") ? value.split("@")[1] : value;
  return domain?.trim().toLowerCase() ?? "";
};

const normalizeIconMap = (icons: EmailProviderIconMap) => {
  const normalized: EmailProviderIconMap = {};
  Object.entries(icons).forEach(([key, url]) => {
    const domain = normalizeDomain(key);
    if (domain && url) {
      normalized[domain] = url;
    }
  });
  return normalized;
};

const readRegistry = (): EmailIconRegistry => {
  if (!isBrowser()) {
    return defaultRegistry;
  }

  if (cachedRegistry) {
    return cachedRegistry;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    cachedRegistry = defaultRegistry;
    return defaultRegistry;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<EmailIconRegistry>;
    const custom = parsed.custom ? normalizeIconMap(parsed.custom) : {};
    cachedRegistry = {
      version: STORAGE_VERSION,
      builtIn: DEFAULT_EMAIL_PROVIDER_ICONS,
      custom,
    };
    return cachedRegistry;
  } catch {
    cachedRegistry = defaultRegistry;
    return defaultRegistry;
  }
};

const writeRegistry = (registry: EmailIconRegistry) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  cachedRegistry = registry;
};

const notifyEmailIconUpdate = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(ICON_UPDATE_EVENT));
};

const openEmailIconDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = window.indexedDB.open(ICON_DB_NAME, ICON_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ICON_STORE_NAME)) {
        db.createObjectStore(ICON_STORE_NAME, { keyPath: "domain" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const updateIdbCache = (records: Array<{ domain: string; blob: Blob }>) => {
  Object.values(idbIconCache).forEach((url) => URL.revokeObjectURL(url));
  idbIconCache = records.reduce<EmailProviderIconMap>((acc, record) => {
    if (record.domain && record.blob) {
      acc[record.domain] = URL.createObjectURL(record.blob);
    }
    return acc;
  }, {});
};

const removeIdbIcon = async (domain: string) => {
  if (!canUseIndexedDb()) return;
  try {
    const db = await openEmailIconDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(ICON_STORE_NAME, "readwrite");
      tx.objectStore(ICON_STORE_NAME).delete(domain);
      tx.oncomplete = () => {
        if (idbIconCache[domain]) {
          URL.revokeObjectURL(idbIconCache[domain]);
          delete idbIconCache[domain];
        }
        resolve();
      };
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
};

export const ensureEmailIconRegistry = () => {
  if (!isBrowser()) return;
  const stored = readRegistry();
  const nextRegistry: EmailIconRegistry = {
    version: STORAGE_VERSION,
    builtIn: DEFAULT_EMAIL_PROVIDER_ICONS,
    custom: stored.custom,
  };
  writeRegistry(nextRegistry);
};

export const getEmailIconRegistry = () => {
  return readRegistry();
};

export const getIndexedDbEmailProviderIcons = () => {
  return { ...idbIconCache };
};

export const subscribeEmailIconUpdates = (callback: () => void) => {
  if (!isBrowser()) {
    return () => {};
  }
  const handler = () => callback();
  window.addEventListener(ICON_UPDATE_EVENT, handler);
  return () => window.removeEventListener(ICON_UPDATE_EVENT, handler);
};

export const hydrateEmailIconCache = async () => {
  if (!canUseIndexedDb()) return;
  try {
    const db = await openEmailIconDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(ICON_STORE_NAME, "readonly");
      const store = tx.objectStore(ICON_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const records = (request.result || []) as Array<{
          domain: string;
          blob: Blob;
        }>;
        updateIdbCache(records);
        resolve();
      };
      request.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
};

export const getEmailProviderIcon = (email: string): string | null => {
  const domain = normalizeDomain(email);
  if (!domain) return null;
  const registry = readRegistry();
  return (
    idbIconCache[domain] ??
    registry.custom[domain] ??
    registry.builtIn[domain] ??
    null
  );
};

export const setCustomEmailProviderIcons = (icons: EmailProviderIconMap) => {
  if (!isBrowser()) return;
  const registry = readRegistry();
  const custom = {
    ...registry.custom,
    ...normalizeIconMap(icons),
  };
  writeRegistry({
    version: STORAGE_VERSION,
    builtIn: DEFAULT_EMAIL_PROVIDER_ICONS,
    custom,
  });
  Object.keys(icons).forEach((key) => {
    const domain = normalizeDomain(key);
    if (domain) {
      void removeIdbIcon(domain);
    }
  });
  preloadEmailProviderIcons();
  notifyEmailIconUpdate();
};

export const setCustomEmailProviderIconFile = async (
  domainOrEmail: string,
  file: Blob,
) => {
  if (!canUseIndexedDb()) return;
  const domain = normalizeDomain(domainOrEmail);
  if (!domain) return;
  try {
    const db = await openEmailIconDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(ICON_STORE_NAME, "readwrite");
      tx.objectStore(ICON_STORE_NAME).put({ domain, blob: file });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    if (idbIconCache[domain]) {
      URL.revokeObjectURL(idbIconCache[domain]);
    }
    idbIconCache[domain] = URL.createObjectURL(file);
    const registry = readRegistry();
    if (registry.custom[domain]) {
      const rest = { ...registry.custom };
      delete rest[domain];
      writeRegistry({
        version: STORAGE_VERSION,
        builtIn: DEFAULT_EMAIL_PROVIDER_ICONS,
        custom: rest,
      });
    }
    preloadEmailProviderIcons();
    notifyEmailIconUpdate();
  } catch {
    // ignore
  }
};

export const removeCustomEmailProviderIcon = (domainOrEmail: string) => {
  if (!isBrowser()) return;
  const registry = readRegistry();
  const domain = normalizeDomain(domainOrEmail);
  if (!domain) return;
  const rest = { ...registry.custom };
  delete rest[domain];
  writeRegistry({
    version: STORAGE_VERSION,
    builtIn: DEFAULT_EMAIL_PROVIDER_ICONS,
    custom: rest,
  });
  void removeIdbIcon(domain);
  notifyEmailIconUpdate();
};

export const preloadEmailProviderIcons = () => {
  if (!isBrowser()) return;
  const registry = readRegistry();
  const urls = new Set([
    ...Object.values(registry.builtIn),
    ...Object.values(registry.custom),
    ...Object.values(idbIconCache),
  ]);
  urls.forEach((url) => {
    const image = new Image();
    image.src = url;
  });
};
