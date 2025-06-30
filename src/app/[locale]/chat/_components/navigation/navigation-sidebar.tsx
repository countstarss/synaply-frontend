"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Home, Plus, Settings } from "lucide-react";
import { NavigationItem } from "./navigation-item";
import Image from "next/image";

const servers = [
  { id: "1", name: "General", imageUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=64&h=64&fit=crop&auto=format" },
  { id: "2", name: "Gaming", imageUrl: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=64&h=64&fit=crop&auto=format" },
  { id: "3", name: "Music", imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=64&h=64&fit=crop&auto=format" },
];

export function NavigationSidebar() {
  return (
    <div className="space-y-4 flex flex-col items-center h-[calc(100vh-80px)] text-primary w-full bg-[#1E1F22] py-3">
      <NavigationItem>
        <Button variant="ghost" className="p-2 h-12 w-12">
          <Home className="h-7 w-7" />
        </Button>
      </NavigationItem>
      <Separator className="h-[2px] bg-zinc-700 rounded-md w-10 mx-auto" />
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) => (
          <div key={server.id} className="mb-4">
            <NavigationItem>
              <Button variant="ghost" className="p-2 h-12 w-12 relative">
                <Image
                  src={server.imageUrl}
                  alt={server.name}
                  className="rounded-full object-cover"
                  width={48}
                  height={48}
                />
              </Button>
            </NavigationItem>
          </div>
        ))}
      </ScrollArea>
      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <NavigationItem>
          <Button variant="ghost" className="p-2 h-12 w-12">
            <Plus className="h-7 w-7" />
          </Button>
        </NavigationItem>
        <NavigationItem>
          <Button variant="ghost" className="p-2 h-12 w-12">
            <Settings className="h-7 w-7" />
          </Button>
        </NavigationItem>
      </div>
    </div>
  );
}