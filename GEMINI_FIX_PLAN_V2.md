# Fix Planı — Gemini Sonrası Kapsamlı Hata ve Eksiklik Düzeltmeleri

Build başarılı, tüm route'lar mevcut. Ancak kapsamlı kod analizi sonucunda **12 sorun** tespit edildi.

> **KURAL:** Bu plandaki her grubu sırasıyla uygula. Her grubu bitirince `npm run build` çalıştır. Hata yoksa devam et. Sonunda `CLAUDE_HANDOVER_REPORT.md` dosyasının SONUNA ne yaptığını yaz.

> **ÖNEMLİ:** Mevcut çalışan hiçbir özelliği bozma. Tailwind CSS v4 kullanılıyor: `@import "tailwindcss"` syntax.

---

## Sorunların Öncelik Tablosu

| # | Önem | Dosya | Sorun |
|---|------|-------|-------|
| 1 | 🔴 Yüksek | Birçok dosya | `bg-stone-850` geçersiz Tailwind sınıfı — görünmez slider/bar arka planları |
| 2 | 🔴 Yüksek | `study/page.tsx` | Hardcoded Türkçe stringler — i18n anahtarları mevcut ama kullanılmıyor |
| 3 | 🔴 Yüksek | `FocusModeOverlay.tsx` | "Odak Müziği" butonu `setIsMusicPanelOpen(true)` çağırıyor ama modal silindi — buton hiçbir şey yapmıyor |
| 4 | 🟡 Orta | `study/page.tsx` | Yazım hatası: `Çalışma Hedeyi` → `Çalışma Hedefi` |
| 5 | 🟡 Orta | `study/page.tsx` | CSS çakışması: `text-white` ve `text-gray-400` aynı elemanda |
| 6 | 🟡 Orta | `Sidebar.tsx` | Müzik etiketi hardcoded `'Odak Müzik'` — i18n bozuk |
| 7 | 🟡 Orta | `HiddenYouTubePlayer.tsx` | Buffering recovery: buffer bitince `playVideo()` çağrılmıyor |
| 8 | 🟡 Orta | `WorkTimePanel.tsx` | Hardcoded Türkçe stringler (study ile aynı sorun) |
| 9 | 🟠 Düşük | `chat/route.ts` | UTC tarih kullanımı — UTC+3'te gece yanlış tarih |
| 10 | 🟠 Düşük | Birçok dosya | Dead code: `isMusicPanelOpen` state + tüm referansları artık kullanılmıyor |
| 11 | 🟠 Düşük | `page.tsx` (dashboard) | Unused imports: `Search`, `BookOpen`, `Music`, `Link`, `setIsMusicPanelOpen` |
| 12 | 🟠 Düşük | `Sidebar.tsx` | Dead code: `action === 'music'` bloğu (satır 141-151) asla çalışmıyor |

---

## GRUP 1: `bg-stone-850` Geçersiz Tailwind Sınıfı Düzeltmesi

**Problem:** Tailwind CSS v4'te `stone-850` renk skalasında **mevcut değil**. Standart skala: 50, 100...800, 900, 950. Bu sınıf hiçbir CSS üretmez — seek barlar, progress barlar ve volume sliderlar görünmez arka plana sahip.

**Düzeltme:** Tüm dosyalarda `stone-850` → `stone-800` olarak değiştir.

### Dosya: `src/app/study/page.tsx`
Satır 166 ve 180'de `bg-stone-850` → `bg-stone-800` olarak değiştir.

### Dosya: `src/app/LayoutShell.tsx`
Satır 412'de `bg-stone-850` → `bg-stone-800` olarak değiştir.

### Dosya: `src/app/components/dashboard/WorkTimePanel.tsx`
Satır 183 ve 197'de `bg-stone-850` → `bg-stone-800` olarak değiştir.

### Dosya: `src/app/music/page.tsx`
Satır 174, 265'te `bg-stone-850` → `bg-stone-800` olarak değiştir.
Satır 393'te `border-stone-850` → `border-stone-800` olarak değiştir.

### Dosya: `src/app/settings/page.tsx`
Tüm `stone-850` referanslarını `stone-800` olarak değiştir.

---

## GRUP 2: Study Page i18n + Yazım Hataları

**Problem:** `/study/page.tsx` mevcut i18n çeviri anahtarlarını hiç kullanmıyor. Tüm metinler hardcoded Türkçe.

### Dosya: `src/app/study/page.tsx`

Şu hardcoded stringleri i18n anahtarlarına dönüştür:

| Satır | Hardcoded String | Değiştirilecek |
|-------|-----------------|----------------|
| 138 | `Çalışma Süresi Analizi` | `{t('study.title')}` |
| 139 | `Çalışma sürelerinizi, hedeflerinizi...` | `{t('study.subtitle')}` |
| 150 | `Veriler yükleniyor...` | `{t('study.loading')}` |
| 159 | `Bugünkü Hedef` | `{t('study.dailyGoal')}` |
| 173 | `Haftalık Hedef` | `{t('study.weeklyGoal')}` |
| 188 | `Son 7 Günlük Çalışma` — ayrıca `text-white` sil, sadece `text-gray-400` kalsın | `{t('study.last7Days')}` |
| 215 | `Bu Ay Toplam` | `{t('study.thisMonthTotal')}` |
| 223 | `Tüm Zamanlar` | `{t('study.allTime')}` |
| 232 | `Çalışma Hedeyi Ayarları` (YAZIM HATASI) — `text-white` sil, sadece `text-gray-400` kalsın | `{t('study.goalSettings')}` |
| 235 | `Günlük Hedef (Dk)` | `{t('study.dailyGoalMinutes')}` |
| 246 | `Haftalık Hedef (Sa)` | `{t('study.weeklyGoalHours')}` |
| 261 | `Hedefler Güncellendi` / `Hedefleri Kaydet` | `{saveSuccess ? t('study.settingsSaved') : t('study.saveSettings')}` |

