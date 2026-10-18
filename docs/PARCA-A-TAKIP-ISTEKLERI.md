# Parça A — takip ve takip istekleri

18 Ekim 2026. Kaynak: kullanıcının sağladığı üretim şeması, tam RLS/katalog çıktısı ve Supabase CLI ile gerçek `public` şemasından üretilen tipler. Adım 1/2 uygulanmış kabul edildi. Bu çalışma canlı veritabanına migration uygulamadı; gerçek hesap, takip veya gönderi oluşturmadı.

Sonraki güvenlik denetimi, oturum temizliği düzeltmeleri ve güncel test sonuçları: [18 Ekim Parça A güvenlik raporu](/C:/Users/elifr/source/project/web/KampüsX/docs/GUVENLIK-DENETIMI-PARCA-A-2026-10-18.md).

## Uygulama sırası

1. Supabase SQL Editor → New query içinde [migration dosyasının](/C:/Users/elifr/source/project/web/KampüsX/supabase/migrations/20261018190000_follow_requests.sql) **tamamını** çalıştır. Yeni tablo/sütun oluşturmaz. Mevcut `public.follows`, `public.profiles`, `public.blocks` ve `realtime.messages` kullanılır. Eski `07-realtime-follows.sql`, farklı `user_follows` şeması içindir; bu kurulumda çalıştırılmaz.
2. [Doğrulama sorgusunu](/C:/Users/elifr/source/project/web/KampüsX/docs/supabase/16-follow-requests-verify.sql) çalıştır. Sonuçların tamamı `true` olmalı.
3. Frontend değişikliklerini dağıt. Yeni takip yazımları, oturum gerektiren sürüm RPC'si migration'ı doğrulayana kadar kapalı kalır. Supabase URL/publishable key aynı; yeni environment değişkeni veya service_role gerekmez.
4. Profildeki takipçi/takip edilen sayılarından listeleri aç. Bekleyen istekler `/profile/requests` adresinde ve Ayarlar bağlantısındadır. Listelerde kullanıcı adıyla tam eşleşme araması, ilk takip için giriş noktasıdır.

Arama `public.profiles.username` alanını kullanır. Bu alanın dolu olması gerekir; `auth.users.user_metadata.username` ayrı bir kaynaktır. Bu parça kayıt/profil senkronizasyonunu değiştirmez veya eksik kimlik bilgisi uydurmaz.

## Veritabanındaki değişiklik ve güvenlik

- `BEFORE INSERT` trigger'ı hedefin `profiles.is_private` değerini okur: gizli → `pending`, açık → `accepted`. İstemci sadece `follower_id` ve `following_id` gönderir. Var olan kabul edilmiş ilişkiler dönüştürülmez.
- Takip tablosunun anonim/PUBLIC yetkileri ve gereksiz `TRUNCATE/TRIGGER/REFERENCES` yetkileri kaldırılır. Authenticated yalnızca SELECT/DELETE, kimlik sütunlarına INSERT ve `status` sütununa UPDATE yapar. Timestamp'i veritabanı üretir; kimlikler değiştirilemez.
- UPDATE yalnızca isteği alan hesap için `pending → accepted` geçişidir. Takip eden kendi isteğini iptal eder veya takipten çıkar; takip edilen isteği reddeder veya takipçisini çıkarır. Her yazım iki kullanıcı kimliğiyle filtrelenir. UPDATE ardından `.select()` kullanılmaz.
- Bekleyen istekleri yalnızca iki katılımcı okur. Kabul edilmiş ilişkilerin mevcut engel kontrollü görünürlüğü korunur. PK çift kayıt, mevcut CHECK öz takip engelini korur.
- Takip ve engelleme yazımları aynı sıralanmış kullanıcı çifti için transaction kilidi kullanır. Mevcut `private.on_block` değişmez; karşılıklı takipleri silmeye devam eder. Bekleyen istek özel gönderileri açmaz; yalnızca kabul edilen takip `private.can_view_user_content` kontrolünden geçer.
- Profilde yalnızca mevcut kimlik alanlarına kolon düzeyinde SELECT eklenir. Profil RLS'si engelli hesapları gizlemeye devam eder; yeni özel alanlar otomatik olarak açılmaz. Auth metadata, kayıt/giriş, okul alanları, Storage görünürlüğü ve gönderi kuralları değiştirilmez.

## Realtime kararı

