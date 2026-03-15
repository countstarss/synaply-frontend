"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/dashboard-kit";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  status: "Active" | "Invited";
}

const INITIAL_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Taylor Morgan",
    email: "taylor@acme.dev",
    role: "Owner",
    status: "Active",
  },
  {
    id: "2",
    name: "Jordan Lee",
    email: "jordan@acme.dev",
    role: "Admin",
    status: "Active",
  },
  {
    id: "3",
    name: "Cameron Kim",
    email: "cameron@acme.dev",
    role: "Viewer",
    status: "Invited",
  },
];

export default function MembersSettingsPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold">Members</h1>

        <Card className="border-app-border bg-app-content-bg">
          <CardHeader>
            <CardTitle className="text-base">Invite Member</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="new-member@company.com"
            />
            <Button
              onClick={() => {
                if (!inviteEmail.trim()) return;
                setMembers((prev) => [
                  ...prev,
                  {
                    id: String(Date.now()),
                    name: "Pending Invite",
                    email: inviteEmail.trim(),
                    role: "Viewer",
                    status: "Invited",
                  },
                ]);
                setInviteEmail("");
              }}
            >
              Send invite
            </Button>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-content-bg">
          <CardHeader>
            <CardTitle className="text-base">Member Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-t border-app-border/60">
                      <td className="px-2 py-3 font-medium">{member.name}</td>
                      <td className="px-2 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-2 py-3">
                        <Select
                          value={member.role}
                          onValueChange={(role) =>
                            setMembers((prev) =>
                              prev.map((item) =>
                                item.id === member.id
                                  ? {
                                      ...item,
                                      role: role as Member["role"],
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Owner">Owner</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Editor">Editor</SelectItem>
                            <SelectItem value="Viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-3">
                        <StatusPill status={member.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
