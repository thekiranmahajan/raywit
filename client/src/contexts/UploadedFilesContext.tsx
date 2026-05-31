import React, { createContext, useContext, useState, ReactNode } from "react";

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface UploadedFilesContextType {
  uploadedFiles: UploadedFile[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
}

const UploadedFilesContext = createContext<
  UploadedFilesContextType | undefined
>(undefined);

export const UploadedFilesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const addFiles = (files: File[]) => {
    // Process files: compress images (except GIFs) for medium size previews/uploads
    const processFile = async (file: File) => {
      if (!file.type.startsWith("image/")) return null;

      // Skip compression for GIFs to preserve animation
      if (file.type === "image/gif") {
        return file;
      }

      // Use canvas to resize/compress images to max width of 1024px
      try {
        const imageBitmap = await createImageBitmap(file);
        const maxWidth = 1024;
        const scale = Math.min(1, maxWidth / imageBitmap.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imageBitmap.width * scale);
        canvas.height = Math.round(imageBitmap.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

        // Convert to blob with reasonable quality
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.75),
        );

        const compressedFile = new File([blob], file.name, {
          type: "image/jpeg",
        });
        return compressedFile;
      } catch (err) {
        // If any error, fall back to original file
        return file;
      }
    };

    (async () => {
      const fileArr = Array.from(files);
      const processed = await Promise.all(fileArr.map(processFile));
      const valid = processed.filter((f): f is File => f !== null);
      const newFiles = valid.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
    })();
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      // Find and revoke object URL to prevent memory leaks
      const fileToRemove = prev.find((file) => file.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }

      return prev.filter((file) => file.id !== id);
    });
  };

  const clearFiles = () => {
    // Revoke all object URLs to prevent memory leaks
    uploadedFiles.forEach((file) => {
      URL.revokeObjectURL(file.previewUrl);
    });
    setUploadedFiles([]);
  };
  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        URL.revokeObjectURL(file.previewUrl);
      });
    };
  }, [uploadedFiles]);

  return (
    <UploadedFilesContext.Provider
      value={{ uploadedFiles, addFiles, removeFile, clearFiles }}
    >
      {children}
    </UploadedFilesContext.Provider>
  );
};

export const useUploadedFiles = () => {
  const context = useContext(UploadedFilesContext);
  if (context === undefined) {
    throw new Error(
      "useUploadedFiles must be used within a UploadedFilesProvider",
    );
  }
  return context;
};
