import React, { useState } from "react";
import { MessageAttachment } from "@/types/chat";
import { X } from "lucide-react";

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
}

const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
}) => {
  const mediaAttachments = attachments.filter(
    (att) => att.type === "image" || att.type === "gif",
  );

  if (mediaAttachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {mediaAttachments.map((attachment, index) => (
        <MediaAttachment
          key={`${attachment.url}-${index}`}
          attachment={attachment}
        />
      ))}
    </div>
  );
};

interface MediaAttachmentProps {
  attachment: MessageAttachment;
}

const MediaAttachment: React.FC<MediaAttachmentProps> = ({ attachment }) => {
  const [showFullImage, setShowFullImage] = useState(false);

  const toggleFullImage = () => {
    setShowFullImage(!showFullImage);
  };

  return (
    <>
      <div
        className="relative cursor-pointer rounded-md overflow-hidden group"
        onClick={toggleFullImage}
      >
        <div className="relative h-20 w-20 overflow-hidden rounded-md">
          <img
            src={attachment.url}
            alt="Attached image"
            className="h-full w-full object-cover rounded-md"
          />
        </div>
      </div>

      {showFullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={toggleFullImage}
        >
          <div className="relative max-w-[90%] max-h-[90vh]">
            {/* Full image with Next.js Image */}
            <div
              className="relative"
              style={{
                width: "80vw",
                height: "80vh",
                maxWidth: "1200px",
                maxHeight: "800px",
              }}
            >
              {/* Controls */}
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                {/* Close button */}
                <button
                  className="p-1.5 rounded-full bg-gray-800/80 text-white hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullImage(false);
                  }}
                  title="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <img
                src={attachment.url}
                alt="Full size image"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageAttachments;
