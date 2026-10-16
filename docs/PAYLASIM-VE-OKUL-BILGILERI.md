# Paylaşım ve okul bilgileri

## Canlı profil görselleri doğrulandı — 16 Ekim 2026

Kullanıcının 06 numaralı sorgu sonucu uploads için `was_public: false`, `public: true` değerlerini gösterdi.
Private bucket nedeni böylece doğrulandı. Daha önce 400 NoSuchBucket dönen aynı kapak URL'si artık
HTTP 200 ve image/jpeg döndürüyor. Yerel uygulama yenilenip profil sayfası açıldığında kapak (880 px) ve avatar
(1200 px) img öğeleri complete=true ve naturalWidth>0 ile yüklendi; ekran görüntüsünde her ikisi de görüldü.
Kaydedilmiş dosyalar yeniden yüklenmedi; yalnızca mevcut sayfa ve public URL'ler okundu. Bu doğrulama profil
fotoğrafı/kapak görüntüleme sorununu kapatır; public.posts yayın izinlerine ilişkin bir sonuç içermez.

## Kayıt başarılı, görsel açılmıyor — 16 Ekim 2026

Kullanıcı 05 numaralı SQL'i uyguladıktan sonra üç authenticated policy sonucunu paylaştı; ardından kaydetmenin başarılı
olduğunu fakat profil fotoğrafı/kapak görselinin görünmediğini bildirdi.
Gerçek yerel tarayıcıdaki düzenleme ekranında kapak img etiketinin mevcut URL'si okundu; `complete: true`,
`naturalWidth: 0` idi. Aynı tam public URL'ye yapılan salt okunur HTTP isteği `400` ve
`{"code":"NoSuchBucket","message":"Bucket not found"}` döndürdü. Görselin kendisi indirilmedi/saklanmadı;
oturum veya token okunmadı. Bu, profil URL kaydından farklı olarak public dosya sunumunun başarısız olduğunu doğrular.

`getPublicUrl` bucket'ın public olduğunu doğrulamaz; yalnızca adres üretir:
[Supabase getPublicUrl](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl).
Bucket mevcut ve yükleme başarılıysa private ayarı bu sonuçla uyumludur; mevcut bucket metaverisi doğrudan
görülmediği için public=false olduğu henüz kesinleşmemiştir. Yanlış proje/bucket ve sonradan değişen ayarlar da
kontrol edilmelidir; bu yanıt tek başına nesnenin eksik olduğunu kanıtlamaz.

[06-uploads-public-access.sql](supabase/06-uploads-public-access.sql) mevcut public medya sözleşmesini uygular:
yalnızca uploads bucket'ının public bayrağını açar; önceki `was_public` ve yeni `public` değerini döndürür.
Bucket yoksa yeni bir tane oluşturmadan transaction içinde durur. Diğer bucket'lar, boyut/MIME sınırları, dosyalar,
public.profiles/public.posts satırları ve yazma policy'leri değişmez. Public dosyaların URL'sine sahip herkes onları
görüntüleyebilir; özel içerikler için bu sözleşme kullanılmamalıdır. Bu ayar yükleme/silme erişimi sağlamaz.

Dosya henüz canlıda uygulanmadı; public=true ve HTTP 200 görsel yanıtı ile tarayıcıda naturalWidth > 0 sonucu
uygulamadan sonra doğrulanmalıdır. Bu incelemede frontend veya auth kodu değiştirilmedi.
Sorgu bellekteki PostgreSQL ortamında 4 kontrolden geçti: uploads public bayrağı değişir ve önceki değer raporlanır;
diğer bucket/MIME/boyut ayarları korunur; tekrar uygulama güvenlidir; eksik bucket için yenisi oluşturulmadan durur.

## Profil fotoğrafı hatasının doğrulanan nedeni ve düzeltmesi — 16 Ekim 2026

Kullanıcının SQL teşhis çıktısı `public.profiles` için RLS'nin açık, policy listesinin ise boş olduğunu doğruladı
(`rls_enabled: true`, `policies: null`). `user_id` UUID primary key ve Auth kullanıcısına foreign key;
avatar_url/banner_url nullable text. Diğer tek zorunlu alan created_at'ın varsayılanı var.
Dolayısıyla mevcut üç alanlı INSERT sözleşmesinde eksik zorunlu alan görünmüyor.

