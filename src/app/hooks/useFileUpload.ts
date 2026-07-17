'use client';

import { useState } from 'react';
import { extractTextClientSide } from '@/utils/fileExtractor';

export function useFileUpload(onSuccess?: () => void) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  // -------------------------------------------------------
  // Upload — Client-side metin çıkarma + Signed URL yükleme
  // -------------------------------------------------------
  const handleUpload = async (e: React.FormEvent, categories: any[]) => {
    e.preventDefault();
    if (!uploadFile || !uploadName || !uploadCategory || !uploadDate) {
      alert('Lütfen tüm alanları doldurun:\n' +
        (!uploadName ? '• Dosya ismi eksik\n' : '') +
        (!uploadCategory ? '• Kategori seçilmedi\n' : '') +
        (!uploadDate ? '• Tarih girilmedi\n' : '') +
        (!uploadFile ? '• Dosya seçilmedi\n' : ''));
      return;
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (uploadFile.size > MAX_FILE_SIZE) {
      alert(`Dosya boyutu çok büyük. Maksimum 50MB yükleyebilirsiniz. (Seçilen dosya: ${(uploadFile.size / (1024 * 1024)).toFixed(2)}MB)`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Hazırlanıyor...');

    try {
      // Adım 1: İmzalı URL al + Metni browser'da çıkar (paralel)
      setUploadStatus('Bağlanıyor ve metin okunuyor... (Adım 1/3)');
      setUploadProgress(5);

      const [urlRes, extractionResult] = await Promise.all([
        fetch('/api/get-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: uploadFile.name, fileType: uploadFile.type }),
        }),
        extractTextClientSide(uploadFile),
      ]);

      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || 'URL alınamadı');
      const { signedUrl, storagePath, fileId } = urlData;

      const { text: extractedText, hasArabic } = extractionResult;

      console.log(`Client metin çıkarma: ${extractedText.length} karakter (Arapça: ${hasArabic})`);
      setUploadProgress(40);

      // Adım 2: Dosyayı Supabase'e yükle (Vercel bypass)
      setUploadStatus('Dosya yükleniyor... (Adım 2/3)');

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadFile.type || 'application/octet-stream' },
        body: uploadFile,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error('Dosya yüklenemedi: ' + errText);
      }

      setUploadProgress(70);
      setUploadStatus('Kayıt oluşturuluyor... (Adım 3/3)');

      // Adım 3: Metadata + çıkarılan metin gönder — sunucu hiç dosya indirmiyor
      const processRes = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          fileName: uploadFile.name,
          fileType: uploadFile.type,
          storagePath,
          name: uploadName,
          categoryId: uploadCategory,
          date: uploadDate,
          extractedText, // Browser'dan geliyor
        }),
      });

      const processData = await processRes.json();
      setUploadProgress(100);

      if (processData.success) {
        const textInfo = processData.extractedTextLength > 0
          ? `✅ ${processData.extractedTextLength} karakter okundu, ${processData.chunksCount} parçaya bölündü.`
          : '⚠️ Metin okunamadı, sadece dosya adıyla aranabilir.';
        alert('Dosya başarıyla yüklendi!\n' + textInfo);
        setIsUploadModalOpen(false);
        setUploadName(''); setUploadCategory(''); setUploadDate(''); setUploadFile(null);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert('İşlem hatası: ' + processData.error);
      }
    } catch (err: any) {
      console.error('Yükleme hatası:', err);
      alert('Yükleme sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  return {
    isUploadModalOpen, setIsUploadModalOpen,
    uploadName, setUploadName,
    uploadCategory, setUploadCategory,
    uploadDate, setUploadDate,
    uploadFile, setUploadFile,
    isUploading,
    uploadProgress,
    uploadStatus,
    handleUpload,
  };
}
