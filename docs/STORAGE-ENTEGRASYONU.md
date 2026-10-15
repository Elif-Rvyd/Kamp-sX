# KampüsX — gerçek profil ve gönderi yükleme

15 Ekim 2026. Angular 22, Supabase JS v2. Kullanıcının doğruladığı sözleşme: `public.profiles.user_id`, `public.posts.user_id`, public `uploads` bucket. Mevcut gerçek Auth kullanılır; yeni bir kullanıcı/şifre tablosu veya service-role anahtarı eklenmez. Canlı veritabanında test gönderisi veya dosyası oluşturulmadı.

## 1. Neler bağlandı?

| İşlem                                | Davranış / kalıcılık                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kayıt                                | Üniversite ve bölüm zorunlu; `university_name`, `department_name` Auth kullanıcı metadata'sına gönderilir. Bunlar yetki kanıtı değildir.                    |
| Profil/kapak seçimi                  | Tarayıcıda geçici blob önizlemesi; henüz ağ yüklemesi yok.                                                                                                  |
| Profil Kaydet                        | Seçilen dosyalar Storage'a yüklenir; dönen URL'ler `profiles.avatar_url` / `banner_url` alanlarına yazılır. Yenilemede bu alanlar veritabanından okunur.    |
| İsim / bio                           | Önceki görsel kapsam korunur: uygulama belleğinde düzenlenir, veritabanına yazılmaz; yenilemede sıfırlanır. Kalıcılık için ayrıca sütun sözleşmesi gerekir. |
| Gönderi Paylaş                       | Gerçek oturumla metin ve/veya tek görsel/video kaydedilir. Sonuç doğrulanınca Keşfet'e dönülür.                                                             |
| Keşfet / Profil Gönderiler           | Supabase'den alınan kayıtlar gösterilir; uygulama sahte profil gönderileri üretmez.                                                                         |
| Üniversite / Kampüs / Bölüm          | Sekmeler ve mevcut görsel alanlar var; gerçek kapsam filtresi henüz yok. Bunun için posts'a kurum ilişkileri gerekir.                                       |
| Yanıt / yeniden paylaşım / etkileşim | Şimdilik işlevsiz. Sayaçlar takipçi/takip edilen için görsel; gönderi adedi gerçek sorgudan gelir.                                                          |

## 2. Dosya akışı ve gerçek kod örnekleri

İstemci `MediaService` → `ProfileRepository` veya `PostsService` üzerinden çalışır. Dosya yolu kullanıcıdan alınan dosya adını kullanmaz:

```text
uploads/<auth.uid()>/avatar/<randomUUID>.png
uploads/<auth.uid()>/banner/<randomUUID>.webp
uploads/<auth.uid()>/post/<randomUUID>.mp4
```

Aşağıdaki örnekler projedeki servislerin çağrı biçimidir; ek bir Supabase client oluşturma:

```typescript
// Angular component içinde. MediaService + AuthService zaten gerçek client'ı kullanır.
private readonly media = inject(MediaService);
private readonly auth = inject(AuthService);
private readonly repository = inject(ProfileRepository);
private readonly posts = inject(PostsService);

async saveAvatar(file: File) {
  const owner = this.auth.session()?.user.id;
  if (!owner) throw new MediaError('media.errors.session');
  const current = await this.repository.read(owner);
  const uploaded = await this.media.upload(file, 'avatar', owner);
  await this.repository.save(owner, {
    avatar_url: uploaded.url,
    banner_url: current?.banner_url ?? null,
  });
}

async sharePost(content: string, file?: File) {
  await this.posts.publish(content, file);
}
```

Yükleme servisinin SDK çekirdeği:

```typescript
const path = `${owner}/${purpose}/${crypto.randomUUID()}.${extension}`;
const bucket = client.storage.from('uploads');
const { error } = await bucket.upload(path, file, {
  contentType: file.type,
  cacheControl: '3600',
  upsert: false,
});
if (error) throw new MediaError('media.errors.upload');
const url = bucket.getPublicUrl(path).data.publicUrl;
```

