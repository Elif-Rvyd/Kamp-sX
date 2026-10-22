# KampüsX bire bir mesajlaşma — 22 Ekim 2026

Bu belge ilk mesajlaşma kurulumunu kaydeder. Aynı gün eklenen gönderi paylaşımı, `kx_inbox_v2`, görüntülenme sayacı ve son doğrulama sonuçları için [sosyal yayın raporuna](SOSYAL-YAYIN-2026-10-22.md) bakın.

Verdiğin teşhis çıktısında iki mesaj tablosu ve RPC’ler yoktu. SQL 27 bu sözleşmeyi kurdu;
canlıda çalıştırdığını `messaging_contract_version = 2026102201` sonucuyla doğruladın.
Ardından Supabase CLI ile `djhezivksrvcyqxzpiau` projesinin gerçek `public` tipleri üretildi.
Üretim ortamına test kullanıcısı veya mesaj eklenmedi. Commit/push yapılmadı.

## Eklenen akış

- Yan menüde Mesajlar → gelen kutusu; gerçek boş durum, son mesaj, tarih ve okunmamış rozeti.
- Profilde Mesaj → yalnızca sunucudan izin gelirse etkin. `kx_can_message` hiçbir sohbet oluşturmaz;
  tıklamak `kx_start_conversation({other})` çağırır ve aynı bire bir sohbeti açar.
- Sohbet → mesaj balonları, tarih ayırıcıları, önceki mesajları 50’şer yükleme,
  Ctrl/Cmd+Enter ile gönderme, TR/EN ve açık/koyu tema, mobil/klavye desteği.
- Gönderim yalnızca `{conversation_id, content}` içerir. 1–2000 karakter ve boşluk dışı içerik gerekir.
  `sender_id`, `created_at` ve kimlik sunucuda oluşur. Metin HTML olarak yorumlanmaz.
- Kendi mesajını silmek onay ister; yalnızca `deleted_at` güncellenir. Trigger içeriği boşaltır,
  iki tarafta “Bu mesaj silindi” görünür. Kalıcı DELETE veya “yalnız benden sil” yoktur.
- Açık ve görünür sohbette `kx_mark_read({conv})` çağrılır; gizli tarayıcı sekmesi okundu sayılmaz.

## Yetki ve veri güvenliği

Yeni tabloların varsayılan geniş istemci izinleri kaldırıldı. Sohbet oluşturma yalnızca RPC üzerinden;
mesaj yazma yalnızca iki INSERT sütunu ve silme yalnızca bir UPDATE sütunu üzerinden yapılabilir.
Anonim erişim, kalıcı silme, TRUNCATE ve doğrudan sohbet oluşturma verilmez.

En az bir yönde kabul edilmiş takip gerekir; bekleyen istek yeterli değildir. İki yöndeki engel
kontrol edilir. Takip bitince gönderim kapanır, geçmiş okunabilir. Engellenmiş çiftin sohbeti,
mesajları ve gelen kutusu kayıtları RLS/sunucu sorguları tarafından görünmez olur.
İstemci bir engel listesiyle sonuçları sonradan filtrelemez. Mevcut akademik görünürlük
politikaları değiştirilmez; mesajlaşma izni kendi sözleşmesindeki takip/engel kuralına dayanır.

Başlatma/gönderme, mevcut takip-engel çift kilidini kullanır. Kabul edilmiş takip satırı ayrıca
kilitlenir; eşzamanlı takipten çıkma, gönderim yetkisi kontrolünü atlayamaz. Bu kilitlerin çok oturumlu
yük testi yapılmadı; yerel testler yetki sonuçlarını doğrular.

Yardımcı fonksiyonlar private şemasında, SECURITY DEFINER fonksiyonlar `search_path=public`
ile ve tam tablo adlarıyla çalışır. Gerekli fonksiyonlar authenticated rolüne açılır; PUBLIC/anon
çalıştırma izni kaldırılır. `private` API’ye açılmaz. `service_role` istemciye eklenmez.

