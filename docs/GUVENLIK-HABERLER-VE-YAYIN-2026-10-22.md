# KampüsX güvenlik kontrolü ve yayın raporu

22 Ekim 2026 · Supabase: `djhezivksrvcyqxzpiau` · Site: `https://kampusx.vercel.app`.

Bu kontrol; dashboard haberleri, sağ arama ve bölüm önerileri ile mevcut oturum, medya,
mesajlaşma, gönderi, takip, kayıt ve destek sınırlarını kapsar. Yeni doğrulanmış kritik/yüksek
yetki açığı bulunmadı. Bu sonuç, belirtilen kapsamın test sonucudur; bütün sistem için
bağımsız pentest veya kusursuz güvenlik garantisi değildir.

## Bulgular ve sıkılaştırmalar

| Konu                                      | Gözlem                                                                                                   | Uygulanan işlem ve kanıt                                                                                                                                                                                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Haber XML derinliği                       | Parser'ın mevcut 100 katmanlık varsayılanına güveniliyordu. RSS için daha dar bir uygulama sınırı yoktu. | `maxNestedTags: 32` eklendi. 40 katmanlı örneği reddetme testi önce başarısız, sonra başarılı oldu. 1 MB gerçek stream sınırı ve DTD/ENTITY reddi korundu. Bu bir dayanıklılık sıkılaştırmasıdır; canlı hizmet dışı bırakma saldırısı gösterilmedi.    |
| Auth yanıtındaki kullanıcı kimliği biçimi | Haber handler'ı 36 karakterlik hatalı bir kimlik biçimini de kabul edebiliyordu.                         | Tam UUID biçimi kontrol edildi. Sahte Auth yanıtı fixture'ında hatalı kimlik artık 401 alıyor; önbellek bu kontrolü atlamıyor. Auth yanıtı Supabase'in sabit HTTPS adresinden geldiği için bu test dışarıdan kimlik doğrulama atlatıldığını göstermez. |
| Kaynak boyutu hata sınıflaması            | Aşırı büyük stream genel ağ hatası olarak sınıflanıyordu.                                                | Gerçek stream boyutu Content-Length olmadan sınandı, akış iptal edildi ve sabit `source_parse` kodu kullanıldı. Ham sağlayıcı/kimlik verisi açıklanmadı.                                                                                               |
| SQL yetkileri                             | Canlı katalogda normal/anonim rollere tehlikeli tablo yetkisi bulunmadı.                                 | Mevcut izinler korundu; gereksiz migration veya kullanıcı verisi değişikliği yapılmadı.                                                                                                                                                                |

Yalnız haber Edge Function'ı bu sıkılaştırmayla yeniden yayımlandı. Mevcut sosyal tablolar,
RLS politikaları, destek gönderimi ve Auth ayarları değiştirilmedi. Güncel gerçek TR/EN RSS
okuma testinde iki dil de HTTP 200 ve sekiz başlık döndürdü; bu kaynak testinde Auth cevabı
taklit edilir. Önceki gerçek uygulama haber sonucu kullanıcı tarafından ayrıca doğrulanmıştır.

## Canlı, salt okunur doğrulama

- 13 public ve üç private tablo: **16/16 RLS açık**.
- `anon` / `authenticated` için etkili `TRUNCATE`, `TRIGGER`, `REFERENCES`, `MAINTAIN`
  tablo yetkisi: **0**. Kontrol yalnız doğrudan ACL listesini değil etkili yetkiyi sorgular.
- Gönderi istemci UPDATE sütunları: yalnız `archived_at`, `deleted_at`, `pinned_at`.
  Sayaçları istemci yazamıyor.
- `kx_support_reserve`, `kx_support_finish`, `kx_support_status`: anonim/normal kullanıcı
  EXECUTE izni yok. Sunucu destek kaydı normal kullanıcıya açılmıyor.
- `support-email` / `world-news`: ACTIVE ve platform JWT doğrulaması açık.
- profiles, posts, follows, likes, bookmarks, blocks, reports, conversations, messages:
  anonim HEAD isteklerinin **9/9'u HTTP 401**.