`getPublicUrl` URL üretir; dosyanın varlığını kontrol etmez. Bu yüzden yalnızca başarılı upload sonrasında kullanılır. Public bucket dosya okumayı açar, yazma yetkisini açmaz; upload için ayrıca Storage RLS gerekir. [Supabase upload](https://supabase.com/docs/reference/javascript/storage-from-upload), [getPublicUrl](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl), [Storage erişim kontrolü](https://supabase.com/docs/guides/storage/security/access-control).

Gönderi kaydının SDK çekirdeği:

```typescript
const { data, error } = await client
  .schema('public')
  .from('posts')
  .insert({
    user_id: owner,
    content: content.trim(),
    media_url: uploaded?.url ?? null,
    media_type: uploaded?.type ?? null, // image | video | null
  })
  .select('id,user_id,content,media_url,media_type')
  .abortSignal(AbortSignal.timeout(20000))
  .single();
```

`id` istemciden gönderilmez; DB tarafından üretilmelidir. Insert sonucunun dönmesi için `.select()` ve uygun SELECT policy gerekir. [Supabase insert](https://supabase.com/docs/reference/javascript/insert).

Tam çalışan kodlar:

- `apps/shell/src/app/core/media.service.ts`: dosya doğrulama/yükleme/URL allowlist.
- `apps/shell/src/app/core/profile-repository.service.ts`: `user_id` ile profil okuma ve URL kaydı.
- `apps/shell/src/app/core/profile.service.ts`: önizleme yaşam döngüsü ve UI senkronizasyonu.
- `apps/shell/src/app/core/posts.service.ts`: gerçek gönderi sorguları ve paylaşım.
- `apps/shell/src/app/features/posts/`: korumalı `/compose` sayfası.

## 3. Supabase tarafında gerekenler

Önce SQL Editor'da yalnızca okuma yapan `supabase/00-readiness.sql` çalıştırılabilir. Bu dosya sütunlar, varsayılanlar, indeksler, RLS/policy ve bucket ayarlarını gösterir; kullanıcı verisi veya anahtar okumaz.

Gereken tablo sözleşmesi:

- `profiles.user_id`: Auth UUID'si, NOT NULL ve tekil. `avatar_url` / `banner_url`: nullable text. Kullanıcının profili yoksa frontend bu üç alanla INSERT dener; başka zorunlu alanların default/trigger ile doldurulması gerekir.
- `posts.id`: otomatik üretilen primary key. `user_id`: Auth UUID'si, NOT NULL. `content`: text (yalnız medyalı gönderide boş string). `media_url`: nullable text. `media_type`: nullable text veya `image`/`video` kabul eden enum/check.
- Her iki `user_id` için `auth.users(id)` foreign key ve gönderilerde `user_id` indeksi tavsiye edilir; mevcut yapı denetlenmeden otomatik ALTER yapılmadı.
- Sayısal identity/serial kullanılıyorsa ilgili sequence için authenticated INSERT rolünün gerekli kullanım izni olmalı; tüm şemaya genel sequence yetkisi verilmedi.
- RLS: profilin sahibi yalnızca kendi satırını okuyup ekleyip güncelleyebilmeli. Oturumlu kullanıcılar keşfet gönderilerini okuyabilir; yalnızca kendi `user_id` değeriyle paylaşabilir.
- Storage INSERT: `uploads` içinde ilk klasör `auth.uid()` olmalı. Avatar/banner yalnız görsel; post görsel/video. Overwrite ve delete frontend tarafından kullanılmaz.
- Bucket sunucu limiti en fazla 50 MiB; MIME allowlist JPG/PNG/WEBP/MP4/WEBM. İstemcide görseller 5 MiB, videolar 50 MiB, çözünürlük 32 MP ile sınırlandırılır.

`supabase/01-storage-rls-template.sql`, bu akış için incelenebilir temel policy şablonudur. **Otomatik uygulanmadı.** Başka mevcut policy bulursa transaction'ı durdurur; mevcut policy'leri silmez. Şablon, yalnızca bilinen medya/gönderi sütunlarına erişim verir; mevcut tablo izinlerini bu dar sözleşmeyle değiştirir. Profilde rol/yetki gibi alanlar varsa mevcut kolon grant'leri ve trigger'lar ayrıca incelenmelidir. [Kolon izinleri](https://supabase.com/docs/guides/database/postgres/column-level-security). Sütunların tamamı bilinmediği için üretime hazır evrensel bir migration olduğu iddia edilmez.

Supabase permissive policy'leri OR ile birleşir; yeni dar bir policy eklemek mevcut `USING(true)` / `WITH CHECK(true)` yetkisini ortadan kaldırmaz. Mevcut policy'ler readiness çıktısıyla birlikte değerlendirilmelidir. Sunucu tarafında dosya içeriği taraması, avatar için ayrı 5 MiB kısıtı, kötüye kullanım kotası ve moderasyon istemci doğrulamasından bağımsızdır. Public bucket'a yüklenen dosyaları URL'yi bilenler giriş yapmadan görebilir. [Storage güvenliği](https://supabase.com/docs/guides/storage/security/access-control), [RLS ve grants](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 4. Hata ve oturum güvenliği

- Kullanıcı kimliği aktif ve Supabase tarafından doğrulanmış oturumdan alınır; dosya yolu formdan gelen bir user_id kullanmaz. Asenkron adımlar arasında kullanıcı kimliği ve oturum nesli tekrar kontrol edilir; aynı hesaba yeni giriş de eski işlemi geçersiz kılar. Token yenileme tek başına taslağı geçersiz kılmaz. Asıl yetki sınırı RLS'dir.
- Profil repository payload'ı runtime'da yalnızca avatar_url/banner_url alanlarına indirilir. URL'nin kullanıcı klasörü ve avatar/banner alanı eşleşmelidir. Beklenmeyen ek alanlar API'ye taşınmaz.
- Dosya türü, boyutu, görsel başlığı ve gerçek tarayıcı decode işlemi kontrol edilir. SVG/HTML yüklenmez. Video MP4/WEBM imzası ve metadata decode ile doğrulanır.
- Başarılı dosya yüklemesi aynı File nesnesiyle DB tekrar denemesinde tekrar kullanılabilir. DB reddi taslağı silmez. Sonucu belirsiz gönderi isteği otomatik yeniden gönderilmez; kullanıcı önce akışını kontrol eder.
- Storage ve DB tek transaction değildir. Yükleme başarılı, DB kaydı başarısız olursa kullanılmayan dosya kalabilir. Eski fotoğraflar da otomatik silinmez. Bağlantılı dosyayı yanlışlıkla silmemek için tahmine dayalı temizleme yapılmaz; ayrı, referansları denetleyen sunucu temizleme işi gerekir.
- DB sorguları 20 saniyede sonlandırılır; bu süre dolması işlemin kesin geri alındığı anlamına gelmez. Storage yüklemesi SDK/network süresince bekler; yüzde ilerleme veya TUS/resumable desteği bu kapsamda yoktur.
- Üretim CSP'si yalnızca yapılandırılmış Supabase origin'ine bağlantı ve medya okuma izni verir. Yeni secret anahtar veya Vercel değişkeni gerekmez: mevcut `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` kullanılır; service-role/secret frontend'e konulmaz.

## 5. Kontrol adımları

1. Mevcut hesabınla giriş yap; drawer ve profilde kayıt sırasında verilen akademik bilgileri kontrol et. Eski hesapların boş akademik metadata'sı otomatik doldurulmaz.
2. Profil Düzenle'de avatar/kapak seç: Kaydet'ten önce Storage'a dosya gitmemeli. Kaydet sonrası profil ve drawer aynı fotoğrafı göstermeli. Yenilemede URL DB'den geri gelmeli.
3. Dashboard `+` üzerinden gönderi oluştur. Metin veya fotoğraf/video seç; Paylaş gerçek kayıt oluşturur. Canlıda bu adımı yaptığında gerçek paylaşım yaptığını unutma.
4. Keşfet ve profil Gönderiler sekmesinde kaydı, yenileme sonrası kalıcılığı kontrol et. Başka hesaba geçince önceki hesabın profil taslağı görünmemeli.
5. DevTools Network'te yükleme sonrasında profiles PATCH/INSERT veya posts INSERT sırasını kontrol et. 403 hatasında RLS ve bucket policy; 400 hatasında kolon/default/enum sözleşmesini denetle. Hata metni gerçek backend detaylarını kullanıcıya sızdırmaz.

Varsayımlar: `posts.id` otomatik üretiliyor; belirtilmeyen zorunlu sütunlar default/trigger ile karşılanıyor; `media_type` değerleri image/video/null. Tarih sütunu doğrulanmadığından sahte paylaşım tarihi gösterilmez. Şimdilik her sorgu en fazla 30 kayıt getirir; `id` azalan sıralama kullanılır. UUID id varsa bu kronolojik sıra garantilemez; gerçek tarih alanı ve pagination ayrı geliştirmedir.
