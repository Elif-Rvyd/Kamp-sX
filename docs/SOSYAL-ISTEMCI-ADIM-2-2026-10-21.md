# Sosyal istemci — adım 2: gerçek yanıtlar ve doğrulanan izinler

> 22 Ekim güncellemesi: kullanıcı SQL 20 için `2026102102`, SQL 22/23 için ayrı ayrı
> `2026102201` sonucunu daha sonra doğruladı. Aşağıdaki kurulum bekliyor ifadeleri 21 Ekim'deki
> durumu anlatır. Güncel davranış ve testler için
> [22 Ekim raporu](HESAP-VE-GONDERI-GUNCELLEMELERI-2026-10-22.md) geçerlidir.

Tarih: 21 Ekim 2026. Kaynak: kullanıcının paylaştığı `social_client_contract` katalog çıktısı ve
yalnızca altı SELECT iznini gösteren ilk ekran görüntüsü. Kullanıcının son çıktısı ve iki ekran
görüntüsü SQL 19 sonrasında 14 SELECT izninin bulunduğunu doğruluyor. SQL 20 için gönderilen hata,
sorgunun 64. satırdaki yorumdan sonra, fonksiyon gövdesi kapanmadan bittiğini gösteriyor; kurulumun
tamamlandığı doğrulanmadı. Yerel tam dosya yeniden sınandı: 12/12 PostgreSQL kontrolü geçti.
Agent canlıya SQL uygulamadı, gerçek kullanıcı/gönderi üzerinde test veya commit/push yapmadı.
Önceki yerel değişiklikler korundu.

## Çıktıdan doğrulanan sorunlar

1. `posts` üzerindeki authenticated SELECT yalnızca id, user_id, content, media_url, media_type ve
   created_at alanlarına açık. Sayaçlar, parent_id/repost_of_id ve durum alanları için okuma yetkisi yok.
   İlk adımdaki istemci testleri bu canlı izin eksikliğini kapsamıyordu. Yeni SQL testleri önce aynı
   eksik yetki hatasını üretir, sonra en dar SELECT düzeltmesini doğrular.
2. `posts_insert_target_visible` aynı tabloya kendi içinden SELECT yapıyor. Paylaşılan politika
   yapısının yerel PostgreSQL kopyasında `INSERT ... RETURNING` ile 42P17 sonsuz politika döngüsü
   tekrarlandı. Bu, yalnızca istemci kodu değiştirerek giderilemez.
3. Yanıt derinliği için katalogda bir trigger/constraint yok. İstemci düğmesini kaldırmak API üzerinden
   daha derin yanıt eklenmesini engellemez.
4. `blocks`, `bookmarks`, `likes`, `reports` için authenticated rolünde TRUNCATE, REFERENCES, TRIGGER
   ve MAINTAIN yetkileri bulunuyor; normal uygulama akışında gerekmiyor. Bu, standart REST API'de
   doğrudan bir TRUNCATE düğmesi olduğu anlamına gelmez. Ancak TRUNCATE/REFERENCES satır RLS'ine tabi
   değildir; yetkilerin kaldırılması önerildi. Hiçbir TRUNCATE işlemi çalıştırılmadı.

## Hazırlanan SQL dosyaları

| Dosya                             | Değişiklik                                                                             | Geri alma                                  |
| --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| `19-post-read-columns.sql`        | authenticated için eksik sekiz sütuna yalnızca SELECT                                  | `19-post-read-columns-rollback.sql`        |
| `20-reply-depth-guard.sql`        | Aynı görünürlükle döngüsüz INSERT hedef kontrolü, derinlik trigger'ı ve sürüm kontrolü | `20-reply-depth-guard-rollback.sql`        |
| `21-social-unused-privileges.sql` | Dört tabloda gereksiz dört tablo yetkisinin alınması                                   | `21-social-unused-privileges-rollback.sql` |

Dosyalar `docs/supabase` altında. 19 önce, 20 sonra çalıştırılmalı; 21 bağımsız yetki sertleştirmesidir.
Yeni tablo veya sütun oluşturulmaz, mevcut satırlar silinmez/backfill yapılmaz. Sayaçlara istemci
yazma yetkisi verilmez. SQL 19 RLS'e dokunmaz. SQL 20 yalnızca adı ve tanımı doğrulanan INSERT hedef
politikasını değiştirir; görünürlükte deleted_at, sahibi olma, archived_at ve private.can_view_user_content
koşullarının aynısını kullanır. Engelleme, gizli hesap ve kabul edilmiş takip kontrolleri bu mevcut
yardımcı üzerinden korunur. SELECT politikası katalogdaki tanımdan sapmışsa SQL 20 değişiklik yapmadan
işlemi geri alır. Yardımcı private şemasında, SECURITY DEFINER ve sabit public search_path ile çalışır;
istemciden kullanıcı kimliği parametresi almaz. PUBLIC/anon EXECUTE kapalıdır.