`messages` Realtime yayınına alınır; istemci sadece INSERT/UPDATE dinler. Olay geldiğinde içerik,
olay yükünden gösterilmez; RLS’den yeniden okunur. Bu olaylar SELECT yetkisine göre süzülür.
[Supabase Postgres Changes belgesi](https://supabase.com/docs/guides/realtime/postgres-changes).
Takip ilişkisi değişince mevcut özel takip Broadcast akışı okumaları geçersiz kılar;
bu ekrandan yapılan engelleme de yerel okumaları sıfırlar. Sonraki tüm okumalar RLS’den geçer.

Bağlantı dönünce veri yenilenir. Ekran kapanınca, çıkışta veya hesap değişiminde kanal kapanır,
eski okumalar iptal edilir ve geç cevaplar yok sayılır. Yazma isteğinin Authorization başlığı
başlatan oturuma bağlanır; başka hesaba geçiş eski isteği yeni hesap adına gönderemez.
Token yenilenmesi ve bağlantıyı tekrar kurma belirsiz gönderimin kilidini kaldırmaz.
Taslaklar veya mesaj içerikleri yerel depolamaya, loglara veya bildirim tablosuna yazılmaz.

## RPC dönüşleri

`kx_inbox()` satırı: conversation_id, peer_id, peer_username, peer_full_name, peer_avatar_url,
last_content, last_created_at, last_deleted_at, unread_count, can_send.
Son mesajı olmayan sohbetin last_* alanları null olabilir. Silinen mesaj okunmamış sayılmaz.
`kx_mark_read` başarıda true; `kx_start_conversation` UUID; `kx_can_message` boolean döner.
CLI, trigger’ın doldurduğu sender_id alanını INSERT için zorunlu üretir. Bu nedenle dar istemci
Insert tipi, üretilmiş tipten yalnızca gerçekten yazılabilir iki sütunu seçer; üretilmiş dosya
elle değiştirilmez. SQL fonksiyon çıktısındaki nullable alanlar ayrıca belirtilir.

## Geri alma

Önce mesajlaşma ekranları olmayan önceki istemci sürümüne dönülür. Sonra SQL Editor’da
`docs/supabase/27-direct-messaging-rollback.sql` dosyasının tamamı çalıştırılır.
Bu dosya RPC/istemci yetkilerini ve yayın üyeliğini kapatır; sohbet ve mesaj satırlarını silmez.
Tekrar SQL 27 çalıştırmak korunmuş verilerle kurulumu açar. İki tabloda farklı bir kurulum varsa
SQL 27 işlem yapmadan hata verir. Bucket ve mevcut sosyal tablolar değişmez.

## İki hesapla kabul testi

1. A ve B arasında takip yokken Mesaj kapalı olmalı; yalnızca pending istek de açmamalı.
2. A → B kabul edilmiş takip varken iki hesap da diğerinin profilinden aynı sohbeti açabilmeli.
3. İki farklı tarayıcıda mesaj gönder: açık sohbette canlı görünmeli; kapalı sohbette gelen kutusu
   okunmamış sayısı artmalı. Sohbet açılınca okundu sayısı sıfırlanmalı.
4. A kendi mesajını silerken önce iptal et: içerik kalmalı. Onayla: iki tarafta silindi yazmalı.
   B, A’nın mesajını silememeli.
5. Tek kabul edilmiş takibi kaldır: iki tarafta yeni mesaj gönderilememeli, eski sohbet okunabilmeli.
6. Tekrar takip kurup A’dan B’yi engelle: iki tarafta sohbet/gelen kutusu görünmemeli,
   doğrudan sohbet URL’si de içerik göstermemeli. Engel kalkınca takip kendiliğinden geri gelmez.
7. İnterneti kapatıp aç: kaçırılan mesajlar yeniden okunmalı. Gönderim belirsiz kalırsa düğme
   kilitli olmalı; aynı mesajı otomatik olarak tekrar göndermemeli.
8. Taslakla geri dön: onay görünmeli. Çıkış/hesap değişimi eski içerikleri temizlemeli.

## Doğrulama sonuçları

- 10 bağımsız PostgreSQL/PGlite senaryosu: kurulumun tekrar çalışması, anonim/üçüncü kişi reddi,
  tek sohbet, tek yön kabul edilmiş takip, yetkisiz sütunlar, içerik sınırları, okundu/silme,
  takipten çıkma, çift yön engel ve veriyi koruyan rollback.
- 186 birim testi geçti; 10’u yeni mesajlaşma taşıma/oturum/abonelik senaryosu.
- 186 tarayıcı senaryosu doğrulandı: tam koşuda 179 geçti; önceki sözleşmeyi bekleyen 7 test
  güncellendi ve ayrı koşuda 7/7 geçti. Mesajlaşmaya ait 10 senaryonun tamamı tam koşuda geçti.
  Akademik profil testleri artık Auth metadata yazımını değil public.profiles güncellemesini;
  menü testi etkin Mesajlar bağlantısını; kayıt testi üniversite değişince alt alanların sıfırlanmasını sınar.
- Üretim güvenliği tarayıcı testleri 12/12 geçti. Typecheck, 638 TR/EN anahtarı, format ve üretim
  derlemesi geçti. Ham UI denetleyicisi Angular `(click)` sözdizimini tanımayan 16 eski yanlış pozitif
  verdi; mevcut Angular uyarlamasıyla aynı sıkı denetim 0 bulgu verdi. İki temada Axe bulgusu yok.
- Derlemenin başlangıç paketi 861.36 kB: mevcut 700 kB uyarı eşiğini aşıyor, 1 MB hata eşiğinin
  altında. Mesaj ekranları ayrı yüklenen parçalarda. Üretim çıktı güvenliği doğrulaması geçti.

## Kapsam

Bu sürüm metinli bire bir mesajlaşmadır. Medya, grup, bildirim, yalnız kendinden silme ve hız sınırı
eklenmedi. Mevcut public uploads ayarı korunur. Mesajlaşma dışında önceki ekran tasarımları korunur.
