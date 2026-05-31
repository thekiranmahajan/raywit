"use client";

import React, { RefObject } from "react";
import GifPicker from "./GifPicker";

interface GifPickerContainerProps {
  pickerRef: RefObject<HTMLDivElement | null>;
  showGifPicker: boolean;
  onGifSelect: (gifUrl: string) => void;
}

const GifPickerContainer: React.FC<GifPickerContainerProps> = ({
  pickerRef,
  showGifPicker,
  onGifSelect,
}) => {
  if (!showGifPicker) return null;

  return (
    <div
      ref={pickerRef}
      className="fixed bottom-23 left-3 z-[150]"
      onClick={(e) => e.stopPropagation()}
    >
      <GifPicker onGifSelect={onGifSelect} />
    </div>
  );
};

export default GifPickerContainer;
