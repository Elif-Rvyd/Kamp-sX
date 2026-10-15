# KampüsX profil, Storage ve gönderi akışı — güncel teslim

15 Ekim 2026. Önceki görsel profil çalışması, kullanıcının “Profil ve gönderi akışı gerçek” kararıyla genişletildi. Gerçek Auth korunur; mevcut dosya mimarisi taşınmadı. Medya, public `uploads` bucket'a; URL'ler `public.profiles` ve `public.posts` tablolarına kaydedilir. Her iki tabloda sahiplik alanı `user_id` kullanılır.

## Dosya yapısı ve tam kod

- `DOSYA-AGACI.txt`: yeni/değişen dosyalar; `+` eklendi, `~` değişti.
- `TUM-KODLAR.md`: bütün dosyaların tam güncel kodu; diff parçaları değildir.
- `01-servis-model-rota.md`: gerçek servisler, modeller, rotalar.
- `02-profil-ekranlari.md`, `03-ortak-ui.md`, `04-drawer-dashboard.md`: profil, ortak atomic UI ve dashboard/drawer.
- `05-i18n-tailwind-belgeler.md`, `06-testler.md`: tam sözlükler, diğer kaynaklar ve testler.
- `KampusX-profil-kaynak-kod.zip`: değişen dosyaların kaynak arşivi; tam proje klonu değildir.
- `source-manifest.json`: her dosyanın boyutu ve SHA-256 değeri.
- `yeni-i18n-tr.json`, `yeni-i18n-en.json`: HEAD'e göre yeni/değişen çeviri anahtarları.
- `screenshots/`: yerel izole tarayıcı testlerinden görüntüler.

`.env.local`, üretilen environment.ts, kullanıcı oturumları, node_modules ve dist arşive girmez.

## Güncel davranış

Drawer tam beş istenen satırı içerir; profil fotoğrafı ve Profil satırı `/profile` açar. Mevcut gerçek çıkış kontrolü ayrı alanda korunur. `/profile`, `/profile/edit` ve `/compose` gerçek oturum guard'ı kullanır. Edit/compose taslağından uygulama içi ayrılma shared dialog ile onaylanır.

Profil 3:1 kapak, örtüşen avatar, sticky toolbar ve kaydırılabilir Gönderiler/Yanıtlar/Retweetler sekmeleri içerir. Gönderiler gerçek DB kayıtlarıdır. Yanıt/yeniden paylaşım tabloları bağlanmadığı için diğer iki sekme boş durum gösterir. Sticky sayaç kullanıcının gerçek gönderi sorgusundan gelir. Takip sayıları ve katılım tarihi önceki görsel kapsamda kalır.

Fotoğraf seçimi geçici blob önizlemesidir. Kaydet sonrasında gerçek yükleme ve URL kaydı yapılır; yenilemede fotoğraflar DB'den okunur. İsim/bio değişiklikleri bellektedir; henüz kalıcı kolon bağlantısı yoktur. Akademik bilgiler Auth metadata'sından gelir ve profil düzenleyicide salt okunurdur. Kayıtta üniversite/bölüm zorunludur.

Dashboard sırası Keşfet / Üniversite / Kampüs / Bölüm'dür. İlkinde gerçek gönderiler gösterilir. Akademik kapsam filtreleri için veritabanında kurum ilişkileri gerekir; üç alan halen görseldir. `+`, gerçek gönderi oluşturma ekranını açar. Gönderi metin, tek görsel veya tek video içerebilir.

Tema servisi ve tasarım token değerleri değiştirilmedi. Yeni UI bütün metinlerini TR/EN sözlüklerinden alır. Toplam 381 eşleşen, boş olmayan anahtar vardır. Kullanıcı içerikleri dil değişince çevrilmez.

## Kod örnekleri, Supabase izinleri ve test adımları

Adım adım gerçek kod örnekleri, tablo sözleşmesi, dosya limitleri, kalıcılık kapsamı ve kontrol adımları `../STORAGE-ENTEGRASYONU.md` dosyasında. Salt okunur sunucu kontrol sorguları `../supabase/00-readiness.sql`; incelenebilir RLS şablonu `../supabase/01-storage-rls-template.sql` içindedir. SQL canlıya uygulanmadı. Mevcut başka policy varsa şablon işlem yapmadan durur.

## Kontrol edilen kabul kriterleri

- [x] Drawer, profil ve düzenleme rotaları ortak tasarım dilini korur.
- [x] Kapak/avatar, kimlik/akademik alanlar, sticky üst bar ve sekmeler mevcut.
- [x] Karakter sayaçları, anında önizleme, bozuk/büyük dosya reddi ve iptal onayı mevcut.
- [x] Profil fotoğrafı/kapak URL'leri gerçek SDK ile okunur/yazılır; drawer ve kendi kartları anında güncellenir.
- [x] Gönderi dosyası başarıyla yüklenmeden post INSERT yapılmaz; sahiplik oturumdan alınır.
- [x] DB reddi taslağı korur; belirsiz paylaşım sonucu kör tekrar paylaşmayı engeller.
- [x] İlk profil okuması başarısızsa bilinmeyen kapak boş değerle ezilemez; tekrar okuma gerekir.
- [x] TR/EN × açık/koyu, mobil/masaüstü, Axe, klavye ve reduced motion senaryoları test edilir.
- [x] Üretim hash CSP'si, medya allowlist'i ve Vercel güvenlik başlıkları korunur.
- [ ] Canlı Supabase RLS/trigger/default/enum sözleşmesi yönetici erişimiyle doğrulanmalı. Yerel test geçmesi bu kontrolün yerine geçmez.

Güncel otomatik doğrulama kanıtı `verification.json`; statik aracın Angular sözdizimi sınırı `STATIC-AUDIT.md` içindedir. 14 Ekim güvenlik raporu tarihsel başlangıç incelemesidir; yeni gerçek Storage kapsamı için güncel entegrasyon belgesi esas alınır.

## Varsayımlar

- Posts id'si DB tarafından üretilir; ek zorunlu sütunlar default/trigger ile karşılanır.
- media_type image/video/null değerlerini kabul eder.
- Sorgular en fazla 30 satır getirir ve id azalan sıralar. UUID için kronoloji garantisi yoktur; tarih sütunu doğrulanmadan sahte zaman yazılmaz.
- Storage/DB iki ayrı işlemdir; eski ve bağlanamayan dosyalar otomatik silinmez. Referansları denetleyen sunucu temizliği ayrı iştir.
- Public bucket dosyaları URL'yi bilenlere açıktır; görünürlük bilgisi kaydetmeden önce gösterilir.
- Tarayıcı yenileme/sekme kapatma taslak koruması ve resumable video yükleme kapsam dışıdır.
