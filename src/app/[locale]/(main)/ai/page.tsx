import { redirect } from "next/navigation";

interface LegacyAiPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyAiPage({
  searchParams,
}: LegacyAiPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      continue;
    }

    if (value) {
      query.set(key, value);
    }
  }

  redirect(query.size > 0 ? `/intelligence?${query.toString()}` : "/intelligence");
}
