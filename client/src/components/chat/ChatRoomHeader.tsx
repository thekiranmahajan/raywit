import React from "react";
import { Lock, Wifi, WifiOff, Trash2, User, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatState } from "@/hooks/useChatState";
import { ChatRoomHeaderProps } from "@/types/components";
import { getAuthToken } from "@/services/authService";
import { useRouter } from "next/navigation";

const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  roomId,
  isConnected,
  userCount,
}) => {
  const { deliveryWorking } = useChatState();
  const router = useRouter();

  const handleDeleteChat = async () => {
    const ok = confirm(
      "Delete all chat messages and images? This cannot be undone.",
    );
    if (!ok) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/chat/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete chat");
      // Redirect to login/home
      router.push("/");
    } catch (err) {
      console.error("Delete chat failed:", err);
      alert("Failed to delete chat. Check console for details.");
    }
  };
  return (
    <div className="flex w-full items-center justify-between py-4 backdrop-blur-md bg-background/80">
      <div className="flex-1 flex justify-center items-center gap-4">
        <div className="absolute left-4 top-4">
          {/* moved delete to trash icon next to lock for private chat */}
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            deliveryWorking ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-green-500 z-20 cursor-pointer">
                      <Wifi className="size-4 mr-1 text-green-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>Fully connected. Messages are being delivered.</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-orange-500 z-20 cursor-pointer">
                      <Wifi className="size-4 mr-1 text-orange-500 animate-pulse" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>
                      Connected, but message delivery may be delayed or not
                      working.
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-rose-500 z-20 cursor-pointer">
                    <WifiOff className="size-4 mr-1 text-rose-500 animate-pulse" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Establishing connection to chat</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {(() => {
            const isLoading = userCount === undefined;
            const PresenceIcon = userCount === 2 ? Users : User;

            return (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <PresenceIcon className="size-4" />
              </div>
            );
          })()}
          {/* Lock Icon with tooltip - private fixed chat */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center z-20 cursor-default">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Lock className="size-4" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>Private RayWit chat for Ray and Wit</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Trash (delete) and Lock icons for private chat */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDeleteChat}
                  className="flex items-center text-xs text-muted-foreground z-20 cursor-pointer"
                  aria-label="Delete chat"
                >
                  <Trash2 className="size-4 mr-2 text-rose-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Delete chat (all messages and images)</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomHeader;