Policy olmaması oturumlu SELECT/UPDATE isteklerini satırsız sonuçlandırır; istemcinin eksik profil için yaptığı INSERT
RLS nedeniyle reddedilir. Storage INSERT kuralı bu ayrı tabloya erişim sağlamaz.

**Uygulanacak dosya:** [05-profile-media-permissions.sql](supabase/05-profile-media-permissions.sql).
SQL Editor → New query içine dosyanın tamamı yapıştırılarak Run seçilir. Son SELECT sonucunda authenticated rolüne ait
SELECT/INSERT/UPDATE için üç policy görünmelidir. Ardından yerel uygulamada profil sayfası yenilenip fotoğraf kaydı denenir.

Dosya yeni tablo/sütun oluşturmaz, mevcut veri satırlarını değiştirmez. RLS açık kalır; public.profiles üzerindeki geniş
anon/PUBLIC/authenticated tablo ve sütun grant'leri kaldırılıp güncel medya akışının kullandığı minimum erişim verilir:
authenticated için user_id/avatar_url/banner_url SELECT/INSERT ve yalnızca avatar_url/banner_url UPDATE.
Üç policy de `auth.uid() = user_id` koşulunu uygular. Böylece istemci başka sahibin profilini okuyamaz/yazamaz,
user_id veya diğer alanları değiştiremez ve tabloyu silemez/TRUNCATE edemez. DB sahibi/service_role izinleri korunur.
Güncel üniversite/bölüm güncellemesi Auth metaverisini kullanmaya devam eder; bu dosya diğer profil alanlarının kalıcılık
sözleşmesini genişletmez. Storage ve posts izinleri bu dosyadan etkilenmez.

Tablo türleri/RLS durumu farklıysa, ek zorunlu sütun veya başka bir profiles policy varsa dosya transaction içinde
değişiklik yapmadan durur. Sadece kendi üç policy adı varsa tekrar çalıştırılabilir.

Doğrulama: `node scripts/sql/verify-profile-media-policies.cjs` komutuyla PGlite 0.5.10'un gerçek, bellekte çalışan
PostgreSQL motorunda 14 kontrol geçti. Test düzeneği paylaşılan sütun/kısıt/geniş grant yapısını ve sentetik kullanıcıları
oluşturdu; Supabase'e bağlanmadı. Aynı hatanın öncesi, başarılı own SELECT/UPDATE/INSERT, başka kullanıcıya erişim reddi,
anonim erişim reddi, sütun sınırları, DELETE/TRUNCATE reddi, service_role erişiminin korunması, tekrar uygulama ve guard'ların
transaction içinde durması doğrulandı. Yardımcı test bağımlılığı yalnızca Git dışındaki `.nx/sql-verification` klasörüne
kuruldu; uygulama package.json/package-lock.json bağımlılıkları değişmedi. Test kurulum komutu script'in başında bulunur.

Bu doğrulama canlı Supabase'e uygulama yapıldığı anlamına gelmez. Kullanıcının SQL'i çalıştırması ve gerçek fotoğraf
kaydını tekrar denemesi hâlâ gereklidir. Bu teşhis profil fotoğrafı kaydına aittir; public.posts izinlerinin doğrulandığı
ve gönderi paylaşımının canlıda başarıyla tamamlandığı anlamına gelmez.

## Güncel hata: profil URL kaydı — 16 Ekim 2026

Kullanıcı güncel arayüzden şu mesajı bildirdi: “Üniversite ve bölüm kaydedildi; fotoğraflar kaydedilemedi.”
Bu mesaj ProfileService içinde Auth metaverisi güncellemesi başarılı olduktan sonra ProfileRepository.save
başarısız olursa üretilir. Yeni seçilen bir fotoğraf varsa Storage upload bu aşamadan önce tamamlanmıştır.
Dolayısıyla bu denemedeki inceleme noktası `public.profiles` UPDATE / gerekiyorsa INSERT / doğrulama SELECT işlemidir.
Storage ekranları bu tabloya ait RLS veya sütun izinlerini göstermez.

