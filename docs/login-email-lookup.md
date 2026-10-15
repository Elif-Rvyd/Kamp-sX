# Hesap varlığı sorgusu kaldırıldı — 15 Ekim 2026

Kullanıcının güvenlik kararıyla kayıtlı olmayan e-posta ve yanlış şifre aynı mesajı gösterir:

- TR: **E-posta veya şifre yanlış. Bilgilerini kontrol et.**
- EN: **The email or password is incorrect. Check your details.**

AuthService artık hesap varlığı RPC'sini çağırmaz. Eski RPC'nin eksik, hatalı veya kapalı olması giriş akışını etkilemez. Ağ, kota ve e-posta doğrulama hataları uygun mesajlarını korur. Başarılı gerçek giriş dashboard'u açmaya devam eder.

## Supabase'de kalan adım

Uygulamadan sorguyu kaldırmak, önceden açılmış bir RPC'nin doğrudan çağrılmasını engellemez. Supabase projesinde **SQL Editor → New query** aç; `supabase/migrations/20261015180000_disable_login_email_lookup.sql` dosyasının TAM içeriğini yapıştır ve **Run** ile çalıştır.

Dosya yalnız `public.kampusx_login_email_exists(text)` fonksiyonunun EXECUTE yetkisini PUBLIC, anon ve authenticated rollerinden kaldırır; PostgREST şema önbelleğini yeniler. Tablo, kullanıcı, dosya veya satır oluşturmaz/değiştirmez/silmez. Fonksiyon hiç kurulmadıysa işlem güvenle atlanır. Tekrar çalıştırılabilir. Bu dosya canlı Supabase'de otomatik uygulanmadı.

`20261012174500_login_email_lookup.sql` tarihsel migration'dır. **Tek başına tekrar çalıştırma:** eski erişimi yeniden açar. Sıfırdan migration çalıştırıldığında en son kapatma migration'ı da uygulanmalıdır. 12/14 Ekim raporları ve eski dashboard kaynak dökümleri tarihsel sürümü anlatır; güncel davranış bu belgededir.

## Doğrulama

- Servis ve tarayıcı testleri hatalı girişte RPC isteği gönderilmediğini, TR/EN ortak mesajı, tekrar denemeyi ve başarılı giriş yönlendirmesini doğrular.
- Production çıktı kontrolü eski RPC ismi bulunan JavaScript'i reddeder; eski sorgu yanlışlıkla geri gelemez.
- `node scripts/verify-login-email-lookup.cjs`, önceden kurulu yerel PGlite motorunda eski davranışı kurup kapatma migration'ını test eder: anon/authenticated çağrıları 42501 ile reddedilir; kullanıcı kayıtları korunur; migration fonksiyon yokken de tekrar uygulanır. Kanıt `login-email-lookup-sql-verification.json` içindedir. Gerçek Supabase'e bağlanmaz.

İstemci değişikliği için uygulamanın yeni sürümü dağıtılmalıdır; SQL işlemi bunun ayrı sunucu adımıdır.
