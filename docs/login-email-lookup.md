# Girişte kullanıcı yok / yanlış bilgiler ayrımı

12 Ekim 2026. Kullanıcının açık isteğiyle giriş ekranı kayıtlı olmayan e-posta ile yanlış bilgileri ayırır.

## Davranış

- Supabase giriş başarılıysa mevcut gerçek oturum/dashboard akışı devam eder; ek sorgu yapılmaz.
- Yalnızca `invalid_credentials` hatasında `public.kampusx_login_email_exists` çağrılır.
- Veritabanı `false` döndürürse **Böyle bir kullanıcı yok.** gösterilir.
- Veritabanı `true` döndürürse **E-posta veya şifre yanlış. Bilgilerini kontrol et.** gösterilir.
- Fonksiyon eksikse, istek başarısızsa veya yanıt boolean değilse **Hesap kontrolü tamamlanamadı. Lütfen tekrar dene.** gösterilir. Bağlantı hatası, kullanıcı yok olarak değerlendirilmez.
- E-posta doğrulama ve hız sınırı hataları kendi mesajlarını korur. Sorgu 5 saniyede zaman aşımına uğrar; uygulamaya yeni deneme bekleme süresi eklenmez.
- Mesajların Türkçe ve İngilizce karşılıkları sözlüklere eklenmiştir; form görünümü ve temalar korunur.

## Supabase'de uygulanması gereken SQL

Projede şu dosya hazırlanmıştır:

`supabase/migrations/20261012174500_login_email_lookup.sql`

KampüsX Supabase projesinde **SQL Editor → New query** açıp dosyanın tamamını yapıştırarak **Run** ile çalıştır. Dosya yeni bir fonksiyon ekler; tablo veya kullanıcı silmez. Ardından local giriş ekranında ayrım gerçek veritabanı sonucuna göre çalışır. Vercel için uygulama kodunun da yeni sürümü dağıtılmalıdır.

SQL'in uzak projeye uygulanmış olduğu otomatik olarak varsayılmaz. Normal uygulama gerçek Supabase bağlantısını kullanır; otomatik tarayıcı testleri izole E2E bağlantısında mock yanıtlarla çalışır.

## Yetki ve veri sınırı

Fonksiyon yalnızca tek bir e-postanın aktif hesapla eşleşip eşleşmediğini boolean olarak döndürür. User ID, profil, hash, şifre veya rol döndürmez; `auth.users` için tablo okuma izni verilmez. Sabit ve boş `search_path` ile `auth.users` tam şema adıyla kullanılır. Fonksiyon yürütme izni yalnızca `anon` ve `authenticated` rollerine verilir; diğer fonksiyonların izinleri değiştirilmez. Silinmiş hesaplar eşleşmez.

Bu ürün tercihi, dışarıdan verilen bir e-postanın kayıtlı olup olmadığının anlaşılmasına izin verir. Anonim RPC doğrudan da çağrılabilir; normal girişin hız sınırı bu RPC için bağımsız bir kötüye kullanım sınırı oluşturmaz. Daha önceki genel hata mesajının gizlilik özelliği bu ayrımda korunmaz. Bu değişiklik, kullanıcının özellikle istediği davranışı uygular.

Tarayıcıya yeni gizli anahtar eklenmez. Parola yalnızca mevcut Supabase Auth giriş isteğine gönderilir; hesap varlığı sorgusuna gönderilmez.

## Yerel SQL doğrulaması

İzole PostgreSQL motoru için `npm install --prefix .nx/login-sql-verification --no-save --package-lock=false @electric-sql/pglite` ardından `node scripts/verify-login-email-lookup.cjs` çalıştırılır. Paket yalnızca Git'in yok saydığı test dizinine kurulur; proje bağımlılıkları değişmez. Sonuç `docs/login-email-lookup-sql-verification.json` dosyasına yazılır.
