<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# abbeslim — Life OS Proje Kuralları

## Proje Vizyonu
Bu proje bir **"Life OS" (Kişisel Kontrol Merkezi)**dir. Başlangıçta bir not arama sitesi olan proje, kullanıcının günlük hayatını tek bir yerden yönetebileceği kapsamlı bir platforma dönüştürülmektedir. Kullanıcı siteye girdiğinde başka hiçbir yere ihtiyaç duymadan takvim, finans, dersler, oyunlar, hedefler gibi her şeyi takip edebilmelidir.

## Teknik Yığın (Tech Stack)
| Alan | Teknoloji | Detay |
|------|-----------|-------|
| Framework | Next.js | **16.x** — `middleware.ts` → `proxy.ts`, `params`/`searchParams` Promise |
| React | React 19 | `'use client'` direktifi ile client bileşenler |
| Dil | TypeScript | Strict mode |
| CSS | Tailwind CSS v4 | `@import "tailwindcss"` syntax, PostCSS plugin |
| Veritabanı | Supabase (PostgreSQL) | Auth + DB + Storage + RLS |
| AI/ML | Google Gemini | Embedding + Chat |
| State | Zustand | Global durum yönetimi |
| İkonlar | lucide-react | Tutarlı ikon kütüphanesi |
| Font | Inter | next/font/google |
| i18n | next-intl veya özel | Türkçe / Arapça / İngilizce |
| Deploy | Vercel | abbeslim.vercel.app |

### Dil Desteği
- **Desteklenen Diller**: Türkçe (tr), Arapça (ar), İngilizce (en)
- Tüm arayüz metinleri çeviri sistemi üzerinden çağrılmalıdır — hardcoded Türkçe string YASAKTIR (i18n kurulduktan sonra)
- Arapça seçildiğinde `dir="rtl"` otomatik uygulanır; tüm layout bileşenleri RTL uyumlu olmalıdır
- Sesli komutlarda `recognition.lang` aktif dile göre ayarlanır: `tr-TR`, `ar-SA`, `en-US`
- Dil tercihi `profiles.preferred_language` sütununda saklanır

## Tasarım Sistemi (Mutlaka Uyulacak)

### Renkler
- **Arka Plan**: `radial-gradient(ellipse at top, #001a0d 0%, #000000 60%)` — body gradient
- **Kart/Bileşen Arka Plan**: `.glass` sınıfı → `rgba(255,255,255,0.03)` + `backdrop-filter: blur(20px)` + `border: 1px solid rgba(255,255,255,0.07)` + `border-radius: 24px`
- **Ana Renk (Primary)**: `#22c55e` (green-500) — butonlar, vurgular, aktif durumlar
- **İkincil Renk**: `#16a34a` (green-600) — hover durumları
- **Vurgu (Accent)**: `#4ade80` (green-400)
- **Metin**: Beyaz (`#ffffff`) ana metin, `text-gray-400` ikincil metin
- **Kenarlıklar**: `border-green-900/20` veya `border-green-900/30`
- **Tehlike/Hata**: `bg-red-900/50 text-red-200 border-red-500/30`

### Bileşen Stilleri
- **Butonlar**: `rounded-full`, padding `px-6 py-2`
- **Kartlar**: `.glass` + `rounded-3xl`
- **Input**: `bg-black/50 border border-green-900/50 rounded-2xl p-3 px-4 text-white focus:border-green-500`
- **Modal backdrop**: `fixed inset-0 bg-black/80 backdrop-blur-sm z-50`
- **Hover efektleri**: `hover:-translate-y-1 transition-transform` (kartlar), `hover:text-green-400` (linkler)

### Tipografi
- Font: Inter (next/font/google)
- Başlıklar: `font-bold text-white`
- Alt metin: `text-sm text-gray-400`
- Logo: `text-2xl font-bold tracking-wider text-green-500` → "abbeslim."

## Kodlama Kuralları

### Genel
- Tüm arayüz metinleri **Türkçe** olmalıdır (değişken/fonksiyon isimleri İngilizce kalabilir)
- Yorum satırları Türkçe yazılır
- Her dosya tek bir sorumluluk taşır (SRP)
- Monolitik bileşen YASAKTIR — 300 satırı aşan bileşen parçalanmalıdır
- Mevcut fonksiyonalite **ASLA** bozulmamalıdır — her değişiklik sonrası regresyon kontrolü yapılmalıdır

