import React, { useRef } from 'react';
import { Image as ImageIcon, X, Paperclip } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MultimodalAttachmentProps {
  imagePreview: string | null;
  onImageSelected: (base64: string | null) => void;
  disabled?: boolean;
}

export const MultimodalAttachment: React.FC<MultimodalAttachmentProps> = ({
  imagePreview,
  onImageSelected,
  disabled = false
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }

    // Limit to 4MB for fast latency and clean processing
    if (file.size > 4 * 1024 * 1024) {
      alert('Image size should be under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers event
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        disabled={disabled}
      />

      {imagePreview ? (
        <div className="relative inline-block mt-2">
          <div className="relative rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-sm max-w-[120px] max-h-[100px] group">
            <img
              src={imagePreview}
              alt="Attached reflection visual"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1 rounded-full bg-stone-900/80 text-white hover:bg-rose-600 transition-colors shadow-xs cursor-pointer"
              title="Remove attached image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 block">
            Visual journal entry
          </span>
        </div>
      ) : (
        <button
          type="button"
          id="attach-image-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
          title={t('attachImage')}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
