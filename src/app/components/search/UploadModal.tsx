'use client';

import { Upload, Loader2, X } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadName: string;
  setUploadName: (v: string) => void;
  uploadCategory: string;
  setUploadCategory: (v: string) => void;
  uploadDate: string;
  setUploadDate: (v: string) => void;
  setUploadFile: (f: File | null) => void;
  isUploading: boolean;
  uploadProgress: number;
  uploadStatus: string;
  onSubmit: (e: React.FormEvent) => void;
  categories: any[];
}

export default function UploadModal({
  isOpen, onClose,
  uploadName, setUploadName,
  uploadCategory, setUploadCategory,
  uploadDate, setUploadDate,
  setUploadFile,
  isUploading, uploadProgress, uploadStatus,
  onSubmit, categories,
}: UploadModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-3xl p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
          disabled={isUploading}
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-green-500 flex items-center gap-2">
          <Upload size={24} /> {t('search.upload.title')}
        </h2>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 px-1">{t('search.upload.fileName')} *</label>
            <input type="text" required className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors" placeholder={t('search.upload.namePlaceholder')} value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 px-1">{t('search.upload.category')} *</label>
            <select required className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
              <option value="">{t('search.upload.selectCategory')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 px-1">{t('search.upload.date')} *</label>
            <input type="date" required className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 px-1">{t('search.upload.fileSelect')} *</label>
            <input type="file" required onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="w-full bg-black/50 border border-green-900/50 rounded-2xl p-2 text-white file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-900/30 file:text-green-500 hover:file:bg-green-900/50 transition-colors cursor-pointer" />
          </div>
          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1 px-1">
                <span>{uploadStatus}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-2 border border-green-900/30">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          <button type="submit" disabled={isUploading} className="mt-6 bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg">
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : null}
            {isUploading ? uploadStatus || t('common.loading') : t('search.upload.title')}
          </button>
        </form>
      </div>
    </div>
  );
}
