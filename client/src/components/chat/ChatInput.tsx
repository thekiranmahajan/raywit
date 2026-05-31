// filepath: c:\Users\kdharmendra\Desktop\dostifyapp nextjs\dostifyapp\client\src\components\chat\ChatInput.tsx
import React, { RefObject, useState, useEffect } from "react";
import { useUploadedFiles } from "@/contexts/UploadedFilesContext";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  input: string;
  setInput: (value: string) => void;
  sendTyping?: (isTyping: boolean) => void;
  handleSend: () => void;
}

const TYPING_TIMEOUT_MS = 1500;

const ChatInput: React.FC<ChatInputProps> = ({
  inputRef,
  input,
  setInput,
  sendTyping,
  handleSend,
}) => {
  const { addFiles } = useUploadedFiles();
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Function to handle typing and sending typing status
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    // Send typing immediately
    if (newValue.length > 0) {
      sendTyping?.(true);
    } else {
      sendTyping?.(false);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping?.(false);
      typingTimeoutRef.current = null;
    }, TYPING_TIMEOUT_MS);
  };

  // Function to handle key presses in the input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      sendTyping?.(false);
      // Clear typing timeout on send
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  // Handle paste events to accept images from clipboard (including GIFs)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const dataUrlToFile = (dataUrl: string, filename: string): File => {
      const [header, base64] = dataUrl.split(",");
      const mime = header.match(/data:([^;]+);/)?.[1] || "image/gif";
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j += 1) {
        array[j] = binary.charCodeAt(j);
      }
      return new File([array], filename, { type: mime });
    };

    const extractGifFileFromHtml = async (
      html: string,
    ): Promise<File | null> => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const img = doc.querySelector("img");
      if (!img || !img.src) return null;
      const src = img.src;
      if (src.startsWith("data:image/gif")) {
        return dataUrlToFile(src, "pasted.gif");
      }

      const isGifLink = /\.gif(?:\?.*)?$/i.test(src);
      const gifUrl = isGifLink ? src : null;
      if (!gifUrl) return null;

      try {
        const response = await fetch(gifUrl);
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) return null;
        const urlParts = gifUrl.split("/");
        const filename =
          urlParts[urlParts.length - 1].split("?")[0] || "pasted.gif";
        return new File([blob], filename, { type: blob.type });
      } catch {
        return null;
      }
    };

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      const htmlPromises: Promise<File | null>[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }

        if (item.kind === "string" && item.type === "text/html") {
          htmlPromises.push(
            new Promise((resolve) => {
              item.getAsString(async (html) => {
                resolve(await extractGifFileFromHtml(html));
              });
            }),
          );
        }
      }

      const htmlFiles = (await Promise.all(htmlPromises)).filter(
        (file): file is File => file !== null,
      );

      if (htmlFiles.length > 0) {
        const gifFiles = htmlFiles.filter((file) => file.type === "image/gif");
        if (gifFiles.length > 0) {
          // Prefer pasted GIFs over the PNG fallback that some clipboards also provide
          const nonDuplicateFiles = files.filter(
            (file) => file.type !== "image/png",
          );
          files.splice(0, files.length, ...nonDuplicateFiles, ...gifFiles);
        } else {
          files.push(...htmlFiles);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    };

    el.addEventListener("paste", handlePaste as any);
    return () => el.removeEventListener("paste", handlePaste as any);
  }, [inputRef, addFiles]);

  return (
    <div className="relative w-full">
      <textarea
        ref={inputRef}
        className={cn(
          "border-input placeholder:text-muted-foreground placeholder:text-sm focus-visible:border-ring focus-visible:ring-ring/50",
          "flex rounded-md border px-3 py-2 pr-11 text-primary w-full resize-none border-none bg-transparent shadow-none outline-none",
          "focus-visible:ring-0 focus-visible:ring-offset-0 mt-2 ml-2 min-h-[44px] max-h-[150px] text-sm leading-[1.3]",
        )}
        rows={1}
        placeholder="Type your reply..."
        style={{ height: 44 }}
        value={input}
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default ChatInput;