Kullanıcı, silinen özel takip isteklerinin kimliklerini açığa çıkarmamak için **private Broadcast** seçeneğini onayladı. `follows` genel `supabase_realtime` yayınına eklenmez. Migration, tablo zaten herhangi bir genel yayındaysa durur; diğer yayınları kendiliğinden değiştirmez.

Her INSERT/UPDATE/DELETE iki kişinin `kampusx:follows:<uid>` kanalına sadece `{}` gönderir. Liste ve sayaçlar RLS üzerinden tekrar okunur. Başka kullanıcı kanalına katılım ve istemcinin sahte yayın göndermesi restrictive politikalarla engellenir. Hem bağlanılan kanal hem kaydedilen mesajın `topic` alanı denetlenir; bu sistem sütunu da CLI ile gerçek Realtime şemasından doğrulandı. Kanal yeniden bağlanınca tekrar okuma yapılır. Abonelikler, istekler ve bekleyen yazımlar DestroyRef/oturum değişiminde temizlenir.

Supabase, Postgres Changes DELETE olaylarında RLS uygulanmadığını ve silme olaylarının filtrelenemediğini belgeliyor: [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes). [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) için genel tablo yayını gerekmez.

## Dosyalar ve mimari

- SQL ve geri alma: [migration](/C:/Users/elifr/source/project/web/KampüsX/supabase/migrations/20261018190000_follow_requests.sql), [rollback](/C:/Users/elifr/source/project/web/KampüsX/docs/supabase/15-follow-requests-rollback.sql), [salt okunur doğrulama](/C:/Users/elifr/source/project/web/KampüsX/docs/supabase/16-follow-requests-verify.sql).
- Veritabanı tipleri: [database.generated.ts](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/core/database.generated.ts) canlı `public` şemasından CLI ile üretildi. [follow-database.types.ts](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/core/follow-database.types.ts), bu migration'ın henüz canlıya uygulanmayan sürüm RPC'sini tipli sözleşme olarak ekler. Diğer servisler topluca yeniden yazılmadı.
- Takip API'si: [follows.service.ts](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/core/follows.service.ts) ve [follow.model.ts](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/core/follow.model.ts).
- Lazy ekran: [follow-connections.page.ts](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/features/profile/follow-connections.page.ts), [HTML](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/features/profile/follow-connections.page.html), [CSS](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/features/profile/follow-connections.page.css), [profil rotaları](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/features/profile/profile.routes.ts).
- Atomic UI: [FollowPerson molecule](/C:/Users/elifr/source/project/web/KampüsX/libs/shared/ui/molecules/follow-person/follow-person.component.ts) mevcut Avatar/Button kullanır. [FollowCounts](/C:/Users/elifr/source/project/web/KampüsX/libs/shared/ui/molecules/follow-counts/follow-counts.component.ts) isteğe bağlı liste bağlantıları aldı; shared UI shell servisi import etmez.
- Giriş noktaları: profil başlığı, kalıcı yan menü, Ayarlar ve uygulamanın sosyal rota sınıflandırması. Yeni üç alt rota, tanıtım header/footer'ını göstermez. Welcome/auth tasarımı ve tema token'ları değişmedi.
- Yeni metinler `follows.titles`, `actions`, `empty`, `search*`, `personActions`, `listLoading`, `listError`, `changed`, `saved`, `unavailable` altında iki dilde bulunur. [TR](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/assets/i18n/tr.json) / [EN](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/assets/i18n/en.json).

## İki gerçek hesapla kabul testi

İki ayrı tarayıcı profili/oturumu kullan: A isteyen, B hedef. Testleri kendine ait hesaplarla yap; aşağıdaki işlemler gerçek takip kaydı yazar.