Gün adları dizisini de i18n'e bağla (satır 81):
```tsx
const daysName = [
  t('study.days.Paz'), t('study.days.Pzt'), t('study.days.Sal'),
  t('study.days.Çar'), t('study.days.Per'), t('study.days.Cum'), t('study.days.Cmt')
];
```

Ayrıca `formatHoursAndMinutes` fonksiyonundaki (satır 115-119) `sa` ve `dk` kısaltmalarını i18n'e bağla:
```tsx
return hrs > 0 ? `${hrs}${t('study.hoursShort')} ${m}${t('study.minutesShort')}` : `${m}${t('study.minutesShort')}`;
```

---

## GRUP 3: FocusModeOverlay Müzik Butonu Düzeltmesi

**Problem:** `FocusModeOverlay.tsx` satır 70'te "Odak Müziği" butonu `setIsMusicPanelOpen(true)` çağırıyor. Modal silindiği için buton hiçbir şey yapmıyor.

### Dosya: `src/app/components/FocusModeOverlay.tsx`

`setIsMusicPanelOpen(true)` olan yeri `router.push('/music')` olarak değiştir. `useRouter` import'unu ekle.

Eğer `setIsMusicPanelOpen` başka yerde kullanılmıyorsa, `useMusicContext`'ten destructuring'ini de kaldır.

---

## GRUP 4: Sidebar Müzik Etiketi i18n

### Dosya: `src/app/components/layout/Sidebar.tsx`
Satır 101'deki:
```tsx
const label = item.id === 'music' ? 'Odak Müzik' : t(`sidebar.${item.id}`);
```
Şununla değiştir:
```tsx
const label = t(`sidebar.${item.id}`);
```

### i18n Dosyalarını Kontrol Et
`sidebar.music` anahtarının her üç dilde tanımlı olduğundan emin ol:
- `tr.json`: `"music": "Odak Müzik"`  
- `en.json`: `"music": "Focus Music"`
- `ar.json`: `"music": "موسيقى التركيز"`

Eğer eksikse ekle.

---

## GRUP 5: YouTube Buffering Recovery İyileştirmesi

### Dosya: `src/app/HiddenYouTubePlayer.tsx`

Satır 263-267 arasındaki buffering recovery timeout'unu güncelle:

Eski:
```typescript
setTimeout(() => {
  if (ctxRef.current.isLoadingTrack && ytPlayerRef.current?.getPlayerState?.() === 3) {
    ctxRef.current.setIsLoadingTrack(false);
  }
}, 10000);
```

Yeni:
```typescript
setTimeout(() => {
  if (ctxRef.current.isLoadingTrack) {
    const currentState = ytPlayerRef.current?.getPlayerState?.();
    if (currentState !== 1) {
      // Hâlâ çalmıyorsa bir kez daha dene
      ytPlayerRef.current?.playVideo?.();
    }
    ctxRef.current.setIsLoadingTrack(false);
  }
}, 10000);
```

---

## GRUP 6: Chat API UTC Tarih Düzeltmesi

### Dosya: `src/app/api/chat/route.ts`

Bugünün tarihinin hesaplandığı satırda:
```typescript
// Eski:
const today = new Date().toISOString().split('T')[0];
// Yeni:
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
```

---

## GRUP 7: Dead Code Temizliği

### Dosya: `src/app/context/MusicContext.tsx`
- Interface'den `isMusicPanelOpen: boolean` ve `setIsMusicPanelOpen: (open: boolean) => void` kaldır
- Provider'dan `isMusicPanelOpen` state'ini ve value'dan çıkart

### Dosya: `src/app/LayoutShell.tsx`
- `isMusicPanelOpen` destructuring'ini `useMusicContext()` çağrısından kaldır
- `useEffect` dependency array'den `isMusicPanelOpen` kaldır

### Dosya: `src/app/page.tsx` (Dashboard)
- Unused lucide-react imports kaldır: `Search`, `BookOpen`, `Music`
- `import Link from 'next/link'` kaldır (kullanılmıyor)
- `const { setIsMusicPanelOpen } = useMusicContext()` kaldır

### Dosya: `src/app/components/layout/Sidebar.tsx`
- `action === 'music'` dead code bloğunu kaldır (satır 141-151)
- `setIsMusicPanelOpen` import/destructuring'ini `useMusicContext`'ten kaldır
- `NavItem` interface'indeki `action?: 'music'` kaldır

---

## Son Adım: Build & Deploy

```bash
npm run build
git add . && git commit -m "fix: 12 sorun düzeltmesi — geçersiz Tailwind sınıfları, i18n, dead code, FocusModeOverlay"
git push
```

Sonra `CLAUDE_HANDOVER_REPORT.md` dosyasının **SONUNA** (append-only) yapılanları yaz.
