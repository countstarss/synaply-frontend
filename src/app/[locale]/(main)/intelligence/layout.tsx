import type { ReactNode } from "react";
import { AiWorkbenchPage } from "@/components/ai/workbench/AiWorkbenchPage";

interface AiLayoutProps {
  children: ReactNode;
}

export default function AiLayout({ children }: AiLayoutProps) {
  return (
    <>
      <AiWorkbenchPage />
      {children}
    </>
  );
}