1. B gizliyken A, B'nin `public.profiles.username` değerini arayıp **Takip et** seçer. A'da **İsteği iptal et** çıkar; takipçi/takip edilen sayısı artmaz. B'de bekleyen istek canlı görünür. İlişkisiz bir hesap bekleyen isteği API üzerinden göremez.
2. A isteği iptal eder: B'nin açık ekranında istek kalkar. Tekrar iste → B reddet: iki tarafta ilişki kalmaz.
3. Tekrar iste → B kabul et: B takipçi, A takip edilen listesi ve sayıları canlı güncellenir. B'nin özel gönderilerine erişim helper/RLS düzeyinde açılır.
4. B takipçiyi çıkarır veya A takipten çıkar: ilişki iki taraftan kalkar; B gizliyse gönderi erişimi kapanır.
5. Herkese açık bir hedefte A takip eder: istek ekranına düşmeden `accepted` olur. Ayarlar'dan gizlilik değiştirme Parça A kapsamında değildir; mevcut uygulamada gizlilik düğmesi eklenmedi.
6. A/B arasında engel varken her iki yönde takip denemesi reddedilir. Engel eklenince mevcut karşılıklı ilişkiler silinir. Pending veya accepted ilişki engel kontrolünü aşamaz.
7. API'de başka `follower_id`, kendini takip, `status:'accepted'` INSERT, tarih/kimlik UPDATE, takipçi tarafından kabul ve yinelenen çift denemeleri reddedilir. Kabul/ret sırasında eşzamanlı iptal, uydurma başarı yerine yenileme mesajı verir.
8. Sayfa yenileme, bağlantı kesilip geri gelme, aynı hesaba yeniden giriş, farklı hesaba geçiş, TR/EN, açık/koyu, 320/390px ve klavye kullanımını kontrol et. Hata tekrarında taslak arama korunur; hata mesajında ham sunucu verisi gösterilmez.

## Testlerin sınırı ve diğer parçalar

Yerel SQL testleri gerçek üretim katalog çıktısını fixture olarak kullanır. Realtime mesaj taşıması yerelde stub'dır; iki tarayıcıyla gerçek Broadcast teslimi, migration uygulandıktan sonra doğrulanmalıdır. Browser testleri izole Supabase mock endpoint'i kullanır; canlı hesap veya veri değiştirmez.

Kontrol komutları: `npm test`, `node scripts/sql/verify-follow-requests.cjs`, `npm run typecheck`, `npm run check:i18n`, `npm run test:ui`, `npm run test:security`, `npm run build`, `npm run format:check`. SQL verifier mevcut yerel `.nx/sql-verification` PGlite çalışma ortamını kullanır. Ham static auditor Angular `(click)` bağlarını tanımadığı için 16 yanlış olumlu bildirir; projedeki yalnızca Angular event tanımasını ekleyen adaptörle strict sonuç 0 bulgudur.

Son doğrulama: **136 birim testi, 15 SQL senaryosu, 118 tarayıcı senaryosu ve 10 production güvenlik senaryosu geçti.** Typecheck, 515 eşleşen TR/EN anahtarı, Prettier ve production derlemesi başarılı. Tarayıcı testleri açık/koyu, TR/EN, 320/390/1440px, klavye, gerçek SDK istek şekilleri, hata/tekrar deneme, yavaş eski arama, sayfalama ve migration öncesi yazım engelini kapsar. SQL testleri tekrar kurulum, geri alma, engel/gizlilik çatışmaları, rol/kolon yetkileri ve farklı mesaj topic'leri üzerinden sahte erişim denemelerini kapsar. Gerçek ağ üzerinden Broadcast teslimi canlı migration sonrasındaki iki hesap testine kalır.

Production build başlangıç boyutu 732,92 kB: 700 kB uyarı eşiği aşılıyor, 1 MB hata eşiği aşılmıyor. Bütçe ayarı büyütülmedi.

Parça B–F uygulanmadı. Sağlanan mevcut `posts_insert_target_visible` koşulunda `p.id = p.parent_id` / `p.id = p.repost_of_id` iç alias'a bağlanıyor; bu Parça D'de ele alınmalı. Mevcut gönderi servisinde de yeni üretim şemasından farklı tarih/sabitleme/sayaç alanları bulunuyor; bu çalışmada gönderi akışı yeniden yazılmadı. `blocks` tablosundaki geniş yetkiler, Parça E'nin ayrıca denetleyeceği konudur. Public `uploads` kararı aynı kaldı; bilinen dosya URL'sini engelleme geri alamaz.

## Geri alma

Önce ilgili frontend sürümünü geri al veya takip yazımlarını kapat; ardından [rollback SQL](/C:/Users/elifr/source/project/web/KampüsX/docs/supabase/15-follow-requests-rollback.sql) dosyasını çalıştır. İlk migration öncesi policy/ACL snapshot'ı geri getirilir. Kullanıcı ilişkileri ve status değerleri korunur; pending satırlar kendiliğinden accepted yapılmaz. Sonradan başka permission migration'ı çalıştırıldıysa geri almadan önce yetki farkını incele. Rollback ilk durumdaki geniş yetkileri de geri getireceğinden yalnızca sürüm geri dönüşü içindir.
