import React, { useEffect, useRef, useState } from "react";
import { ChatControlsProps } from "@/types/components";
import { useReply } from "@/contexts/ReplyContext";
import ReplyBar from "./ReplyBar";
import {
  UploadedFilesProvider,
  useUploadedFiles,
} from "@/contexts/UploadedFilesContext";
import UploadedImagesPreview from "./UploadedImagesPreview";
import { uploadImages, attachImagesToMessage } from "@/services/imageServices";

// Import refactored components
import {
  ChatInput,
  MediaButtons,
  ActionButtons,
  EmojiPickerContainer,
  GifPickerContainer,
} from "./index";

const ChatControlsContent: React.FC<ChatControlsProps> = ({
  input,
  setInput,
  onSend,
  sendTyping,
  isConnected = true,
  messages = [], // Recent messages for AI context
}) => {
  const { replyInfo, clearReply, shouldFocusInput, setShouldFocusInput } =
    useReply();
  const { uploadedFiles, clearFiles } = useUploadedFiles();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [currentSkinTone, setCurrentSkinTone] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const isSendingRef = useRef(false);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        showGifPicker &&
        gifPickerRef.current &&
        !gifPickerRef.current.contains(event.target as Node) &&
        gifButtonRef.current &&
        !gifButtonRef.current.contains(event.target as Node)
      ) {
        setShowGifPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker, showGifPicker]);
  // Focus input when reply is clicked
  useEffect(() => {
    if (shouldFocusInput && inputRef.current) {
      inputRef.current.focus();
      // Reset the flag after focusing
      setShouldFocusInput(false);
    }
  }, [shouldFocusInput, setShouldFocusInput]);

  const handleSend = async () => {
    // Prevent double sending with immediate guard
    if (isSendingRef.current) return;
    if (input.trim() === "" && uploadedFiles.length === 0) return;

    isSendingRef.current = true;
    setIsUploading(true);
    let finalMessage = input;

    try {
      // Check if there are uploaded files
      if (uploadedFiles.length > 0) {
        // Upload the images and get their URLs
        const imageUrls = await uploadImages(uploadedFiles);

        // Attach the image URLs to the message
        finalMessage = attachImagesToMessage(input, imageUrls);

        // Clear the uploaded files after sending
        clearFiles();
      }

      // Send the message with attached image URLs
      onSend(finalMessage);

      // Clear reply after sending
      clearReply();

      // Clear input field after sending
      setInput("");
    } catch (error) {
      console.error("Failed to send message with images:", error);
      // Handle upload error (show notification to user, etc.)
    } finally {
      setIsUploading(false);
      isSendingRef.current = false;
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: { native: string }) => {
    setInput(input + emoji.native);
    // Keep the picker open for multiple selections
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle skin tone change
  const handleSkinToneChange = (skin: number) => {
    setCurrentSkinTone(skin);
  };
  // Toggle emoji picker visibility
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowGifPicker(false); // Close GIF picker when opening emoji picker
  };

  // Toggle GIF picker visibility
  const toggleGifPicker = () => {
    setShowGifPicker(!showGifPicker);
    setShowEmojiPicker(false); // Close emoji picker when opening GIF picker
  };

  // Handle GIF selection
  const handleGifSelect = (gifUrl: string) => {
    const gifMarkdown = `[gif:${gifUrl}]`;
    setInput(input + (input ? " " : "") + gifMarkdown);
    setShowGifPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative order-2 px-2 sm:px-0 pb-5 md:order-1">
      <div className="rounded-3xl border-input bg-card/80 relative z-10 border p-0 pb-2 shadow-xs backdrop-blur-xl">
        {/* Show reply bar if replying to a message */}
        {replyInfo && <ReplyBar />}

        {/* Display uploaded images */}
        <UploadedImagesPreview />

        {/* Chat Input */}
        <ChatInput
          inputRef={inputRef}
          input={input}
          setInput={setInput}
          sendTyping={sendTyping}
          handleSend={handleSend}
        />

        <div className="flex items-center gap-2 mt-2 w-full justify-between px-2">
          {/* Media Buttons (File Upload, Emoji, GIF) */}
          <MediaButtons
            emojiButtonRef={emojiButtonRef}
            toggleEmojiPicker={toggleEmojiPicker}
            gifButtonRef={gifButtonRef}
            toggleGifPicker={toggleGifPicker}
          />{" "}
          <ActionButtons
            handleSend={handleSend}
            isInputEmpty={!input.trim() && uploadedFiles.length === 0}
            isConnected={isConnected}
            isLoading={isUploading}
          />
        </div>

        {/* Emoji Picker */}
        <EmojiPickerContainer
          pickerRef={pickerRef}
          showEmojiPicker={showEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
          currentSkinTone={currentSkinTone}
          onSkinToneChange={handleSkinToneChange}
        />

        {/* GIF Picker */}
        <GifPickerContainer
          pickerRef={gifPickerRef}
          showGifPicker={showGifPicker}
          onGifSelect={handleGifSelect}
        />
      </div>
    </div>
  );
};

const ChatControls: React.FC<ChatControlsProps> = (props) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-2xl">
      <UploadedFilesProvider>
        <ChatControlsContent {...props} />
      </UploadedFilesProvider>
    </div>
  );
};

export default ChatControls;
