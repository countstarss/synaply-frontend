import { existsSync, readdirSync, statSync } from "fs";
import { join, relative, sep } from "path";

type MessageValue = string | number | boolean | null | MessageTree | MessageValue[];
type MessageTree = Record<string, MessageValue>;

function isPlainObject(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeMessages(base: MessageTree, override: MessageTree) {
  const merged: MessageTree = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];

    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = deepMergeMessages(current, value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

function getJsonFiles(locale: string) {
  const localeDir = join(process.cwd(), "src", "i18n", "messages", locale);

  if (!existsSync(localeDir)) {
    return [];
  }

  const discovered: string[] = [];

  const visit = (currentDir: string) => {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = join(currentDir, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        visit(fullPath);
        continue;
      }

      if (entry.endsWith(".json")) {
        discovered.push(relative(localeDir, fullPath).split(sep).join("/"));
      }
    }
  };

  visit(localeDir);

  return discovered.sort();
}

function setNestedMessage(
  target: MessageTree,
  relativeFilePath: string,
  value: MessageTree,
) {
  const segments = relativeFilePath.replace(/\.json$/, "").split("/");
  let cursor = target;

  for (const segment of segments.slice(0, -1)) {
    if (!isPlainObject(cursor[segment])) {
      cursor[segment] = {};
    }

    cursor = cursor[segment] as MessageTree;
  }

  const leafKey = segments[segments.length - 1];
  const existingLeaf = cursor[leafKey];

  cursor[leafKey] =
    isPlainObject(existingLeaf) && isPlainObject(value)
      ? deepMergeMessages(existingLeaf, value)
      : value;
}

async function loadLocaleMessages(locale: string) {
  const messages: MessageTree = {};

  for (const file of getJsonFiles(locale)) {
    const moduleMessages = await import(`./messages/${locale}/${file}`);
    setNestedMessage(messages, file, moduleMessages.default as MessageTree);
  }

  return messages;
}

export async function mergeMessages(locale: string) {
  try {
    const baseLocale = "en";
    const baseMessages = await loadLocaleMessages(baseLocale);

    if (locale === baseLocale) {
      return baseMessages;
    }

    const localeMessages = await loadLocaleMessages(locale);
    return deepMergeMessages(baseMessages, localeMessages);
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    throw error;
  }
}
