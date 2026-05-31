import React, { useState } from "react";
import { Reply, Copy, Check, Bot } from "lucide-react";

interface MessageActionsProps {
  isHovering: boolean;
  onReply: () => void;
  onCopy: () => void;
  message: string;
  className?: string;
}

/**
 * Reusable component for message action buttons (reply, copy)
 */
export const MessageActions: React.FC<MessageActionsProps> = ({
  isHovering,
  onReply,
  onCopy,
  message,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);

    // Call the parent's onCopy callback if provided
    if (onCopy) {
      onCopy();
    }
  };

  return (
    <div className={`flex space-x-1 group ${className}`}>
      {/* Reply button */}
      <button
        onClick={onReply}
        className={`${isHovering ? "opacity-100" : "opacity-0 group-hover:opacity-100"} 
          transition-opacity bg-zinc-100 hover:bg-zinc-200 rounded-full p-1 touch-manipulation
          dark:bg-zinc-800 dark:hover:bg-zinc-700`}
        title="Reply"
        aria-label="Reply to message"
      >
        <Reply className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
      </button>

      {/* Copy button */}
      <button
        onClick={handleCopyMessage}
        className={`${isHovering ? "opacity-100" : "opacity-0 group-hover:opacity-100"} 
                transition-opacity bg-zinc-100 hover:bg-zinc-200 rounded-full p-1 touch-manipulation
                dark:bg-zinc-800 dark:hover:bg-zinc-700`}
        title="Copy message"
        aria-label="Copy message"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
        )}
      </button>
    </div>
  );
};
