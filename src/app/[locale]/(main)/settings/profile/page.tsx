"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ProfileSettingsPage() {
  const [name, setName] = useState("Taylor Morgan");
  const [email, setEmail] = useState("taylor@acme.dev");
  const [title, setTitle] = useState("Product Manager");
  const [timezone, setTimezone] = useState("UTC+08:00");
  const [bio, setBio] = useState("Building configurable admin products.");
  const [mentions, setMentions] = useState(true);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold">Profile</h1>

        <Card className="border-app-border bg-app-content-bg">
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback>TM</AvatarFallback>
              </Avatar>
              <Button variant="outline">Change avatar</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={mentions}
                onCheckedChange={(checked) => setMentions(checked === true)}
              />
              <span>Receive mention notifications</span>
            </label>

            <Button onClick={() => toast.success("Profile settings saved.")}>Save profile</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
