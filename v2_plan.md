# Life OS v1.1 & Kalan Fazlar: Hata Giderme ve Geliştirme Planı 🚀

Verdiğin geri bildirimleri tek tek okudum. Yorumlarını ve ana yol haritasında (roadmap) yapmadığımız eksik modülleri harmanlayarak, hiçbir şeyin birbirini bozmayacağı çok daha kapsamlı bir plan hazırladım.

## ⚠️ User Review Required (Gözden Geçirilmesi Gerekenler)

> [!NOTE]
> Ana yol haritasında kalan "Harita (Google Maps)", "Kapsamlı Not Sistemi", "Hedef/Alışkanlık Takibi" gibi büyük modülleri **Adım 4**'e ekledim. Öncelikle sistemin temel iskeletindeki bu UX (Kullanıcı Deneyimi) pürüzlerini ve hatalarını (Adım 1 ve 2) tamamen bitireceğiz. Sıralama senin için uygun mu?

---

## 🛠️ Planlanan Değişiklikler (Kademeli Adımlar)

### Adım 1: Kritik Hatalar ve UX İyileştirmeleri (Bug Fixes)
1. **Medya Takibi Hatası:** Kitap aramasında kullandığımız kodun filmleri bozması düzeltilecek (İki farklı API, sekme mantığıyla birbirinden tamamen ayrılacak).
2. **Karşılama Ekranı İsimlendirme:** "Kullanıcı" kelimesi yerine Supabase üzerinden çekilen **kullanıcının kendi ismi** (full_name) yazılacak.
3. **"Tüm Hedefleri Gör" Butonu:** Dashboard'daki buton çalışır hale getirilip `/goals` sayfasına bağlanacak.
4. **Son Dosyalar (Recent Files) Mantığı:** Son yüklenenler *yerine*, senin isteğin doğrultusunda **"En Son Açılan Dosyalar"** gösterilecek. (Bir dosyaya tıkladığında veritabanında `last_opened_at` verisi güncellenecek).
5. **PDF Görüntüleyici Üst Üste Binme:** PDF araç çubuğu aşağıya kaydırılarak Yapay Zeka ve Pomodoro butonlarıyla çakışması engellenecek.
6. **Odak Müzik Mantığı:** Müzik ikonuna tıklandığında anında oynatıcı açılacak (arama şartı kalkacak) ve sol menüye (Sidebar) Odak Müzik sekmesi eklenecek.
7. **Oyunlara Mobil Desteği:** Mobil cihazlar için ekrana sanal yön tuşları veya dokunmatik kaydırma özelliği eklenecek.

### Adım 2: Mevcut Modüllerin Genişletilmesi
8. **Hızlı Not & Sesli Desteği:** Dashboard'daki hızlı not modülüne mikrofon 🎙️ butonu eklenecek ve sesi metne dökme özelliği getirilecek.
9. **Medya Takibi Filtreleme:** Filmler/Diziler bölümünde "Tümü / İzlenecek / İzleniyor / Bitti" filtreleri olacak.
10. **Hava Durumu Modalı:** Hava durumu widget'ına tıklanınca şık bir detay paneli açılacak. Burada rüzgar, nem gibi detayların yanı sıra **Hangi şehre (konuma)** ait olduğu mutlaka gözükecek.
11. **Oyun İstatistikleri:** Oyunlar ekranında, Hangi oyunu toplam kaç dakika oynadığını gösteren bir istatistik bölümü eklenecek.

### Adım 3: Ayarlar ve Dashboard Özelleştirme (Ana Yol Haritasından)
12. **Profil ve Ayarlar Sekmesi (Faz 17):** Sadece şifre değil, **Profil Düzenleme** sayfan olacak. Buradan ismini, profil resmini ve kişisel tercihlerini güncelleyebileceksin.
13. **Kişiselleştirilebilir Dashboard (Faz 7):** Sürükle-bırak özelliği ile ana sayfadaki widget'ların yerlerini kendi zevkine göre değiştirebileceksin.
14. **Müthiş Temalar (Onaylanan Bonus):** Sisteme Dark / Light / AMOLED siyahı tema geçişi eklenecek.
15. **Gelişmiş Pomodoro & Kendi Mola Sesini Yükleme:** Pomodoro başlarken müzik çalacak, mola başlayınca doğa sesleri çalacak. Ancak bu doğa seslerini **Ayarlar sekmesinden kendin de yükleyebileceksin**! (Senin isteğin üzerine PWA ve Günlük Alıntı kısımları plandan iptal edilmiştir.)

### Adım 4: Kalan Büyük Modüller (Sonraki Adımlar)
Tüm bu düzeltmeler bittikten sonra ana yol haritasındaki şu modüller inşa edilecek:
16. **Kapsamlı Not Sistemi (Faz 10):** Sadece hızlı not değil, Markdown destekli, günlük tutulabilen detaylı not sayfaları.
17. **Harita Modülü (Faz 14):** Google Maps entegrasyonlu Life OS harita modülü.
18. **Gelişmiş Odak Modu (Faz 15):** Tüm ekranı kitleyen ve sadece işe odaklanmanı sağlayan katı mod.

## ✅ Doğrulama (Verification) Planı
- Yukarıdaki Adım 1 ve Adım 2 tek bir çırpıda, hata riski en aza indirilerek kodlanıp test edilecektir.
- Sonrasında Ayarlar (Profil) ve Dashboard widget sistemine (Adım 3) geçilecektir.
