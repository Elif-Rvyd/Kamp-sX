# Takip ve takip isteği güvenlik denetimi

18 Ekim 2026. Kapsam: Parça A'nın migration/rollback dosyaları, takip servisi, takip listesi/istek ekranları, oturum sınırları, bağımlılıklar ve production tarayıcı güvenliği. Yapısal indeks eski olduğu için ilgili kaynaklar doğrudan okunarak incelendi. Canlı Supabase veritabanında veya gerçek kullanıcı hesaplarında değişiklik yapılmadı.

## Sonuç ve yapılan düzeltmeler

İncelenen takip akışında kritik bir kimlik doğrulama veya yetki aşma açığı doğrulanmadı. İki oturum temizliği eksikliği giderildi; bunlar aşağıda etkileriyle ayrı belirtilmiştir. Bu sonuç, tüm uygulamanın veya canlı veritabanının eksiksiz sızma testinden geçtiği anlamına gelmez.

| Bulgu                                                               | Etki                                                                                                                                                                                                                   | Düzeltme                                                                                                                                                                                                            |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hesap değişiminde sayfanın eski aramayı tekrar çalıştırabilmesi     | Yönlendirme tamamlanmadan önce önceki hesabın arama metni yeni oturumla yeniden sorgulanabiliyordu. RLS veritabanında yetkisiz okumayı engelliyordu; sayfanın temizliği yönlendiricinin sayfayı yok etmesine bağlıydı. | Sayfa oluşturulduğu oturum sürümüne bağlandı. Çıkış/hesap değişiminde liste, arama metni/sonucu, sayfalama ve işlem durumu temizlenir; okumalar iptal edilir. Eski sayfa yeni oturumla sorgu veya işlem başlatamaz. |
| Kurulum kontrolünün oturum/sayfa yaşam döngüsünden bağımsız kalması | Takip servisinin diğer istekleri iptal edilirken sürüm RPC'si 15 saniyelik zaman aşımına kadar sürebiliyordu. Eski yanıt zaten oturum kontrolüyle reddediliyordu; yetki aşımı veya gizli bilgi sızıntısı doğrulanmadı. | Her kurulum kontrolüne AbortController eklendi. Çıkış, hesap değişimi ve servis kapanışında devam eden kontroller iptal edilir; eski sürüm yanıtları geçersiz kalır.                                                |

Ek koruma: Supabase CLI'nin geçici çalışma klasörü `supabase/.temp/`, `.gitignore` içine alındı. Şu anki bağlantı metadata'sında parola veya oturum token'ı saptanmadı; geçici CLI dosyalarının ileride yanlışlıkla commit edilmesi önlendi. `.env.local` ve üretilen environment dosyasının Git dışında kaldığı da kontrol edildi.

Değiştirilen uygulama kaynakları:

- [follows.service.ts](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/core/follows.service.ts): kurulum isteklerinin iptali.
- [follow-connections.page.ts](/C:/Users/elifr/source/project/web/KampüsX/apps/shell/src/app/features/profile/follow-connections.page.ts): oturumla sınırlı ekran verisi ve işlem kontrolü.
- [.gitignore](/C:/Users/elifr/source/project/web/KampüsX/.gitignore): geçici CLI dosyaları.

Tema, görünüm, kayıt/giriş davranışı, Storage bucket görünürlüğü ve tablo şeması değiştirilmedi. Bu denetim için yeni migration veya tablo hazırlanmadı.

## Yetki ve gizlilik kontrolleri

İzole PostgreSQL testleri, kullanıcının sağladığı gerçek şema ve mevcut RLS metadata'sını kullanır. Üzerine hazırlanan Parça A migration'ı uygulanarak şu senaryolar denendi:

- İstek gönderen, üçüncü hesap veya toplu UPDATE/DELETE çağrısı başka çiftin isteğini kabul edemez/silemez. Yalnızca alıcı `pending → accepted` yapabilir.
- İstemci `status`, tarih veya sahiplik alanlarını değiştirerek gizli hesabın onayını atlayamaz. INSERT durumunu veritabanı belirler. Genişletilmiş INSERT yetkisi altında bile trigger sahte `accepted` değerini düzeltir.
- Bekleyen istek üçüncü hesaba görünmez; pending ilişki özel gönderilere erişim kazandırmaz. Engel her iki yöndeki takipleri kaldırır ve yeni isteği engeller.
- Anonim rol takipleri okuyamaz/yazamaz. İstemci rolleri takip tablosunu TRUNCATE edemez. Trigger yardımcı fonksiyonları istemciye açık değildir; arama yolları sabittir.
- Her değişiklik yalnızca iki katılımcıya boş bir geçersizleştirme olayı gönderir. İlişki verisi veya token yayınlanmaz.
- Başkasının özel kanalına katılım, farklı kanal adıyla mesaj okuma ve istemciden sahte takip yayını, ek geniş permissive politikalar varken de reddedilir.
- Migration tekrar çalıştırılabilir; rollback başlangıçtaki yetki/politikaları geri getirir, takip kayıtlarını silmez.