Derinlik trigger'ı SECURITY INVOKER kullanır: hedef okumaları kullanıcının RLS'inden geçer. Gönderi →
yanıt → yanıta yanıt kabul edilir; daha derini 23514/reply_depth_limit ile reddedilir. Yeni kural mevcut
derin satırları silmez/değiştirmez. Mevcut sayaç ve sabitleme trigger'ları yeniden kurulmaz.

SQL 20'nin son sonucu `reply_contract_version = 2026102102` olmalı. İstemci her yeni yanıt yazımından
önce bu sürümü kontrol eder; SQL eksikse/geri alınmışsa özellik güvenli biçimde kapanır. Mevcut temel
gönderi yayınlama akışı bu sürüm RPC'sine bağlanmadı. SQL 20 geri alma, eski INSERT politikasını aynen
getirir; eski 42P17 hatası da geri dönebilir. SQL 21 geri alma, kaldırılan geniş yetkileri yeniden verir.

## Angular değişiklikleri

- `core/post-actions.service.ts`: replies artık public.posts.parent_id ile okunur ve yazılır;
  post_comments, kampusx_add_comment ve kampusx_post_state yolları bu akıştan çıkarıldı.
- Yazma payload'ı yalnızca user_id, content, parent_id, repost_of_id, media_url, media_type içerir.
  id/created_at/sayaçlar yazılmaz. Boş metin ve 2000 karakter sınırı kontrol edilir.
- Sunucunun verdiği kayıt yanıtındaki kimlik, sahip, parent_id, içerik, tarih ve sayaç biçimi doğrulanır.
  Hedef/yanıt derinliği istemcide de denetlenir; asıl güvenlik SQL 20'de kalır.
- Onaylanmış kayıt sonrası sayaçlar tekrar okunur. Bu okumanın hatası, başarılı INSERT'i yeniden
  gönderilmesi gereken bir işlem gibi göstermez.
- Sonucu belirsiz ağ/5xx yanıtında yazma tekrar edilmez. Metin korunur, submit kapanır. Yenile yalnızca
  okur; taslağı temizleme onay ister. İzin verilmeyen id sütununu retry anahtarı olarak kullanma kaldırıldı.
- `features/posts/post-thread.page.ts`: ana yanıt ve alt yanıtlar ayrı 50'lik sayfalarda; alt yanıtlar
  isteğe bağlı açılır. Sayfalama ofseti yerel olarak gösterilen yeni kayıt sayısından bağımsızdır.
- En derin düzeyde başka yanıt düğmesi yok. Oturum/epoch değişiminde taslaklar ve okumalar temizlenir;
  geç yanıtlar sinyallerin güncellenmesi beklenmeden gerçek oturum kimliğiyle de kontrol edilir.
- Gönderi kartına sabit input nesnesi verilir. İlk tarayıcı denemesinde yakalanan NG0103 Signals döngüsü
  giderildi ve tarayıcı paketi bu hatayı ayrıca denetler.
- `core/posts.service.ts` ve `libs/shared/util/social-post.ts`: gerçek parent_id eşlemesi ve yanıt modeli.
- `tr.json` / `en.json`: 7 yeni anahtar, toplam 527 eşleşen anahtar. Tema/token/CSS paleti değişmedi.
- CLI üretimi Database tablo tipleri korunur. Henüz canlıda bulunmayabilecek sürüm RPC'si açıkça SQL 20
  sözleşmesi olarak dar bir tip uzantısında tanımlıdır; üretilmiş dosya elle değiştirilmedi.

## Testler

Son kod için doğrulama sonuçları:

- `node scripts/sql/verify-replies.cjs`: 12 PostgreSQL/PGlite kontrolü geçti. Eksik izin, 42P17,
  idempotent kurulum, anonim erişimin reddi, gerçek RLS ile özel/açık/takip/engel/arşiv görünürlüğü,
  tek iç içe düzey, sayaç/id/sahip sahteciliği ve rollback ile veri korunması dahil.
