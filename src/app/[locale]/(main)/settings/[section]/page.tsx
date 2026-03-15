import { notFound } from "next/navigation";
import {
  SettingsSectionDetail,
  type SettingsSectionKey,
} from "@/components/settings/SettingsSectionDetail";

const SECTION_TITLES: Record<SettingsSectionKey, string> = {
  notifications: "Notifications",
  appearance: "Appearance",
  security: "Security",
  integrations: "Integrations",
  billing: "Billing",
  support: "Help Center",
};

export default async function GenericSettingsSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sectionKey = section as SettingsSectionKey;
  const title = SECTION_TITLES[sectionKey];

  if (!title) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <SettingsSectionDetail section={sectionKey} title={title} />
      </div>
    </div>
  );
}
