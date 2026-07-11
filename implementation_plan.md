# 🌿 NoteFinder → Life OS Dönüşüm Planı (v2 — Güncel)

> Kullanıcı geri bildirimleri uygulanmış son plan.

---

## 📊 Mevcut Durum

| Modül | Durum |
|-------|-------|
| 🍅 Pomodoro Timer | ✅ Hazır |
| 🎵 Odak Müzik | ✅ Hazır |
| 🤖 AI Chat | ✅ Hazır |
| 📚 Doküman Kütüphanesi | ✅ Hazır |
| 📄 PDF Görüntüleyici | ✅ Hazır |
| 🔍 Akıllı Arama (4 mod) | ✅ Hazır |
| 👤 Admin Panel | ✅ Hazır |

---

## ✅ Kullanıcı Kararları Özeti

| Konu | Karar |
|------|-------|
| Streak Sistemi | ❌ Kaldırıldı — kullanıcıyı motive etmiyor |
| Harita Modülü | ✅ Google Maps ile tam harita modülü (Bucket List değil) |
| Film/Dizi Takibi | ✅ TMDB API ile zengin modül (poster, açıklama, puan) |
| Mini Oyunlar | ✅ Basit oyunlar + otomatik kapanma zamanlayıcısı |
| Hava Durumu | ✅ OpenWeatherMap API onaylandı |
| El Yazısı Desteği | ⏸️ Ertelendi |
| Sesli Not | ✅ Kısa süreli ses kaydı hafızada + metin çevirisi |
| State Management | ✅ Zustand |
| Deploy | ✅ Her değişiklik `abbeslim.vercel.app`'a deploy edilecek |
| Mevcut fonksiyonlar | ⚠️ HİÇBİR FONKSİYON BOZULMAYACAK |

---

## 📋 Uygulama Fazları

### Faz 1: Mimari Yeniden Yapılandırma
**Kural: Hiçbir mevcut fonksiyon bozulmayacak. Tüm özellikler tam işleviyle devam edecek.**

1. **Monolitik sayfaları parçala** — `page.tsx` (1116 satır) ve `library/page.tsx` (987 satır) bileşenlere ayrılacak
2. **Sidebar navigasyon** — Katlanabilir sidebar + mobil drawer
3. **UI Component Library** — Button, Card, Modal, Input, Badge, Tooltip
4. **Zustand store** — Global durum yönetimi
5. **Route yeniden yapılanma** — `/` → Dashboard, `/search` → Mevcut arama
6. **Doğrulama** — `npm run build` + tüm fonksiyonlar test + Vercel deploy

---

### Faz 2: Dashboard (Kontrol Merkezi)

Widget tabanlı ana sayfa:
- **Karşılama** — Zamana göre Türkçe selamlama + tarih + hava durumu (OpenWeatherMap)
- **Günlük Görevler** — Bugünkü yapılacaklar ve tamamlanma yüzdesi
- **Takvim Özeti** — Bugünkü/yarınki etkinlikler
- **Pomodoro Hızlı Erişim** — Mevcut pomodoro widget'ı
- **Son Dosyalar** — En son açılan 5 dosya
- **Finans Özeti** — Aylık gelir/gider/bakiye
- **Hedef İlerleme** — Aktif hedeflerin görsel çubukları
- **Hızlı Not** — Tek tıkla not alma
- **AI Asistan** — Mevcut chat widget'ı

---

### Faz 3: Çoklu Dil Desteği (Türkçe / العربية / English)

> Tüm arayüz, sesli komutlar ve AI fonksiyonlarında 3 dil tam destek.

**i18n Altyapısı:**
- `next-intl` veya özel bir çeviri sistemi (`src/lib/i18n/`) kurulur
- Her metin string'i çeviri anahtarı üzerinden çağrılır (`t('greeting')`)
- Çeviri dosyaları: `locales/tr.json`, `locales/ar.json`, `locales/en.json`
- Kullanıcı tercih ettiği dili Ayarlar'dan veya ilk girişte seçer
- Dil tercihi Supabase `profiles` tablosunda `preferred_language` olarak saklanır

**RTL (Sağdan Sola) Desteği — Arapça:**
- `<html dir="rtl">` otomatik olarak Arapça seçildiğinde uygulanır
- Tüm layout bileşenleri (Sidebar, TopBar, kartlar) RTL uyumlu olacak
- Tailwind CSS'in `rtl:` prefix'i kullanılır (Örn: `rtl:text-right`, `rtl:flex-row-reverse`)
- Sidebar Arapça'da sağ tarafta görünür
- Tüm ikonlar ve yön oku ikonları RTL'de ters çevrilir

**Sesli Komut Dil Desteği:**
- Web Speech API `recognition.lang` parametresi dinamik olarak ayarlanır:
  - Türkçe → `tr-TR`
  - Arapça → `ar-SA`
  - İngilizce → `en-US`
