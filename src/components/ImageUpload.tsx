"use client";

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  onImageChange: (imageData: string | null) => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageChange, disabled }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setPreviewUrl(imageData);
      onImageChange(imageData);
    };
    reader.readAsDataURL(file);
  }, [onImageChange]);
  
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (!file) continue;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          setPreviewUrl(imageData);
          onImageChange(imageData);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, [onImageChange, disabled]);
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center"
      onPaste={handlePaste}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />
      
      {!previewUrl ? (
        <div>
          <button
            type="button"
            onClick={handleButtonClick}
            className="px-4 py-2 bg-blue-50 text-blue-500 rounded-md hover:bg-blue-100 mb-2 transition"
            disabled={disabled}
          >
            Upload Image
          </button>
          <p className="text-sm text-gray-500">or paste an image</p>
        </div>
      ) : (
        <div className="relative">
          <div className="relative w-full h-40 mb-2">
            <Image 
              src={previewUrl}
              alt="Uploaded image preview"
              fill
              style={{ objectFit: "contain" }}
              className="rounded-md"
            />
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="mt-2 px-3 py-1 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition text-sm"
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
