import { useReply } from "../../contexts/ReplyContext";
import { renderTextWithLinks } from "../../utils/textFormatUtils";
import { isSingleOrPairEmojiMessage } from "@/utils/emojiUtils";
import { MessageActions } from "./MessageActions";
import MessageAttachments from "./MessageAttachments";
import { ReplyPreview } from "./ReplyPreview";
import { extractAttachments } from "@/types/chat";
import { User, ChevronDown, ChevronUp, Clock, Check } from "lucide-react";
import React, { useState, useRef } from "react";

interface OutgoingMessageProps {
  message: string;
  timestamp: string;
  messageId?: string;
  deliveryStatus?: "pending" | "sent" | "delivered";
  replyTo?: {
    message: string;
    sender?: string;
    messageId?: string;
  };
}

/**
 * Outgoing message component for messages sent by the current user
 */
export const OutgoingMessage: React.FC<OutgoingMessageProps> = ({
  message,
  timestamp,
  messageId,
  deliveryStatus = "pending",
  replyTo,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Extract attachments and clean message text
  const { text: cleanMessage, attachments } = extractAttachments(message);
  const isEmojiOnly = cleanMessage
    ? isSingleOrPairEmojiMessage(cleanMessage)
    : false;

  const messageLength = cleanMessage.length;
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
      message: message, // Use the original message with image attachments
      sender: "You",
      messageId,
    });
    // Set flag to focus the input after setting reply info
    setShouldFocusInput(true);
  };

  return (
    <div className="flex flex-col items-end mb-2" ref={messageRef}>
      <div className="flex justify-end">
        <div className="flex justify-end">
          <div
            className="message-bubble flex max-w-xs rounded-[22px] border border-zinc-800 bg-black p-3 shadow-sm text-sm text-white wrap-break-word whitespace-pre-line relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onTouchStart={() => setIsHovering(true)}
          >
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  You
                </span>
                <span className="text-[9px] text-white/60">{timestamp}</span>
              </div>

              {/* Show reply preview if this message is a reply */}
              {replyTo && (
                <ReplyPreview
                  message={replyTo.message}
                  sender={replyTo.sender}
                  messageId={replyTo.messageId}
                />
              )}

              {cleanMessage && (
                <p
                  className={`wrap-break-word whitespace-pre-line w-full ${
                    isEmojiOnly
                      ? "text-4xl leading-[1.05] tracking-[-0.03em]"
                      : "text-sm text-white/90"
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
                  className="text-[10px] text-white/50 mt-1 hover:text-white/70 flex items-center font-semibold"
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

              <div className="flex items-center gap-1 text-white/50 ">
                {deliveryStatus === "pending" && (
                  <Clock
                    className="w-3 h-3 animate-spin"
                    aria-label="Sending"
                    role="img"
                  />
                )}
                {deliveryStatus === "sent" && (
                  <Check
                    className="w-3 h-3"
                    aria-label="Sent to server"
                    role="img"
                    strokeWidth={3}
                  />
                )}
                {deliveryStatus === "delivered" && (
                  <span className="flex items-center gap-0.5">
                    <Check
                      className="w-3 h-3"
                      aria-label="Delivered to recipient"
                      role="img"
                      strokeWidth={3}
                    />
                    <Check
                      className="w-3 h-3"
                      aria-label="Delivered to recipient"
                      role="img"
                      strokeWidth={3}
                    />
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center ml-1 bg-zinc-800 dark:bg-zinc-700 relative">
            <span className="absolute inset-0 rounded-full border border-zinc-700 dark:border-zinc-600 pointer-events-none"></span>
            <User className="h-4 w-4 text-white dark:text-zinc-400 relative" />
          </div>
        </div>
      </div>

      <MessageActions
        isHovering={isHovering}
        onReply={handleReply}
        onCopy={() => {}}
        message={message}
        className="mt-0.5 mr-7 justify-end"
      />
    </div>
  );
};