- `npm test`: 161/161 geçti. Bunun içinde 21 gönderi işlemi servis testi ve 7 yeni yanıt senaryosu var.
- `npm run typecheck`: geçti.
- `npm run check:i18n`: 527 eşleşen anahtar.
- `npm run test:ui -- scripts/e2e/replies.spec.cjs scripts/e2e/post-actions.spec.cjs scripts/e2e/search.spec.cjs scripts/e2e/posts.spec.cjs --max-failures=2`: 43/43 geçti.
- Son bellek/arka plan okuması düzeltmesinden sonra `npm run test:ui -- scripts/e2e/replies.spec.cjs`
  tekrar çalıştı: 8/8 geçti. TR/EN ve açık/koyu temada yanıt/axe, klavye, yeniden yükleme, belirsiz
  yanıt, eksik kurulum, iki bağımsız sayfalama ve hata/tekrar deneme dahil.
- `npm run build`: başarılı; 30 JavaScript dosyası üretim çıktı denetiminden geçti. Başlangıç paketi
  734,99 kB; 700 kB uyarısı sürüyor, 1 MB hata sınırı aşılmadı. Bütçe değiştirilmedi.
- `npm run test:security`: son üretim çıktısıyla 12/12 geçti; CSP, oturum, medya ve worker kontrolleri.
- `npm run format:check` ve `git diff --check`: geçti. Ayrı lint/ESLint hedefi projede yok.
- Strict UI: ham tarama Angular `(click)` bağlarını tanımayan 16 mevcut bulgu veriyor; mevcut Angular
  sözdizimi adaptörüyle 0 bulgu. Ham rapor saklandı, denetim kuralları değiştirilmedi.
- TR açık/koyu tema ekran görüntüleri görsel olarak da incelendi; tema ve ortak bileşen görünümü korundu.

İlk tarayıcı çalıştırması Signals döngüsü nedeniyle durduruldu; hata düzeltildi. Sonraki pakette dört
dil/tema/axe akışı ve hata yönetimi geçti, bir sayfalama testinde yanlış İngilizce düğme etiketi
kullanıldığı görüldü. Test gerçek “Show more” etiketine düzeltildi; test devre dışı bırakılmadı.

Bu sınamalar izole HTTP/Realtime fixture'ları ve yerel PostgreSQL kullanır. Canlıdaki sayaç helper'ının
tüm eşzamanlılık davranışının veya gerçek iki hesabın canlı erişiminin denetlendiği anlamına gelmez.

## Sonraki adımların durumu

Adım 1 istemcisi mevcut; SQL 19'un canlı okuma izinleri kullanıcı çıktısıyla doğrulandı. Adım 2
istemcisi hazır; canlı yanıt yazımı için SQL 20'nin tamamı çalıştırılıp `2026102102` sonucu alınmalı.
19'u yeniden çalıştırmak gerekmiyor. 20'deki eksik parçaya yalnızca kapanış eklenmemeli; trigger,
sürüm kontrolü ve COMMIT dahil tam dosya kullanılmalı. Adım 3–9'un eksikleri önceki rapordaki sırayla
devam eder; hepsi bitmiş sayılmaz.

Profil metin alanları ve is_private için UPDATE hâlâ yalnızca fotoğraf sütunlarına açık; adım 5/6'da
ayrı, kontrollü bir SQL gerekir. Kampüs/fakülte public.profiles içinde yok. Auth metadata'da faculty_name
anahtarı bir hesapta görülüyor; bu özet kampüs eşleştirme kuralını veya diğer kişilerin kampüsünü
okumak için kullanılabilecek bir profil alanını sağlamıyor. Bu aşamada fakülte kampüs yerine kullanılmadı.

## İki hesapla deneme

1. SQL 19/20 sonrası A ile görünür bir B gönderisine yanıt yaz. Yenileyince yanıt ve sayaç kalmalı.
2. Yanıta bir yanıt ekle. Yenile, Yanıtları göster ile aç; daha derin düğme olmamalı.
3. B gizli ve A kabul edilmemiş takipçiyken / engelliyken aynı hedefe API/arayüz üzerinden yeni yanıt
   reddedilmeli. Reddedilen metin korunmalı; sunucu ayrıntıları gösterilmemeli.
4. Ağ kesilip sonuç belirsiz olduğunda tekrar gönderme kapalı olmalı; Yanıtları yenile INSERT yapmamalı.
5. 50'den fazla yanıtla sayfalama, TR/EN, açık/koyu tema ve klavyeyi kontrol et.
6. SQL 20 rollback sonrası yeni yanıt girişimi kurulum uyarısı vermeli; mevcut kayıtlar durmalı.

Kaynaklar: [PostgreSQL yetkileri](https://www.postgresql.org/docs/current/ddl-priv.html),
[RLS ve TRUNCATE sınırı](https://www.postgresql.org/docs/current/ddl-rowsecurity.html),
[Supabase INSERT davranışı](https://supabase.com/docs/reference/javascript/insert).
