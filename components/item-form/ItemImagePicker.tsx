'use client';

import React from 'react';
import Image from 'next/image';

interface ItemImagePickerProps {
  imageUrl: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  replaceLabel?: string;
}

export default function ItemImagePicker({
  imageUrl,
  onFileChange,
  onRemove,
  replaceLabel,
}: ItemImagePickerProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold item-modal-label">Item Photo</span>
        {imageUrl && replaceLabel && (
          <label className="text-[11px] font-medium item-modal-template-heading cursor-pointer">
            {replaceLabel}
            <input type="file" accept="image/*" onChange={onFileChange} className="sr-only" />
          </label>
        )}
      </div>

      {imageUrl ? (
        <div className="relative w-full h-36 rounded-xl overflow-hidden item-modal-input flex items-center justify-center group">
          <Image src={imageUrl} alt="Item" fill unoptimized className="object-contain" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 item-modal-danger-button text-xs px-2 py-1 rounded-lg transition cursor-pointer"
          >
            Remove Photo
          </button>
        </div>
      ) : (
        <label className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer item-modal-input transition group">
          <span className="text-2xl mb-1 group-hover:scale-110 transition">📷</span>
          <span className="text-xs item-modal-muted font-medium">Click to upload photo</span>
          <span className="text-[10px] item-modal-muted mt-0.5">PNG, JPG, WEBP up to 5MB</span>
          <input type="file" accept="image/*" onChange={onFileChange} className="sr-only" />
        </label>
      )}
    </div>
  );
}
