'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'Uygulamaları indirmek ücretsiz mi?',
      answer: 'Evet, abbeslim. Life OS masaüstü ve mobil uygulamaları tamamen ücretsizdir.',
    },
    {
      question: 'Uygulamalar otomatik güncellenecek mi?',
      answer: 'Windows masaüstü uygulamamız dahili güncelleyiciye sahiptir. Yeni bir sürüm yayınlandığında uygulama açılışında otomatik güncelleme uyarısı alacaksınız.',
    },
    {
      question: 'Verilerim cihazlarım arasında senkronize ediliyor mu?',
      answer: 'Evet! Hesabınıza giriş yaptığınızda notlarınız, görevleriniz ve ayarlarınız Supabase veritabanı üzerinden tüm cihazlarınız arasında anında senkronize edilir.',
    },
    {
      question: 'Android APK kurulumu sırasında güvenlik uyarısı alırsam ne yapmalıyım?',
      answer: 'Google Play Store dışından APK yüklerken Android varsayılan olarak bir uyarı gösterir. Uygulamamız tamamen virüssüzdür ve güvenlidir. Ayarlardan "Yine de yükle" diyerek devam edebilirsiniz.',
    },
  ];

  return (
    <div className="glass rounded-3xl p-8 border border-white/10 my-12">
      <h2 className="text-2xl font-bold text-white mb-6">Sık Sorulan Sorular</h2>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="border border-white/5 rounded-2xl bg-black/30 overflow-hidden transition-all"
          >
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 text-left font-medium text-white hover:text-green-400 transition-colors"
            >
              <span>{faq.question}</span>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 shrink-0 text-gray-400 ${
                  openIdx === idx ? 'rotate-180 text-green-400' : ''
                }`}
              />
            </button>
            {openIdx === idx && (
              <div className="px-4 pb-4 text-sm text-gray-400 border-t border-white/5 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