Özel kanalın istemci ayarı ve RLS yetkilerinin birlikte uygulanması Supabase'in [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization) ve [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) belgeleriyle karşılaştırıldı. Gerçek WebSocket teslimi bu yerel SQL testinde taklit edilir; canlıda iki ayrı hesapla ayrıca doğrulanmalıdır.

## Test kanıtı

Dört yeni oturum temizliği testi önce eski kodda başarısız oldu, düzeltmelerden sonra geçti. Ayrıca üçüncü hesabın toplu müdahalesi ve yardımcı fonksiyon yetkileri için iki SQL testi; takip ekranında XSS/harici avatar takibi ve anonim erişim için iki production tarayıcı testi eklendi.

- `npm audit --json`: güncel npm kayıt sisteminden **0 bilinen bağımlılık açığı**. Bu, uygulama mantığı için güvenlik garantisi değildir.
- `npm test`: **140/140 başarılı**.
- `node scripts/sql/verify-follow-requests.cjs`: **17/17 başarılı**; taşıma katmanı yerel stub.
- `npm run typecheck`: başarılı.
- `npm run check:i18n`: 515 eşleşen, dolu TR/EN anahtarı.
- `npx playwright test scripts/e2e/follow-requests.spec.cjs`: **10/10 başarılı**; TR/EN, açık/koyu, istek kabul/ret/iptal, takipçi çıkarma, hata/tekrar deneme, sayfalama, yavaş eski yanıt ve migration kapısı.
- `npm run test:security`: **12/12 başarılı**; production CSP, profil/gönderi/takip ekranında XSS, dış ağ/izleme engeli, oturumsuz erişim ve medya önizleme/sıkıştırma.
- `npm run build`: başarılı; 30 JavaScript çıktısı doğrulandı. Başlangıç paketi 732,92 kB ile mevcut 700 kB uyarı eşiğini aşıyor; bu bir güvenlik bulgusu değil, performans uyarısıdır.
- `npm run format:check` ve `git diff --check`: başarılı.

Tarayıcı testleri gerçek Supabase trafiğini taklit eder; canlı veri yazmaz. Test sunucusu/tarayıcı alt süreçleri kısıtlı çalıştırmada ilerlemediği için bu iki test komutu yerel süreç izniyle tamamlandı. Tam 118 senaryoluk önceki UI paketi bu denetimde yeniden çalıştırılmadı; değişen akışın 10 senaryosu ve production güvenlik paketi çalıştırıldı.

## Canlı ortam sınırları

Bu denetimde SQL değiştirilmedi veya Supabase'e uygulanmadı. Önceki [Parça A migration'ının](/C:/Users/elifr/source/project/web/KampüsX/supabase/migrations/20261018190000_follow_requests.sql) canlıda çalıştırılıp çalıştırılmadığı bu denetimde doğrulanmadı. Canlı izinler için [salt okunur kurulum kontrolünü](/C:/Users/elifr/source/project/web/KampüsX/docs/supabase/16-follow-requests-verify.sql) ve [iki hesap testini](/C:/Users/elifr/source/project/web/KampüsX/docs/PARCA-A-TAKIP-ISTEKLERI.md) kullan.

`uploads` kullanıcının önceki tercihiyle public kalır. Bilinen dosya URL'sine erişimi gizli profil/takip RLS'si veya kullanıcı engelleme geri alamaz. Bu mevcut sınır korunmuştur; Storage'ı izinsiz private yapmadık.

Bu denetim Parça B–F'nin uygulaması değildir. Önceki rapordaki gönderi servislerinin gerçek şemayla uyumsuzluğu, `posts_insert_target_visible` içindeki yanlış alias bağlanması ve `blocks` tablosunun geniş yetkileri hâlâ o parçaların ayrıca ele alınacak konularıdır. Bunlar için yapılmamış canlı doğrulamayı yapılmış gibi kabul etme.
