# Profil ve takip güncellemesi — 16 Ekim 2026

Kayıt formu isim, kullanıcı adı, bio, üniversite, fakülte/yüksekokul ve bölüm sırasını kullanır. Bio isteğe bağlıdır; diğer beş bilgi zorunludur. E-posta, şifre ve onay alanları devam eder. Fakülte Auth kullanıcı metadatasındaki `faculty_name` alanına yazılır. Bu beyanlar okul doğrulaması veya yetki değildir.

Profil düzenleyicide Hesap bilgileri başlığı en üsttedir. Kullanıcı adı ve fakülte salt okunurdur. İsim/bio ve üniversite/bölüm bilgileri Auth üzerinden kalıcı kaydedilir. Fotoğraf URL'leri mevcut `public.profiles` tablosundaki `avatar_url` ve `banner_url` sütunlarında, `user_id` ile tutulmaya devam eder. Bu iki ayrı kaydın biri başarısız olursa kısmi başarı mesajı verilir; taslak korunur.

Avatar kamerasının konumu korunur. Silme çarpısı fotoğrafın merkezinde, yarı saydam bir kontrol olarak hover veya klavye odağında görünür. Dokunmatik cihazlarda erişilebilir kalması için görünürdür. Fotoğraf formatı/boyut açıklaması ve istenmeyen hesap açıklamaları düzenleyiciden çıkarıldı. Doğrulama hataları kaldırılmadı.

Fotoğraf seçimi henüz yükleme yapmaz. Tarayıcı resmi çözer; avatarı en fazla 640×640, kapağı en fazla 1920×1080 boyutuna oranını koruyarak küçültür. Gerektiğinde WebP olarak en fazla 1 MiB'ye sıkıştırır. Küçük orijinaller korunur. Kaynak dosyalarda 20 MiB ve 32 megapiksel koruması vardır. Kaydet, mevcut güvenli yükleme ve URL kayıt akışını kullanır.

## Supabase'de yapılacak tek yeni kurulum

1. SQL Editor → New query aç.
2. `docs/supabase/07-realtime-follows.sql` dosyasının **tamamını** yapıştır.
3. Run seç. Bu kurulum **bir defa** çalıştırılır. Aynı isimde tablo zaten varsa hiçbir değişiklik yapmadan durur.
4. Uygulama profil sayfasını yenile. İlişki yoksa gerçek sayılar `0` görünür. Tablo kurulmadıysa `—` ve yeniden deneme mesajı görünür.

Bu SQL yalnızca onaylanan `public.user_follows` tablosunu ve onun erişim/Realtime kurallarını kurar. `profiles`, `posts`, Storage, Auth tablolarını veya mevcut satırları değiştirmez. Var olan ilişkileri silmez. Yeni frontend ortam değişkeni veya gizli anahtar gerekmez; mevcut publishable key ve oturum kullanılır.

`follower_id` takip eden, `followed_id` takip edilen kullanıcının `auth.users.id` değeridir. İlişkinin iki tarafı kendi ilişkisini okuyabilir; yalnızca takip eden ekleyebilir/silebilir. Kendini takip ve yinelenen ilişki veritabanında engellenir. İki kullanıcıya özel Broadcast kanallarına kişisel veri içermeyen değişiklik bildirimi gider. Frontend iki kesin sayıyı yeniden okur. Bağlantı koptuğunda bunu belirtir; yeniden bağlanınca kaçırılan değişiklikleri okur. Çıkışta kanal, zamanlayıcı ve istek temizlenir.

Mevcut `/profile` kişinin kendi profilidir. Başka kullanıcı profilleri/dizin ve Takip et düğmeleri bu değişikliğe eklenmedi. Serviste güvenli `setFollowing(targetUserId, true/false)` metodu hazırdır; başka kullanıcı giriş noktası eklendiğinde kullanılabilir. Sayılar Supabase'de gerçekten bulunan ilişkilere dayanır.

## Doğrulama kapsamı

Birim testleri oturum değişimi, geç kalan yanıt, takip yazma sahipliği, hata/tekrar deneme, yeniden bağlantı ve kanal temizliğini denetler. Yerel PostgreSQL testleri gerçek SQL'i çalıştırıp rol ve RLS izin/ret durumlarını denetler; Broadcast gönderimi bu testte taklit edilir. Tarayıcı testleri gerçek SDK'nın HTTP/WebSocket sınırlarını taklit ederek TR/EN, iki tema, mobil başlık, alan sırası, fotoğraf küçültme, kalıcı isim/bio ve canlı sayı güncellemesini denetler. Üretim verisine deneme gönderisi, takip ilişkisi veya fotoğraf eklenmez.

Canlı Supabase projesinde SQL'in uygulanması ve iki gerçek hesapla uçtan uca Realtime teslimatı bu yerel testlerin dışında kalır.

16 Ekim doğrulama sonucu: 110 birim testi, 89 ayrı arayüz senaryosu (ilk koşum ve gerekli tekrarlar birlikte), 9 üretim güvenlik testi ve 10 takip SQL izin/ret kontrolü geçti. Eksik CORS yanıt başlıkları ve HEAD isteklerini yazma sayan eski test beklentileri düzeltildi. Bir tarayıcı oturumu zaman aşımı aynı senaryonun tekrarında geçti. TypeScript, 405 TR/EN anahtarı, Prettier ve üretim çıktı doğrulaması başarılı. Tasarım sözleşmesi lint kontrolü temiz; statik denetleyicideki Angular olay sözdizimi yanlış pozitifleri, yalnızca o sözdizimini tanıyan mevcut adaptörle denetlendi. Derlemede başlangıç paketi 703,97 kB; 700 kB uyarı eşiğini yaklaşık 4 kB aşıyor, derlemeyi durduran hata yok.

Uygulama biçimi için resmi kaynak: [Supabase özel Realtime kanalları ve yetkilendirme](https://supabase.com/docs/guides/realtime/authorization), [veritabanından Broadcast](https://supabase.com/docs/guides/realtime/broadcast).
