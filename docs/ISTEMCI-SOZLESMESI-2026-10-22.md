# KampüsX istemci güncellemesi — 22 Ekim 2026

Bu rapor, kullanıcının gönderdiği yeni canlı veritabanı sözleşmesine göre yapılan
istemci değişikliklerini kapsar. Önceki bağımsız görünürlük anahtarları ve
`is_private` geçiş davranışı artık geçerli istemci sözleşmesi değildir.
Mevcut tema, renkler, sayfa düzeni ve standalone/Signals/OnPush mimarisi korundu.
Commit ve push yapılmadı.

## Başlangıçta bulunan durum

Takip istekleri, özel Broadcast, beğeni/kaydetme, yorumlar, gönderi detay ekranı,
silme/arşivleme/sabitleme, engelleme ve arama servisleri zaten vardı.
Kayıt akademik alanları serbest metindi; isim/bio Auth metadata üzerinden
kaydediliyordu. Görünürlük dört bağımsız anahtardı, akademik akışlar metinle
filtreleniyordu. Repost düğmesi etkin değildi. Bu uyumsuzluklar giderildi.

## Adımlar ve uygulamaya etkileri

| Adım               | Değişiklik ve kaynak dosyalar                                                                                                                                                                                                                                                                                         | Doğrulama                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1. Kayıt           | Yeni `core/academic.service.ts`, ortak `academic-picker.component.ts`, mevcut `register-form.component.ts` ve `auth.service.ts`. Üniversite araması; üniversite kimliğiyle kampüs/bölüm listeleri; özel ad girişi; kullanıcı adı kontrolü; anlaşılır `academic_fields_required` hatası.                               | `registration-contract.spec.cjs`, `auth-integration.spec.cjs`, SQL 25 testi. |
| 2. Profil          | `account.service.ts`, `profile.service.ts`, `profile-repository.service.ts`. İsim/bio yalnızca sahip `profiles` satırındaki `full_name/bio` alanlarına yazılır. Auth metadata yenilemesi bunları ezmez. Akademik alanlar salt okunur; tarih `profiles.created_at`. Eksik profil medya kaydından yeniden oluşturulmaz. | Profil ve hesap tarayıcı testleri, profil/sosyal servis birim testleri.      |
| 3. Gizlilik/takip  | `account-status.page.ts`, `account.service.ts`. Takipçiler/Bölüm/Kampüs/Üniversite/Herkes tek seçimlidir. İlgili kimlik yoksa Bölüm/Kampüs devre dışıdır. Mevcut takip isteği, kabul/ret, takipçi çıkarma ve özel Broadcast akışı korunur.                                                                            | `account-status.spec.cjs`, `follow-requests.spec.cjs`, servis testleri.      |
| 4. Beğeni/kaydetme | Mevcut optimistic UI ve geri alma korunur. İstemci sayaç yazmaz; üyelik ve sayaçlar yeniden okunur.                                                                                                                                                                                                                   | `post-actions.spec.cjs`, `post-actions.test.cjs`.                            |
| 5. Yanıt/thread    | Mevcut `posts.parent_id` akışı ve tek iç içe yanıt seviyesi korunur. Kayıp yanıt makbuzu otomatik ikinci INSERT üretmez.                                                                                                                                                                                              | `replies.spec.cjs`, `post-actions.spec.cjs`, servis testleri.                |
| 6. Repost/alıntı   | `post-actions.service.ts`, `posts.service.ts`, `post-entry.component.ts`, ortak `social-post-card`, `embedded-post`, `action-menu` ve `confirm-dialog`. Düz repost, geri alma, yeniden repost, alıntı ve tek orijinal önizlemesi etkin.                                                                               | Yeni `reposts.spec.cjs`, repost servis testleri.                             |
| 7. Sahip menüsü    | Sil/arşivle/geri al/sabitle korunur. Sabitleme menüsü ve servis kontrolü yalnızca orijinal gönderiye izin verir. Profilde öne çıkarılanlar ayrı gösterilir, normal listede yinelenmez. Geçmiş kaldırıldı.                                                                                                             | Sahip menüsü ve featured profil testleri.                                    |
| 8. Moderasyon      | Başka profilde sağ üst üç nokta: engelle/raporla. Ortak sebep seçicisi beş nedeni kapsar; `impersonation` eklendi. Gönderi/profil işlemleri aynı servis sahibindedir.                                                                                                                                                 | `profile-moderation.spec.cjs`, gönderi menüsü ve servis testleri.            |
| 9. Akışlar         | `posts.service.ts`: akademik kapsam artık `profiles!inner(university_id,campus_id,department_id)` üzerinden eşitlik filtreleri kullanır. Bölüm akışı kampüs şartı aramaz. Keşfet ve diğer akışların yetkilendirmesi RLS'ye bırakılır.                                                                                 | Akademik akış testleri; giden sorgu filtreleri kontrol edilir.               |
| 10. Arama          | Mevcut yazdıkça kullanıcı/gönderi araması, sonuç bağlantıları, iptal edilen eski sorgular, IME ve engelleme sonrası yenileme korunur.                                                                                                                                                                                 | `search.spec.cjs`, aramadan profil/thread açma testi.                        |