Olası sebepler tablo/sütun grant'leri, SELECT/UPDATE/INSERT RLS kuralları, eksik zorunlu sütun veya bir tablo kısıtıdır.
Hangisi olduğu henüz doğrulanmadı. [Sadece profil tablo metaverisini okuyan sorgu](supabase/04-profile-save-diagnostics.sql)
bu ayrımı yapmak için hazırlandı; kullanıcı verisi okumaz veya herhangi bir yapı/veri değiştirmez.
Canlı izinleri bilinmeden yeni policy eklenmedi ve RLS kapatılmadı. Storage güvenlik daraltması bu profil hatasının
çözümü olarak uygulanmamalıdır; ayrı bir bulgudur.

## Ekran görüntüsüyle doğrulanan policy durumu — 16 Ekim 2026

Kullanıcının paylaştığı iki düzenleme ekranında `Insert Policy 1va6avm_0` ve `Select Policy 1va6avm_0`
kuralları yalnızca `bucket_id = 'uploads'::text` koşuluna sahip. Target roles boş; arayüzün belirttiği varsayılan
PUBLIC rolüdür. Görünen INSERT kuralı kendi başına uygulamanın kullanıcı/purpose/dosya yolunu engellemez.
Dolayısıyla “INSERT policy yok” teşhisi bu görüntülerle elenmiştir; canlı hata kodu hâlâ gereklidir.
Başka restrictive policy'ler, bucket tür/boyut sınırları ve proje eşleşmesi bu ekranlarda görünmez.

Görünen INSERT izni kullanıcı/klasör sahipliğiyle sınırlandırılmamış. SELECT kuralı da bucket listelemesini
anonim erişime açabilecek kadar geniştir. [Mevcut kuralları daraltan dosya](supabase/03-secure-existing-uploads-policies.sql)
yalnızca bu iki policy'yi `authenticated` ve kendi kullanıcı klasörüyle sınırlar; yeni tablo/policy oluşturmaz.
Farklı ad veya ek Storage policy varsa güvenle durur. Public URL üzerinden görsellerin sunumu devam eder.
Bu düzenleme hazırlık olarak kaydedildi; uzak veritabanında çalıştırılmadı ve yükleme hatası için doğrulanmış bir çözüm olarak sunulmaz.

`02-uploads-insert-policy.sql` mevcut policy olmayan kurulumlar içindir ve bu proje için uygulanmamalıdır.
Sonraki tanı adımı güncel yerel uygulamadaki oturumlu yüklemenin hata mesajı/kodudur;
gerekirse Storage Logs üzerinden ilgili başarısız isteğin yalnızca durum/kod/mesajı incelenir.
Token, Authorization başlığı, çerez veya HAR dosyası paylaşılması gerekmez.

## Yükleme hatası

“Dosya yüklenemedi…” mesajı, `uploads` Storage yüklemesi başarısız olduğunda gösteriliyordu.
Bu aşamada `posts` INSERT yapılmaz. Mesaj tek başına hatanın izin, bucket, boyut, tür veya bağlantı kaynaklı olduğunu kanıtlamaz.

MediaService artık Supabase'in hata kodunu güvenli TR/EN mesajlara ayırır. Ham sunucu mesajları, tokenlar ve dosya içeriği loglanmaz.
Dosya seçimi/taslak korunur. İzinler devre dışı bırakılmaz ve frontend'e yönetici anahtarı konmaz.