### Dosya Yapısı
```
src/
├── app/
│   ├── components/
│   │   ├── ui/         # Yeniden kullanılabilir UI bileşenleri (Button, Card, Modal, Input, Badge, Tooltip)
│   │   ├── layout/     # Layout bileşenleri (Sidebar, TopBar)
│   │   ├── search/     # Arama sayfasına özel bileşenler
│   │   └── ...         # Modül bazlı bileşenler
│   ├── hooks/          # Custom React hook'ları (useSearch, useSpeechRecognition, useFileUpload)
│   ├── context/        # React Context providers (MusicContext)
│   ├── (dashboard)/    # Ana sayfa route group
│   ├── search/         # Arama sayfası
│   ├── library/        # Kütüphane
│   ├── calendar/       # Takvim (yapılacak)
│   ├── notes/          # Notlar (yapılacak)
│   ├── tasks/          # Görevler (yapılacak)
│   ├── goals/          # Hedefler & Alışkanlıklar (yapılacak)
│   ├── finance/        # Finans (yapılacak)
│   ├── tracker/        # Film/Dizi/Kitap takibi (yapılacak)
│   ├── games/          # Mini oyunlar (yapılacak)
│   ├── map/            # Harita modülü (yapılacak)
│   ├── api/            # API route'ları
│   ├── login/          # Giriş
│   ├── register/       # Kayıt
│   ├── admin/          # Admin paneli
│   └── viewer/         # PDF görüntüleyici
├── stores/             # Zustand store'ları
├── lib/                # Yardımcı kütüphaneler (db.ts, supabase.ts, ml.ts)
├── utils/              # Utility fonksiyonları
└── middleware.ts        # (v16'da proxy.ts olacak)
```

### State Management
- **Zustand** kullanılır (`import { create } from 'zustand'`)
- Her store tek bir dosyada, `src/stores/` altında
- Küçük, odaklı store'lar tercih edilir (bir mega-store yerine)
- MusicContext mevcut haliyle kalır (zaten iyi yapılandırılmış)

### Bileşen Kuralları
- Tüm interaktif bileşenler `'use client'` direktifi ile başlar
- Props interface'i bileşen dosyasının başında tanımlanır
- Lucide-react ikonları kullanılır, emoji ikonu sadece müzik kanalları için uygundur
- `className` prop'u her bileşende desteklenir (dışarıdan stil ekleme imkanı)

## Deployment Kuralları

> **Her anlamlı değişiklik sonrası `abbeslim.vercel.app` adresine deploy yapılmalıdır.**

Deploy adımları:
1. `npm run build` — hatasız derleme doğrulaması
2. `git add . && git commit -m "açıklayıcı mesaj"` — değişiklikleri kaydet
3. `git push` — Vercel otomatik deploy tetiklenir
4. Build başarılı mı kontrol et

## Modül Yol Haritası (Öncelik Sırası)

1. ✅ Arama (Sesli + AI semantik) — MEVCUT
2. ✅ Kütüphane (Klasör + dosya yönetimi) — MEVCUT
3. ✅ Pomodoro Timer — MEVCUT
4. ✅ Odak Müzik — MEVCUT
5. ✅ AI Chat — MEVCUT
6. 🔄 Mimari Yeniden Yapılandırma (Sidebar, bileşen ayrıştırma)
7. ⬜ Dashboard (Widget tabanlı ana sayfa)
8. ⬜ Çoklu Dil Desteği (Türkçe / Arapça / İngilizce + RTL)
9. ⬜ Görev & Takvim Sistemi
10. ⬜ Not Sistemi (günlük, hızlı, markdown, sesli)
11. ⬜ Hedef & Alışkanlık Takibi
12. ⬜ Finans Takibi
13. ⬜ Film/Dizi/Kitap Takibi (TMDB API entegrasyonu)
14. ⬜ Harita Modülü (Google Maps)
15. ⬜ Odak Modu (gelişmiş)
16. ⬜ Mini Oyunlar (zamanlı, otomatik kapanan)
17. ⬜ Command Palette, Bildirimler, Ayarlar

## Önemli Notlar

- **Next.js 16 Breaking Changes**: `params`/`searchParams` Promise olarak gelir, `await` edilmeli. `middleware.ts` → `proxy.ts` olarak yeniden adlandırılmalı.
- **Turbopack**: Varsayılan bundler. Webpack config varsa `--webpack` flag'i gerekir.
- **Supabase RLS**: Her yeni tablo için Row Level Security politikası yazılmalı — kullanıcılar sadece kendi verilerini görebilir.
- **Sesli Not**: Kısa süreli ses kaydı (30-60 saniye) tarayıcı hafızasında tutulabilir (MediaRecorder API + Blob). Kalıcı depolama için Supabase Storage kullanılır.
- **El Yazısı Desteği**: Ertelenmiştir, gelecekteki bir fazda değerlendirilecektir.

## 🤖 AI Devir Teslim Raporu (Altın Kural)

> **KURAL:** Claude, Gemini veya herhangi bir AI asistan olarak bu proje üzerinde çalışırken, alınan her kritik kararı, yapılan mimari değişiklikleri ve tamamlanan fazları `CLAUDE_HANDOVER_REPORT.md` adlı dosyaya raporlamalısın.

1. **Birikmeli (Append-Only) Yazım:** Rapor asla silinmez veya baştan yazılmaz. Her yeni raporlama seansı, dosyanın sonuna tarih damgasıyla birlikte eklenir.
2. **Kısa, Öz ve Uzmanca:** Gereksiz, abartılı veya "şov yapan" söylemlerden kaçın. Bir Senior Developer'ın diğerine devir teslim (handover) yaparken kullandığı net, teknik ve profesyonel dili kullan.
3. **İçerik:** 
   - Hangi faz üzerinde çalışıldı?
   - Hangi dosyalar değiştirildi/parçalandı?
   - Alınan kritik kararlar (örn. kütüphane seçimi, route değişiklikleri) nelerdir?
   - Bir sonraki asistana bırakılan iş/durum nedir?
