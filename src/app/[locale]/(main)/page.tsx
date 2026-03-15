"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useDashboardPreferencesStore } from "@/stores/dashboard-preferences";

export default function MainPage() {
  const router = useRouter();
  const landingModule = useDashboardPreferencesStore((state) => state.landingModule);

  useEffect(() => {
    router.replace(`/${landingModule}`);
  }, [landingModule, router]);

  return null;
}