Supabase → Storage → Files bölümünde bucket adının tam olarak `uploads` olduğunu kontrol edin.
Public bucket dosya okumasını açar; oturum açanlara yükleme izni ayrıca `storage.objects` INSERT policy ile verilir:
[Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

- **Yükleme izni reddedildi:** Storage → Policies altında `uploads` için INSERT iznini inceleyin.
  Yol biçimi `USER_ID/post/UUID.png` (profilde `USER_ID/avatar/UUID.png` veya `USER_ID/banner/UUID.png`).
  İlk klasör `auth.uid()` ile eşleşmelidir.
  Hiç Storage INSERT/ALL policy yoksa [dar kapsamlı izin dosyası](supabase/02-uploads-insert-policy.sql) kullanılabilir.
  Bu dosya tablo oluşturmaz; anonim yükleme, overwrite veya delete izni vermez. Mevcut INSERT/ALL policy varsa işlem durur;
  diğer bucket/kuralların davranışını değiştirmeden mevcut ifade ayrıca incelenmelidir.
- **Depolama alanı bulunamadı/erişilemiyor:** Bucket adı ve projenin doğru olduğunu kontrol edin. Bucket yönetim API'sinin anonim
  `NoSuchBucket` yanıtı tek başına bucket'ın gerçekten olmadığını kanıtlamaz; yönetim metaverisi policy ile gizlenebilir.
- **Boyut/tür reddi:** Bucket ayarlarında dosyanın MIME türüne ve boyutuna izin verildiğini kontrol edin.
  Uygulama görsellerde 5 MiB, videolarda 50 MiB üst sınır uygular; bucket daha düşük sınır koyabilir.
- **Oturum:** Yeniden giriş yapın. **Bağlantı/limit:** Bağlantıyı düzeltin veya limitin açılmasını bekleyin.

Bu incelemede canlıya dosya veya gönderi yazılmadı, policy çalıştırılmadı. Mevcut yönetim bağlantısı olmadığı için
canlı bucket policy'si ve gerçek yüklemenin başarılı olduğu doğrulanamadı. Yerel testler sahte HTTP sınırında gerçek SDK akışını çalıştırır.

## Üniversite ve bölüm

Profil → Profili Düzenle içinde her iki alan da değiştirilebilir (zorunlu, en fazla 150 karakter).
Mevcut kayıt akışıyla aynı `auth.updateUser({ data: { university_name, department_name } })` alanlarına kaydedilir:
[Supabase updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser).

Kaydetme doğrulanmadan başarı gösterilmez. Başarılı değişiklik profil/yan menüde anında görünür ve sayfa yenilemesinde korunur.
Kullanıcı adı, fakülte ve roller bu işlemle değiştirilemez. Bunlar kullanıcının beyan ettiği okul bilgileridir;
yetkilendirme veya doğrulanmış öğrenci/üniversite üyeliği için kullanılmaz.
Yeni tablo veya sütun gerekmez; mevcut `public.profiles` medya alanları ile `public.posts` yapısı korunur.
Auth metaverisi ve profil fotoğrafları farklı servislerde olduğundan tek transaction değildir. Okul kaydı başarılı,
fotoğraf kaydı başarısız olursa arayüz bu kısmi sonucu açıkça belirtir.

## Doğrulama — 15 Ekim 2026

- `npm test`: 101 test başarılı.
- `npm run typecheck`, `npm run check:i18n` (392 eşleşen anahtar), `npm run format:check`: başarılı.
- `npm run build`: başarılı; 18 JavaScript dosyası production çıktı kontrolünden geçti.
- `npm run test:ui`: 81 senaryo çalıştırıldı. İlk turda 75 geçti. Yeni testlerin SDK'nın eklediği boş PKCE alanlarını
  hesaba katmayan dört beklentisi ve bulunmayan toast için kullanılan bir beklenti düzeltildi; uygulamadaki başarı/hata
  davranışı korunarak metaveri allowlist'i ve toast yokluğu doğrulandı. Kaynak değişikliği sırasında HMR ile kesilen
  bir axe taraması da yeniden çalıştırıldı. `npm run test:ui -- --last-failed`: kalan 6 senaryo geçti.
- `npm run test:security`: güncel production derlemesinde 9 test başarılı (CSP, XSS, fotoğraf önizleme, oturum).
- Profil düzenleme TR/açık ve EN/koyu ekran görüntüleri incelendi; dört dil/tema kombinasyonunda axe ve taşma kontrolleri geçti.
- DESIGN.md lint: 0 hata/uyarı. Strict statik denetimde mevcut Angular `(click)` bağlamalarını tanımayan 14 bulgu var;
  mevcut Angular tanıma adaptörüyle aynı denetim 0 hata/uyarı verdi. Diğer kurallar değiştirilmedi.
- Gerçek yerel uygulama `http://127.0.0.1:4200/` üzerinde başlatıldı. E2E testleri ayrı 4300, production testleri 4400 portunda
  çalıştı; test oturumları ve dosyaları gerçek Supabase'e gönderilmedi.

Canlıya yönelik salt okunur kontrollerde OpenAPI metaverisi 401, anonim bucket yönetim isteği `NoSuchBucket` döndü.
Bu yanıt yönetim erişimi olmadığı için bucket yokluğunu/izin kuralını kesinleştirmez. Kullanıcının canlı Storage policy
ifadesi ve oturumlu yüklemenin gerçek hata kodu hâlâ görülmelidir. Hazırlanan SQL uygulanmadı; commit/push yapılmadı.
