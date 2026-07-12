# Gemini İçin Düzeltme Planı — Kalan Sorunlar

> Bu plandaki sorunlar **küçük** önceliktedir. Kritik ve büyük sorunlar Claude tarafından düzeltilip deploy edilmiştir.

---

## 1. `any` Tipi Kullanımını Düzelt

**Dosyalar:**
- `src/app/calendar/page.tsx` → `useState<any>(null)`
- `src/app/tasks/page.tsx` → `useState<any>(null)`
- `src/app/notes/page.tsx` → `useState<any>(null)`
- `src/app/components/dashboard/TasksWidget.tsx` → `useState<any>(null)`
- `src/app/components/dashboard/QuickNoteWidget.tsx` → `useState<any>(null)`

**Çözüm:**
```typescript
import type { User } from '@supabase/supabase-js';
const [user, setUser] = useState<User | null>(null);
```

---

## 2. i18n Kapsama Oranını Artır

Aşağıdaki hardcoded Türkçe metinleri sözlüklere (`tr.json`, `en.json`, `ar.json`) taşı ve `t('key')` ile çağır:

### Sidebar (`src/app/components/layout/Sidebar.tsx`)
| Hardcoded | Önerilen Key |
|-----------|-------------|
| "Yakında" | `common.comingSoon` |
| "Çıkış Yap" | `sidebar.logout` |
| "Dil / Language" | `sidebar.language` |
| "Genişlet" / "Daralt" | `sidebar.expand` / `sidebar.collapse` |

### Takvim (`src/app/calendar/page.tsx`)
| Hardcoded | Önerilen Key |
|-----------|-------------|
| "Yeni Etkinlik" | `calendar.newEvent` |
| "Etkinlik Adı" | `calendar.eventName` |
| "Giriş Yapmanız Gerekiyor" | `common.loginRequired` |

### Görevler (`src/app/tasks/page.tsx`)
| Hardcoded | Önerilen Key |
|-----------|-------------|
| "Yeni Görev" | `tasks.newTask` |
| "Yapılacaklar" | `tasks.pending` |
| "Tamamlananlar" | `tasks.completed` |

### Notlar (`src/app/notes/page.tsx`)
| Hardcoded | Önerilen Key |
|-----------|-------------|
| "Notlarım" | `notes.title` |
| "Yeni Not" | `notes.newNote` |
| "Ses Kaydet" | `notes.record` |

### Auth Sayfaları (login, register, pending-approval)
Bu sayfaların **tamamı** hardcoded Türkçe. Tüm metinleri sözlüğe taşı.

---

## 3. Takvim Ay/Gün İsimlerini Çok Dilli Yap

**Dosya:** `src/app/calendar/page.tsx`

**Mevcut:**
```typescript
const monthNames = ['Ocak', 'Şubat', ...]; // Hardcoded Türkçe
const dayNames = ['Pzt', 'Sal', ...];
```

**Çözüm:** `Intl.DateTimeFormat` kullan:
```typescript
const locale = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'tr-TR';
const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, i))
);
const dayNames = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, i + 1))
);
```

---

## 4. Monolitik Bileşenleri Parçala (300+ satır kuralı)

### `src/app/components/AIChatWidget.tsx` (~600 satır)
- `ChatMessageList.tsx` → Mesaj listesi
- `ChatInput.tsx` → Mesaj input
- `useChat.ts` → State ve API

### `src/app/components/PomodoroWidget.tsx` (~600 satır)
- `PomodoroTimer.tsx` → Zamanlayıcı yüzü
- `PomodoroSettings.tsx` → Ayarlar
- `usePomodoroTimer.ts` → Zamanlayıcı hook

---

## 5. `next.config.ts` Temizliği

Webpack config'i kaldır (Next.js 16 Turbopack varsayılan):
```typescript
const nextConfig: NextConfig = {
  turbopack: {},
  experimental: { serverActions: {} },
};
```

---

## 6. Dashboard Placeholder Verilerini Gerçek Veriye Bağla

- `PLACEHOLDER_FILES` → Son dosyaları API'den çek
- `PLACEHOLDER_GOALS` → Faz 6 sonrası `useGoalStore`'dan çek
- `QuickStats` hardcoded değerleri → ilgili store'lar kuruldukça bağla

> **Not:** Bu madde Faz 6-7'ye bağımlıdır.

---

## Doğrulama

Her düzeltme sonrası:
1. `npm run build` — hatasız derleme
2. `npx vercel --prod --yes` — canlıya al
3. `CLAUDE_HANDOVER_REPORT.md` sonuna yapılan işleri ekle
