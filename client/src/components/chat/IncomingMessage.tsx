import { useReply } from "../../contexts/ReplyContext";
import { renderTextWithLinks } from "../../utils/textFormatUtils";
import { isSingleOrPairEmojiMessage } from "@/utils/emojiUtils";
import { MessageActions } from "./MessageActions";
import MessageAttachments from "./MessageAttachments";
import { ReplyPreview } from "./ReplyPreview";
import { extractAttachments } from "@/types/chat";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState, useRef } from "react";

interface IncomingMessageProps {
  message: string;
  timestamp: string;
  userName: string;
  messageId?: string;
  replyTo?: {
    message: string;
    sender?: string;
    messageId?: string;
  };
}

/**
 * Incoming message component for messages from other users
 */
export const IncomingMessage: React.FC<IncomingMessageProps> = ({
  message,
  timestamp,
  userName,
  messageId,
  replyTo,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Extract attachments and clean message text
  const { text: cleanMessage, attachments } = extractAttachments(message);
  const isEmojiOnly = cleanMessage
    ? isSingleOrPairEmojiMessage(cleanMessage)
    : false;

  const messageLength = cleanMessage?.length || 0;
  const isLongMessage = messageLength > 150;
  const messageRef = useRef<HTMLDivElement>(null);
  const { setReplyInfo, setShouldFocusInput } = useReply();

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    // If collapsing, scroll to the top of this message
    if (isExpanded && messageRef.current) {
      setTimeout(() => {
        messageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 10);
    }
  };

  const handleReply = () => {
    setReplyInfo({
      message,
      sender: userName,
      messageId,
    });
    // Set flag to focus the input after setting reply info
    setShouldFocusInput(true);
  };

  return (
    <div className="flex flex-col mb-2" ref={messageRef}>
      <div className="flex">
        <div className="w-6 h-6 rounded-full flex items-center justify-center mr-1 bg-zinc-800 dark:bg-zinc-700 relative">
          <span className="absolute inset-0 rounded-full border border-zinc-700 dark:border-zinc-600 pointer-events-none"></span>
          <User className="h-4 w-4 text-white dark:text-zinc-200 relative z-10" />
        </div>
        <div
          className="message-bubble flex max-w-xs rounded-[22px] border border-zinc-800 bg-black/50 p-3 shadow-sm text-sm text-white dark:border-zinc-700 dark:bg-black dark:text-white wrap-break-word whitespace-pre-line relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onTouchStart={() => setIsHovering(true)}
        >
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                {userName}
              </span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-400">
                {timestamp}
              </span>
            </div>

            {/* Show reply preview if this message is a reply */}
            {replyTo && (
              <ReplyPreview
                message={replyTo.message}
                sender={replyTo.sender}
                messageId={replyTo.messageId}
              />
            )}

            {/* Message content - now with link support for collapsed view too */}
            {cleanMessage && (
              <p
                className={`wrap-break-word whitespace-pre-line w-full ${
                  isEmojiOnly
                    ? "text-4xl leading-[1.05] tracking-[-0.03em]"
                    : "text-sm"
                }`}
              >
                {isLongMessage && !isExpanded ? (
                  <>
                    {renderTextWithLinks(cleanMessage.substring(0, 150))}
                    <span>...</span>
                  </>
                ) : (
                  renderTextWithLinks(cleanMessage)
                )}
              </p>
            )}

            {/* Display image attachments */}
            {attachments.length > 0 && (
              <MessageAttachments attachments={attachments} />
            )}

            {isLongMessage && (
              <button
                onClick={handleToggle}
                className="text-[10px] text-white mt-1 hover:text-zinc-300 flex items-center font-semibold"
              >
                {isExpanded ? (
                  <>
                    Less <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons now completely below bubble */}
      <MessageActions
        isHovering={isHovering}
        onReply={handleReply}
        onCopy={() => {}}
        message={message}
        className="ml-7 mt-1"
      />
    </div>
  );
};
