'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';

// -------------------------------------------------------
// Yardımcı: native Web Speech API başlat
// -------------------------------------------------------
function createSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) return null;
  return new SpeechRecognitionAPI();
}

interface UseSpeechRecognitionOptions {
  onTranscriptChange: (text: string) => void;
  onSearch: (text: string) => void;
  speechLang?: string;
}

export function useSpeechRecognition({ onTranscriptChange, onSearch, speechLang }: UseSpeechRecognitionOptions) {
  const { t, language } = useTranslation();
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState('');

  // IDE Simülasyon Modalı State
  const [isSimulatingMic, setIsSimulatingMic] = useState(false);
  const [simulatedQuery, setSimulatedQuery] = useState('');

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentTranscriptRef = useRef('');
  const shouldRestartRef = useRef(false);
  const networkRetryCount = useRef(0);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedFinalRef = useRef('');

  // Tarayıcı desteği kontrolü
  useEffect(() => {
    const supported = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
    setMicSupported(supported);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // -------------------------------------------------------
  // Mikrofon başlat — native Web Speech API
  // -------------------------------------------------------
  const startListening = useCallback((isRestart = false) => {
    if (!isRestart) {
      setMicError('');
      networkRetryCount.current = 0;
      accumulatedFinalRef.current = '';
    }

    // Dil değiştiğinde veya yeni oturum başladığında biriken metni sıfırla
    currentTranscriptRef.current = '';

    // Eğer zaten aktif bir dinleme varsa önce durdur
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) {
      setMicSupported(false);
      return;
    }

    // Dil seçimi eşleştirmesi
    const langMap: Record<string, string> = {
      'tr': 'tr-TR',
      'en': 'en-US',
      'ar': 'ar-SA'
    };
    const activeLang = speechLang || language;
    recognition.lang = langMap[activeLang] || 'tr-TR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      if (!isRestart) {
        onTranscriptChange('');
      }
    };

    // Her ses tanıma sonucunda çalışır — kesinleşmiş ve geçici sonuçlar ayrıştırılır
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      networkRetryCount.current = 0; // Ses algılandı, sayacı sıfırla
      let finalText = '';
      let interimText = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Kesinleşmiş sonuçlar arasına boşluk ekle
          if (finalText && !finalText.endsWith(' ') && !transcript.startsWith(' ')) {
            finalText += ' ';
          }
          finalText += transcript;
        } else {
          // Geçici sonuçlar arasına boşluk ekle
          if (interimText && !interimText.endsWith(' ') && !transcript.startsWith(' ')) {
            interimText += ' ';
          }
          interimText += transcript;
        }
      }

      // Kesinleşmiş metni birikmiş metne ekle
      if (finalText) {
        const prev = accumulatedFinalRef.current;
        accumulatedFinalRef.current = prev
          ? prev + (prev.endsWith(' ') ? '' : ' ') + finalText
          : finalText;
      }

      // Kesinleşmiş + geçici metni birleştir
      const combined = accumulatedFinalRef.current +
        (accumulatedFinalRef.current && interimText ? ' ' : '') + interimText;

      currentTranscriptRef.current = combined;
      onTranscriptChange(combined);

      // CANLI ARAMA: Kullanıcı konuşurken anında aramayı tetikle
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        if (combined.trim()) {
          onSearch(combined);
        }
      }, 400);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'network') {
        // Normal Chrome'da anlık kopma olabiliyor, 3 kez sessizce yeniden dene
        if (networkRetryCount.current < 3 && shouldRestartRef.current) {
          networkRetryCount.current++;
          return; // onend tetiklenecek ve oradan 500ms sonra restart yapacağız
        }

        // 3 denemede de bağlanamadıysa simülasyon modalını aç
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
        const msg = t('search.errors.networkError').replace('{origin}', currentOrigin);
        shouldRestartRef.current = false;
        setIsSimulatingMic(true);
        setMicError(msg);
        setListening(false);
        recognitionRef.current = null;
        return;
      }

      if (event.error === 'aborted' || event.error === 'no-speech') {
        // Kullanıcı durdurdu veya sessizlik oldu
        if (!shouldRestartRef.current) {
          setListening(false);
          recognitionRef.current = null;
        }
        return;
      }

      let msg = t('search.errors.micError');
      if (event.error === 'not-allowed') {
        msg = t('search.errors.micDenied');
        shouldRestartRef.current = false;
      } else if (event.error === 'audio-capture') {
        msg = t('search.errors.micNotFound');
        shouldRestartRef.current = false;
      }
      setMicError(msg);
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);

      // Network hatası alındıysa ve henüz 3 deneme dolmadıysa yeniden başlat
      if (networkRetryCount.current > 0 && networkRetryCount.current <= 3 && shouldRestartRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current) {
            startListening(true);
          }
        }, 500);
        return;
      }

      // Kullanıcı manuel olarak durdurmadıysa, sessizlikten dolayı kapandıysa otomatik yeniden başlat
      if (shouldRestartRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current) {
            startListening(true);
          }
        }, 300);
        return;
      }

      // Mikrofon kapandığında biriken en son transcript ile arama yap (Garanti tetikleme)
      const finalQuery = currentTranscriptRef.current.trim();
      if (finalQuery) {
        onSearch(finalQuery);
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;
    recognition.start();
  }, [onTranscriptChange, onSearch, speechLang, language, t]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    setListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const toggleListen = useCallback(() => {
    setMicError(''); // Butona basıldığı anda eski hata mesajlarını tamamen temizle
    if (listening || recognitionRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);

  return {
    listening,
    micSupported,
    micError,
    isSimulatingMic,
    setIsSimulatingMic,
    simulatedQuery,
    setSimulatedQuery,
    toggleListen,
    startListening,
    stopListening,
    networkRetryCount,
  };
}
