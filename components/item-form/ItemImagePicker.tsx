'use client';

import React from 'react';

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
        <label className="text-xs font-semibold text-slate-300">Item Photo</label>
        {imageUrl && replaceLabel && (
          <label className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer">
            {replaceLabel}
            <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          </label>
        )}
      </div>

      {imageUrl ? (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group">
          <img src={imageUrl} alt="Item" className="h-full w-full object-contain" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg transition cursor-pointer"
          >
            Remove Photo
          </button>
        </div>
      ) : (
        <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition group">
          <span className="text-2xl mb-1 group-hover:scale-110 transition">📷</span>
          <span className="text-xs text-slate-400 font-medium">Click to upload photo</span>
          <span className="text-[10px] text-slate-600 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
          <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        </label>
      )}
    </div>
  );
}