- İki Edge Function'a oturumsuz GET: **2/2 HTTP 401**.
- İki fonksiyonda production ve localhost preflight: **4/4 HTTP 204**, tam origin eşleşmesi.
  Yabancı origin: **2/2 HTTP 403**, izin başlığı yok.
- Canlı site: HTTP 200; `nosniff`, `DENY`, `no-referrer`, kısıtlı Permissions-Policy,
  frame/object/base/form CSP ve HSTS başlıkları mevcut. Derlenmiş HTML'de ayrıca Angular'ın
  hash tabanlı script CSP'si ve uygulamanın dar connect/image/media/worker politikası doğrulanır.

İlk HTTP kontrolünde bir zaman aşımı oldu. İkinci sınırlı kontrolde her sonuç ayrı kaydedildi
ve yukarıdaki istekler tamamlandı. Canlıya gönderi, mesaj, dosya veya destek e-postası
eklenmedi; test kullanıcısı oluşturulmadı, parola denenmedi ve yük testi yapılmadı.

## Yerel testler

- **227 birim testi**: oturum değişimi, recovery, literal içerik, URL doğrulaması,
  arama iptali/IME/gizlilik, medya, mesajlaşma, destek ve 12 haber testi dahil.
- **14 PostgreSQL/PGlite paketi, 193 kontrol**: takip istekleri 17, takip politikaları 10,
  hesap/gönderi işlemleri 11, yanıt/yetki 12, kayıt 12, kullanıcı adı 9, Storage 15,
  Storage temizleme 8, profil medyası 14, gönderi ekleme 20, mesajlaşma 10,
  paylaşım/görüntülenme 19, destek 12, eski gönderi/engel sözleşmesi 24.
  Bu fixture'lar canlı veritabanına bağlanmaz; bütün tarihsel fixture'ların son canlı
  kurulumun bire bir kopyası olduğu iddia edilmez.
- Güncel `npm audit`, geliştirme araçları dahil: **0 bildirilen açık**.
- Gizli anahtar desen taraması: **bulgu yok**; eşleşen değerler loglanmaz.
- Angular typecheck, 706 TR/EN anahtarı, Deno tip kontrolü, format ve diff kontrolü geçti.
- Üretim derlemesi ve 40 JavaScript dosyasının çıktı kontrolü geçti. Başlangıç paketi
  yaklaşık 824 kB; mevcut 700 kB uyarısı sürüyor, 1 MB hata sınırı aşılmıyor.

## Sınırlar ve kalan risk

1. **Public medya:** Önceki açık kullanıcı kararı doğrultusunda `uploads` public kalır.
   RLS satır görünürlüğünü sınırlar; URL'yi önceden bilen kişi engellense bile dosyayı
   açabilir. Bu bilinen gizlilik riski kapatılmış sayılmıyor. Tam medya gizliliği için
   ayrı private bucket/sunucu erişimi geçişi ve mevcut dosyalarla uyumluluk çalışması gerekir.
2. **Tarayıcı doğrulaması:** Bu tur oturumlu tarayıcı okuması otomatik onay incelemesinde,
   önceki kullanım engelinden sonra yeniden erişim olduğu gerekçesiyle reddedildi.
   Güncel Playwright/UI/CSP tarayıcı paketleri tekrar çalıştırılmış sayılmaz. Önceki haber
   tasarımında geçen 11 hedefli ve 203 geniş paket sonucu bu sürümün güncel UI kanıtı değildir.
   Eski geniş pakette bir yorum testi gezinme sırasında execution context kaybıyla tamamlanmadı.
3. **Kapsam:** Bağımsız dış pentest, çok bağlantılı yük testi ve her gerçek iki hesap/rol
   kombinasyonuyla canlı yazma testi yapılmadı. Akademik bilgiler kayıt beyanıdır; harici
   öğrenci doğrulaması veya MFA/CAPTCHA kurulumu bu değişikliğe dahil değildir.

Codebase-memory indeksi 10 Ekim tarihliydi; kapsama kontrolünde güncel kaynaklar eksik çıktı.
Bu nedenle maddi bulgular güncel dosyalar, mevcut testler ve canlı katalog ile doğrulandı.