- Kullanıcı sesli arama yaparken aktif dilde tanıma yapılır
- Dil değiştirme butonu arama çubuğunun yanında (🇹🇷 / 🇸🇦 / 🇬🇧)

**AI Chat Dil Desteği:**
- Gemini API'ye gönderilen system prompt'a aktif dil bilgisi eklenir
- AI yanıtları seçilen dilde gelir
- Kaynak alıntılama ve özetleme dili kullanıcı diline uyar

**Arama Dil Desteği:**
- Arapça metin normalizasyonu (harekeler, elif-lam-şemsiye/kameriye)
- Türkçe normalizasyon zaten mevcut (ı/i, ç/c, ş/s vb.)
- İngilizce stemming (basit)
- Arama sonuçları tüm dillerdeki dosyalardan gelir (dil filtresi opsiyonel)

**Etkilenen Bileşenler:**
- Sidebar etiketleri, TopBar metinleri
- Dashboard karşılama mesajları ve widget başlıkları
- Tüm modal başlıkları ve buton metinleri
- Hata mesajları ve bildirimler
- Tarih/saat formatları (Hicri takvim desteği Arapça için opsiyonel)

**Veritabanı:**
- `profiles` tablosuna `preferred_language` sütunu eklenir

---

### Faz 4: Görev & Takvim Sistemi

**Görevler:**
- Kanban board (Yapılacak → Devam Ediyor → Tamamlandı)
- Öncelik seviyeleri, son tarih, hatırlatma
- Alt görevler (checklist), etiketler

**Takvim:**
- Aylık/Haftalık/Günlük görünüm
- Etkinlik oluşturma (başlık, tarih, saat, tekrar, hatırlatma)
- Görevlerle entegrasyon
- Renk kodlu kategoriler, sürükle-bırak

---

### Faz 5: Not Sistemi

- **Günlük Not** — Tarih bazlı günlük (journal)
- **Hızlı Not** — Yapışkan not tarzı, tek tıkla
- **Markdown Not** — Zengin editör (Tiptap/Milkdown)
- **Sesli Not** — MediaRecorder API ile kısa süreli ses kaydı (30-60sn) tarayıcı hafızasında tutulur + Web Speech API ile metin çevirisi. Kullanıcı isterse kalıcı kayıt Supabase Storage'a yüklenir.
- Not etiketleme, arama, favoriler

---

### Faz 6: Hedef & Alışkanlık Takibi

> **Detaylı Açıklama:** Bu modül kişisel gelişimi somut ve ölçülebilir hale getirmek içindir. Soyut "daha iyi olmak istiyorum" yerine, net sayılarla ilerlemenizi görürsünüz.