Tablodaki Angular yolları `apps/shell/src/app/`, ortak bileşenler
`libs/shared/ui/`, testler `scripts/` altındadır. Değişen dosyaların tamamı
çalışma ağacında `git diff --name-only` ve `git ls-files --others --exclude-standard`
ile görülebilir; mevcut dosyalar yerinde güncellendi.

## Veritabanı sınırı

Canlı `public` tipleri Supabase CLI ile tekrar üretildi; yeni liste tabloları ve
profil kimlik alanları gerçek üretilmiş tiplerden okunur. `any` eklenmedi.
İstemci liste tablolarına, akademik kimliklere, `username`, `audience_configured`,
eski `is_private/visibility` alanlarına veya sayaçlara yazmaz.
Eski iki gizlilik alanı çalışma zamanı profil sorgularından da çıkarıldı.

Yeni tek SQL dosyası
[`25-username-availability.sql`](supabase/25-username-availability.sql) ve
[geri alma dosyası](supabase/25-username-availability-rollback.sql).
CLI çıktısında kayıt öncesi kullanılabilir bir kullanıcı adı RPC'si olmadığı
görüldüğü için eklendi. Kullanıcı bunu doğru projede çalıştırıp
`availability_ready: true` sonucunu paylaştı. Boolean döndürür; profil satırı,
e-posta veya kullanıcı kimliği döndürmez. RLS/table/data değişikliği yoktur.
Üretim veritabanında test hesabı veya gönderi oluşturulmadı.

Kullanıcı adı sonucu bir rezervasyon değildir. Form gönderirken yeniden kontrol
edilir; yarış durumundaki son atamayı veritabanı belirler. Oturum dönen kayıtta
gerçek atanmış `profiles.username` gösterilir ve Devam düğmesi sunulur. E-posta
doğrulaması gerektiren oturumsuz kayıtta bu bilgi ilk girişte profilde görülür;
istenen adı atanmış ad gibi gösteren bir varsayım yapılmaz.

## Görünürlük ve yazma kuralları

- Takipçiler: dört bayrak false. Diğer seviyeler: yalnızca seçilen bayrak true.
  Kabul edilmiş takipçiler her seviyede erişir. Bu karar ve engeller sunucudadır.
- Bölüm aynı üniversite + bölüm; Kampüs aynı üniversite + kampüs; Üniversite aynı
  üniversite; Herkes giriş yapmış kullanıcılar. İstemci bu görünürlüğü tekrar kurmaz.
- Takip INSERT'i yalnızca iki kullanıcı kimliğini yollar; pending/accepted
  kararını mevcut sunucu trigger'ı verir. İstemci `is_private` okumaz.
- Repost/alıntı INSERT'i yalnızca izinli altı sütunu yollar. Tekrarlanan düz repost
  unique hatası yeniden sayılmaz. Geri alma sahip kontrollü soft delete kullanır.
  Alıntının belirsiz makbuzu aynı oturumda aynı hedefe yeni repost/alıntıyı engeller.
- Silme mevcut sahip kontrollü `kampusx_soft_delete_post` RPC'siyle önce satırı
  gizler; ardından yalnızca doğrulanmış sahip medya yolu temizlenir. Temizlik
  hatası kaydı yeniden görünür yapmaz ve ikinci silme daveti üretmez.
- Sabitlemede en fazla üç sınırının gerçek uygulayıcısı mevcut veritabanı
  trigger'ıdır. İstemci bu sınırı kaldırmaz. Güncellenen gönderide `.select()`
  zincirlenmez; kalıcı DELETE gönderilmez.

## Aktif ayarlar

Hesap durumu, takip istekleri, Arşivim, Kaydedilenler ve Engellenenler gerçek
servislere bağlıdır. İsim/bio/fotoğraflar Profil Düzenle'den kaydedilir. Dil/tema ve
çıkış çalışır. Akademik bilgiler ve kullanıcı adı düzenlenebilir ayar değildir.
Google OAuth, doğrudan mesajlar, topluluklar ve bildirim altyapısı bu iş kapsamında
etkinleştirilmedi.

## Komutlar ve kayıtlar

Her yeni aşamada üretim derlemesi ve ilgili tarayıcı testleri çalıştırıldı.
Projede ESLint/Nx lint hedefi tanımlı değildir; lint çalışmış gibi raporlanmaz.
Biçim ve TypeScript denetimleri ayrıca çalıştırılır.

- `npm test`: **176/176 geçti** (`.nx/contract-all-unit.log`).
- `npm run typecheck`: geçti (`.nx/contract-types-final.log`).
- `npm run format:check`: geçti (`.nx/contract-format-final.log`).
- `npm run check:i18n`: **604** eşleşen, boş olmayan TR/EN anahtarı doğrulandı.
- `node scripts/sql/verify-username-availability.cjs`: idempotence, müsait/dolu,
  geçersiz giriş, anon satır erişimi reddi ve rollback kontrolü geçti.
