"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/strore";
import { useRouter } from "next/navigation";

import ChatFeed from "@/components/chat/ChatFeed";
import ChatRoomHeader from "@/components/chat/ChatRoomHeader";
import ChatControls from "@/components/chat/ChatControls";
import TypingIndicator from "@/components/ui/TypingIndicator";
import { ReplyProvider, useReply } from "@/contexts/ReplyContext";
import { useSocket } from "@/hooks/useSocket";
import { useSocketNotificationSound } from "@/hooks/useSocketNotificationSound";
import { getAuthToken } from "@/services/authService";
import Loading from "@/app/loading";

const FIXED_ROOM_ID = "raywit";

// Internal component that uses the ReplyContext
const ChatRoom = () => {
  const userName =
    useSelector((state: RootState) => state.user.userName) || "User";
  const router = useRouter();
  const { replyInfo, clearReply } = useReply();

  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    userId,
    sendMessage,
    sendTyping,
    usersTyping,
    users,
    isConnected,
    messages,
  } = useSocket(FIXED_ROOM_ID, userName);

  useSocketNotificationSound(messages, userId);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/");
      return;
    }

    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [router]);

  const showTypingIndicator = useMemo(() => {
    return usersTyping.length > 0 && !usersTyping.includes(userId);
  }, [usersTyping, userId]);

  const handleSendWithReply = (content?: string) => {
    if (!content || content.trim() === "") return;

    const replyData = replyInfo
      ? {
          message: replyInfo.message,
          sender: replyInfo.sender,
          messageId: replyInfo.messageId,
        }
      : undefined;

    sendMessage(content, userId, replyData);
    clearReply();
    setInput("");
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-screen w-full items-center">
      <div className="flex flex-col h-full w-full max-w-2xl">
        <div className="fixed inset-x-0 top-0 z-10 mb-30 mx-auto w-full max-w-2xl">
          <ChatRoomHeader
            roomId={FIXED_ROOM_ID}
            isConnected={isConnected}
            userCount={users.length}
          />
        </div>
        <div className="flex-1 overflow-y-auto mb-32 pb-11 mt-15 py-4">
          <ChatFeed messages={messages} messagesEndRef={messagesEndRef} />
        </div>

        <div className="fixed inset-x-0 bottom-0 mb-30 mx-auto w-full max-w-2xl">
          {showTypingIndicator && (
            <div className="mb-2 px-4 animate-fade-in transition-all duration-300 ease-in-out">
              <TypingIndicator typingUsers={usersTyping} />
            </div>
          )}
          <ChatControls
            input={input}
            setInput={setInput}
            onSend={handleSendWithReply}
            sendTyping={sendTyping}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  );
};

// Main page component that provides ReplyContext
const Page = () => {
  return (
    <ReplyProvider>
      <ChatRoom />
    </ReplyProvider>
  );
};

export default Page;