**Hedefler (Uzun Vadeli):**
- Bir hedef oluşturursun: Örn. "Arapça B2 seviyesi", "10 kitap oku", "20.000₺ biriktir"
- Her hedefe **somut bir ölçüt** koyarsın: sayı bazlı (10 kitap), tarih bazlı (Aralık 2026'ya kadar), veya yüzde bazlı (%80 tamamla)
- Alt hedefler (milestones) eklersin: Örn. "5 kitap oku" → %50 tamamlandı
- Görsel ilerleme çubuğu ile ne kadar yol katettiğini anlık görürsün
- Dashboard'da aktif hedeflerinin özet ilerlemesi görünür

**Alışkanlıklar (Günlük/Haftalık):**
- Tekrarlanan aktiviteler: Örn. "Her gün 30dk Kur'an oku", "Haftada 3 gün spor yap"
- Her gün yapıp yapmadığını işaretle (basit ✅/❌)
- Haftalık/aylık istatistik: Bu hafta 5/7 gün yaptın
- Hatırlatma saati ayarlayabilirsin
- ~~Streak sistemi~~ — **Kaldırıldı** (kullanıcı tercihi)

**Hedef Kategorileri:**
- 📚 Eğitim (dil öğrenme, sertifika, ders hedefleri)
- 💪 Sağlık & Spor
- 💰 Finansal hedefler
- 🎯 Kariyer
- 🕌 Dini hedefler
- ✨ Kişisel gelişim

---

### Faz 7: Finans Takibi

- Gelir/gider kaydı (miktar, kategori, tarih, açıklama)
- Özelleştirilebilir kategoriler (Yemek, Ulaşım, Eğitim, Eğlence vb.)
- Aylık bütçe limiti belirleme
- Grafikler (pasta + çizgi grafik)
- Aylık özet (toplam gelir, gider, net bakiye)

---

### Faz 8: Film/Dizi/Kitap Takibi (Zengin Modül)

**Kitap Takibi:**
- Kitap adı, yazar, toplam sayfa, mevcut sayfa
- Görsel ilerleme çubuğu (Örn: Suç ve Ceza, 145/520)
- Durum: Okunuyor / Okundu / Okumak İstiyorum
- Kişisel not ve puan (⭐ 1-5)

**Film & Dizi Takibi — TMDB API Entegrasyonu:**
- Film/dizi arama → TMDB API'den poster, açıklama, yıl, puan otomatik çekilir
- İzlemek İstiyorum / İzledim durumu
- Kişisel puan (⭐ 1-10)
- Dizi için sezon/bölüm takibi
- Poster görselleri ile zengin kart görünümü
- Kategorilere göre filtreleme (Aksiyon, Dram, Belgesel vb.)

---

### Faz 9: Harita Modülü (Google Maps)

- **Google Maps embed** ile interaktif harita
- Gitmek istenen yerleri harita üzerine işaretleme (pin)
- Her pin için: isim, açıklama, fotoğraf, durum (Gitmek İstiyorum / Gittim ✅)
- Kategoriler: Şehirler, Kutsal Mekanlar, Doğa, Tarih vb.
- Örnek pinler: İstanbul, Kudüs, Mekke, Tokyo
- Harita üzerinde renk kodlu pinler (gidilmiş = yeşil, hedef = altın)
- Liste görünümü ile harita görünümü arasında geçiş

---

### Faz 10: Gelişmiş Odak Modu

Mevcut Pomodoro + Müzik üzerine:
- **Tek tuşla Odak Modu** — Dashboard'da büyük "Odaklan" butonu
- Aktifleşince: sidebar minimalize, pomodoro otomatik başlar, müzik açılır, sadece günlük görevler görünür, bildirimler sessize, tam ekran odak arayüzü
- Mola zamanında: isteğe bağlı mini oyun veya nefes egzersizi

---

### Faz 11: Mini Oyunlar

- Basit, hızlı oyunlar: 2048, Tetris, Yılan, Mayın Tarlası gibi
- **Otomatik kapanma zamanlayıcısı**: Kullanıcı belirler (Örn: 5dk, 10dk, 15dk). Süre dolunca oyun sekmesi kendini kapatır ve "Molana devam" mesajı gösterir
- Oyunlar sadece odak modunda mola zamanı veya boş zaman için tasarlanır
- Oyun oynama süresi günlük olarak takip edilir

---

### Faz 12: Command Palette, Bildirimler, Ayarlar

**Command Palette (Ctrl+K) — Nedir?**
> Klavyede `Ctrl+K` tuşuna basınca açılan hızlı arama/komut paneli. VSCode'daki `Ctrl+Shift+P` veya Spotlight arama gibi düşün. Ekranın ortasında bir arama kutusu açılır ve yazmaya başlarsın:
> - "takvim" yazarsan → Takvim sayfasına gider
> - "yeni not" yazarsan → Yeni not oluşturma açılır
> - "biyoloji" yazarsan → İlgili dosyaları/notları bulur
> - "finans" yazarsan → Finans sayfasına gider
>
> 10+ modül arasında fare kullanmadan, saniyeler içinde gezinmeni sağlar. Power user'lar için vazgeçilmez.

**Bildirim Sistemi:**
- Uygulama içi bildirimler (bell icon + dropdown)
- Görev hatırlatmaları, hedef deadline'ları, alışkanlık hatırlatmaları

**Ayarlar Sayfası:**
- Profil düzenleme (kullanıcı adı, avatar)
- Tema tercihleri
- Bildirim tercihleri
- Veri export (JSON/CSV)

**Haftalık Özet:**
- Otomatik haftalık rapor: çalışma süresi, görevler, harcamalar, okunan sayfalar

---

## 🗄️ Veritabanı (Yeni Tablolar)

```
Mevcut: files, categories, profiles, user_channels

Yeni:
├── tasks              (görevler)
├── calendar_events    (takvim etkinlikleri)
├── notes              (notlar — günlük/hızlı/markdown/sesli)
├── goals              (uzun vadeli hedefler)
├── habits             (günlük alışkanlıklar)
├── habit_logs         (alışkanlık günlük kayıtları)
├── finance_records    (gelir/gider)
├── finance_categories (finans kategorileri)
├── books              (kitap takibi)
├── media              (film/dizi — TMDB verileri dahil)
├── map_pins           (harita işaretleri)
├── dashboard_widgets  (widget tercihleri)
├── notifications      (bildirimler)
└── weekly_summaries   (haftalık özetler)
```

---

## 🚀 Deploy Kuralı

> **Her anlamlı değişiklik sonrası `abbeslim.vercel.app`'a deploy yapılacaktır.**

---

## ✅ Doğrulama (Her Faz Sonunda)

1. `npm run build` — hatasız derleme
2. Tüm mevcut özellikler çalışıyor mu? (arama, kütüphane, pomodoro, müzik, AI chat)
3. Yeni modüllerin CRUD testi
4. Mobil responsive kontrol
5. Supabase RLS doğrulaması
6. `git push` → Vercel deploy
