"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  getEmailIconRegistry,
  getIndexedDbEmailProviderIcons,
  hydrateEmailIconCache,
  removeCustomEmailProviderIcon,
  setCustomEmailProviderIconFile,
  setCustomEmailProviderIcons,
} from "../config/email-icon-registry";

interface MailIconSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type IconEntry = {
  domain: string;
  url: string;
  source: "file" | "url";
};

export function MailIconSettingsDialog({
  open,
  onOpenChange,
}: MailIconSettingsDialogProps) {
  const [domain, setDomain] = React.useState("");
  const [iconUrl, setIconUrl] = React.useState("");
  const [iconFile, setIconFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState("");
  const [iconEntries, setIconEntries] = React.useState<IconEntry[]>([]);

  const refreshIcons = React.useCallback(async () => {
    await hydrateEmailIconCache();
    const registry = getEmailIconRegistry();
    const fileIcons = getIndexedDbEmailProviderIcons();
    const entries: IconEntry[] = [
      ...Object.entries(fileIcons).map(([domain, url]) => ({
        domain,
        url,
        source: "file" as const,
      })),
      ...Object.entries(registry.custom).map(([domain, url]) => ({
        domain,
        url,
        source: "url" as const,
      })),
    ].sort((a, b) => a.domain.localeCompare(b.domain));
    setIconEntries(entries);
  }, []);

  React.useEffect(() => {
    if (open) {
      void refreshIcons();
    }
  }, [open, refreshIcons]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedDomain = domain.trim();
    if (!trimmedDomain) {
      setError("请输入邮箱后缀（例如 gmail.com）");
      return;
    }
    if (iconFile) {
      await setCustomEmailProviderIconFile(trimmedDomain, iconFile);
    } else if (iconUrl.trim()) {
      setCustomEmailProviderIcons({
        [trimmedDomain]: iconUrl.trim(),
      });
    } else {
      setError("请提供图标 URL 或上传图片文件");
      return;
    }

    setDomain("");
    setIconUrl("");
    setIconFile(null);
    setError("");
    await refreshIcons();
  };

  const handleRemove = async (domainToRemove: string) => {
    removeCustomEmailProviderIcon(domainToRemove);
    await refreshIcons();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>邮箱服务商图标</DialogTitle>
          <DialogDescription>
            自定义规则会优先于内置规则，用于覆盖服务商图标。
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSave}>
          <div className="grid gap-2">
            <Label htmlFor="mail-icon-domain">邮箱后缀</Label>
            <Input
              id="mail-icon-domain"
              placeholder="例如 gmail.com"
              value={domain}
              onChange={(event) => {
                setDomain(event.target.value);
                setError("");
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mail-icon-url">图标 URL</Label>
            <Input
              id="mail-icon-url"
              placeholder="https://example.com/icon.png"
              value={iconUrl}
              onChange={(event) => {
                setIconUrl(event.target.value);
                setIconFile(null);
                setError("");
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mail-icon-file">上传图标（本地）</Label>
            <Input
              id="mail-icon-file"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setIconFile(file);
                if (file) {
                  setIconUrl("");
                }
                setError("");
              }}
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>

        <Separator />

        <div className="grid gap-3">
          <div className="text-sm font-medium">已配置的自定义图标</div>
          {iconEntries.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无自定义配置</div>
          ) : (
            <div className="grid gap-2">
              {iconEntries.map((entry) => (
                <div
                  key={entry.domain}
                  className="flex items-center gap-3 rounded-md border p-2"
                >
                  <img
                    src={entry.url}
                    alt={entry.domain}
                    className="h-6 w-6 rounded-sm"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{entry.domain}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.source === "file" ? "本地文件" : entry.url}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(entry.domain)}
                  >
                    移除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
