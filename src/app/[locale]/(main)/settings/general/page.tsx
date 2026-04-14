import { getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import SettingsScrollPage from "@/components/settings/SettingsScrollPage";
import SettingsPlaceholderSection from "@/components/settings/sections/SettingsPlaceholderSection";
import ProfileSettingsSection from "@/components/settings/sections/ProfileSettingsSection";
import AppearanceSettingsSection from "@/components/settings/sections/AppearanceSettingsSection";

export default async function GeneralSettingsPage() {
  const tSettings = await getTranslations("settings");

  return (
    <SettingsScrollPage
      title={tSettings("general.pageTitle")}
      // sectionGroupLabel="Settings"
      description={tSettings("general.description")}
      sections={[
        {
          id: "profile",
          label: tSettings("general.sections.profile.label"),
          description: tSettings("general.sections.profile.description"),
          content: <ProfileSettingsSection />,
        },
        {
          id: "notifications",
          label: tSettings("general.sections.notifications.label"),
          description: tSettings("general.sections.notifications.description"),
          content: (
            <SettingsPlaceholderSection
              title={tSettings("general.sections.notifications.label")}
              description={tSettings(
                "general.sections.notifications.placeholderDescription",
              )}
              icon={Bell}
              highlights={[
                tSettings("general.sections.notifications.highlights.digestFrequency"),
                tSettings("general.sections.notifications.highlights.reminders"),
                tSettings("general.sections.notifications.highlights.bridges"),
                tSettings("general.sections.notifications.highlights.quietHours"),
              ]}
            />
          ),
        },
        {
          id: "appearance",
          label: tSettings("general.sections.appearance.label"),
          description: tSettings("general.sections.appearance.description"),
          content: <AppearanceSettingsSection />,
        },
      ]}
    />
  );
}