- `npm run build`: geçti; son kayıt `.nx/contract-shipping-build-assets.log`.
- Tarayıcı testleri gerçek Supabase yerine 4300 portunda izole HTTP/Realtime
  fixture'ları kullanır. Axe, TR/EN, light/dark ve dar ekran senaryoları dahildir.
  Kayıt seçicisinin açık görünümü iki temada ayrıca incelendi.
- İlk geniş paket: 57 testten 55'i geçti. Kayıt testi eski otomatik geçişi
  bekliyordu; yeni atanan ad/Devam akışına uyarlandı. Dar ekranda eylem taşması
  bulundu ve kart genişliğine göre iki satıra geçildi.
- Sonraki 47 testten 46'sı geçti. Kalan profil testi yalnızca ilk PATCH'in fotoğraf
  kaydı olduğunu varsayıyordu; isim/bio da artık public tabloda ayrı PATCH olduğu
  için doğru isteği seçecek şekilde düzeltildi. Uygulamada kaydetme ve yenileme
  kontrolleri o testte zaten geçmişti.
- Son hedefli tekrar ve üretim güvenlik sonucu aşağıdaki son doğrulama bölümüne
  eklenir; önceki hata kayıtları başarılı test gibi sunulmaz.

## Canlıda iki hesapla kontrol

1. A ile listeden veya özel adla kayıt ol; atanan adı gör. Profilde isim/bio değiştir,
   sayfayı yenile; okul bilgileri değiştirilememeli.
2. A ve B aynı üniversite/bölümde, farklı kampüste olsun. Bölüm seviyesinde B'nin
   gönderiyi görebildiğini, kampüs seviyesinde ek kampüs şartının uygulandığını dene.
3. B, A'yı takip etsin: Herkes dışında istek, Herkes'te accepted olmalı. A isteği
   onaylayınca Takipçiler dahil tüm seviyelerde B erişebilmeli. İki oturumda sayılar
   ve istek listeleri Broadcast sonrasında yenilenmeli.
4. B gönderiyi beğen/kaydet, geri al; A'nın sayacı ve B'nin Kaydedilenler listesini
   kontrol et. Yorum ve bir yanıt ekle; daha derin yanıt düğmesi çıkmamalı.
5. Aynı gönderiyi repost et/geri al/yeniden repost et; alıntı ekle. Orijinal silinir
   veya RLS ile görünmez olursa alıntıdaki önizleme yer tutucuya dönmeli.
6. A üç orijinalini sabitlesin; dördüncü anlaşılır hata vermeli. Arşivle/geri al ve
   silme onayını dene. Repost/alıntıda sabitleme çıkmamalı.
7. Profilden raporla/engelle; iki yöndeki uygulama görünürlüğünü ve takiplerin
   kalkmasını dene. Engellenenler'den kaldırınca sunucu durumunu tekrar oku.

`uploads` kullanıcının kararıyla public kalır: önceden bilinen doğrudan medya URL'si
RLS satır görünürlüğünden bağımsız erişilebilir. Özel girilen akademik adlar öğrenci
kimliği doğrulaması değildir. Yerel fixture testleri canlı RLS'nin iki gerçek
hesapla uçtan uca doğrulandığı anlamına gelmez.

## Son doğrulama

- Son hedefli tarayıcı paketi **17/17 geçti** (`.nx/contract-last-regression.log`):
  beş gizlilik seviyesi, gerçek profil metin/fotoğraf kaydı, akademik akışlar,
  profilde raporlama, sabitleme ve TR/EN repost/alıntı. Menü konumu ayrıca 320px
  dahil viewport sınırlarıyla ölçüldü.
- Yanıt, arama, kayıt ve profil paketindeki diğer **46 senaryo geçti**;
  tek eski PATCH beklentisi düzeltildi ve son 17 içinde başarıyla tekrar çalıştı.
  Bu sayılar farklı koşuları ifade eder; tek koşuda 63 test geçti denmez.
- Son üretim güvenlik paketi **12/12 geçti** (`.nx/contract-security-final.log`):
  CSP, oturumsuz rota reddi, HTML'in metin olarak kalması, dış görüntü/ağ engeli,
  güvenli fotoğraf önizlemesi ve yerel video worker'ı.
- Derleme başarılı, başlangıç paketi **850,50 kB**. Mevcut **700 kB uyarı** bütçesi
  aşılıyor; **1 MB hata** sınırı aşılmadı. Bütçe değiştirilmedi. Kayıt seçicisi için
  resmi Angular Aria/CDK 22.2.1 bağımlılıkları eklendi.
- Son çeviri kontrolünde yeni akademik seçici metinlerinin mevcut tanıtım
  alanındaki academic anahtarlarını örttüğü görüldü; önceki metinler geri yüklendi.
  Kayıt metinleri onlarla birleştirildi, tanıtım tasarımı değiştirilmedi.
- HEAD aynı kaldı (`c0a641f`); yeni commit veya push yok.
