"use client";

import { useParams } from "next/navigation";
import { SupabaseChatRoom } from "../_components/chat/supabase-chat-room";
import { useLiveQuery } from "dexie-react-hooks";
import { useLocalDb } from "@/providers/local-db-provider";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Spinner } from "@/components/Spinner";

export default function SupabaseChatPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const localDb = useLocalDb();
  const supabase = createClientComponentClient();

  // Use localDb to get chat details
  const localChat = useLiveQuery(
    () => localDb.chats.get(chatId),
    [chatId, localDb]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [chatName, setChatName] = useState("Loading Chat...");
  const [chatType, setChatType] = useState<"private" | "group">("group"); // Default to group

  useEffect(() => {
    const fetchChatDetails = async () => {
      setIsLoading(true);
      if (localChat) {
        setChatName(localChat.name || "Private Chat");
        setChatType(localChat.type);
        setIsLoading(false);
        return;
      }

      // If not in local DB, try fetching from Supabase
      try {
        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .eq("id", chatId)
          .single();

        if (error) {
          console.error("Error fetching chat details from Supabase:", error);
          // Handle error, maybe redirect or show an error message
          setChatName("Chat Not Found");
          setIsLoading(false);
          return;
        }

        if (data) {
          const chatType = data.type as "private" | "group";
          const name = chatType === "group" ? data.name : "Private Chat"; // Placeholder for private chat name
          setChatName(name || "Unknown Chat");
          setChatType(chatType);

          // Cache in local DB
          await localDb.chats.put({
            id: data.id,
            type: chatType,
            name: data.name,
            participants: data.participants || [], // Assuming participants field exists in Supabase chats table
            lastMessageContent: data.last_message_content,
            lastMessageAt: data.last_message_at
              ? new Date(data.last_message_at).getTime()
              : undefined,
          });
        }
      } catch (err) {
        console.error("Error fetching chat details:", err);
        setChatName("Error Loading Chat");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatDetails();
  }, [chatId, localChat, localDb, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-74px)]">
      <SupabaseChatRoom chatId={chatId} type={chatType} chatName={chatName} />
    </div>
  );
}
