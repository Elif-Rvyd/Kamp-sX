# Medya kaydı

18 Ekim 2026 güncel düzeltme: [Gönderi kaydı ve tam ekran raporu](GONDERI-KAYDI-VE-TAM-EKRAN-2026-10-18.md). Mevcut şemada kayıt sorgusunun eski sütun adları düzeltildi; bu frontend düzeltmesi için yeni SQL gerekmez. Aşağıdaki 16–17 Ekim SQL/menü notları tarihsel bağlamdır; güncel Adım 1/2 RLS kurallarının üzerine eski kurulum dosyaları yeniden uygulanmaz.

Dosyanın kendisi Supabase Storage'daki mevcut `uploads` bucket'ına yüklenir. Public URL mevcut tabloya yazılır ve doğrudan görüntülenir. Kullanıcının 18 Ekim isteğiyle private Storage geçişi geri alındı. SQL 12 bucket görünürlüğünü değiştirmez. Güncel kurulum ve engelleme kuralları için [gönderi/gizlilik raporu](GONDERI-ISLEMLERI-VE-GIZLILIK.md). Veritabanı isteğinde dosya baytları, base64 veya geçici `blob:` önizleme adresi gönderilmez.

| İçerik                              | Kaydedildiği yer                                      |
| ----------------------------------- | ----------------------------------------------------- |
| Profil fotoğrafının URL'si          | `public.profiles.avatar_url`                          |
| Kapak fotoğrafının URL'si           | `public.profiles.banner_url`                          |
| Gönderi fotoğrafı/videosunun URL'si | `public.posts.media_url`                              |
| Gönderi medya türü                  | `public.posts.media_type`: `image` veya `video`       |
| Gönderi metni                       | `public.posts.content`                                |
| Kayıt sahibi                        | Mevcut `user_id` sütunu, oturumdaki kullanıcı kimliği |

İlk medya yükleme akışı yeni tablo, sütun veya bucket gerektirmedi. Sonraki gönderi menüsü/engelleme isteğinin ilişkileri ve kuralları SQL 12'de ayrıca hazırlanmıştır. Profil ve gönderi sütunları kullanıcının paylaştığı mevcut şema teşhislerine dayanır.

## Kullanım

Ana sayfada **+ → Fotoğraf veya video ekle** yoluyla dosya seçilir. Dosya yerel olarak doğrulanır ve önizlenir; **Paylaş** ile önce Storage yüklemesi, ardından URL kaydı yapılır. Metinsiz, yalnızca fotoğraf/video içeren gönderi de desteklenir. Gönderi başına tek medya vardır.

Gönderi fotoğrafları JPG/PNG/WEBP biçiminde, kaynak olarak en fazla 20 MiB ve 32 megapiksel olabilir. Oran korunarak en fazla 2048×2048 boyutuna ve 2 MiB'ye küçültülüp WebP'ye çevrilir. Küçük fotoğraflar da piksellerinden yeniden oluşturulur; kaynak EXIF/XMP/konum etiketleri public dosyaya taşınmaz. MP4/WEBM videolar 50 MiB'ye kadar ses/görüntü paketleri yeniden kodlanmadan temiz bir kapsayıcıya aktarılır; açıklama etiketleri, ek dosyalar ve kaynak iz adları kopyalanmaz. Büyük videolar tarayıcıda, ayrı bir Web Worker içinde otomatik sıkıştırılır ve aynı etiket temizliğinden geçer. Kaynak sınırı 512 MiB ve 30 dakikadır; süre kesilmez ve ana ses izi korunur. Süreye göre bit oranı hesaplanır, çözünürlük oranı korunarak azaltılır ve sonuç en fazla 50 MiB ise kabul edilir. Gerekirse üç sınırlı geçiş denenir. PDF, ses ve diğer belge biçimleri bu sosyal medya akışının kapsamında değildir.

Video küçültme için Mediabunny 1.61.6 ve cihazın WebCodecs desteği kullanılır. Desteklenen cihazlarda MP4/H.264/AAC; gerektiğinde WebM/VP9/Opus çıktısı üretilir. Gerekli ses/video codec'i desteklenmiyorsa anlaşılır hata gösterilir; sessiz video veya büyük orijinal dosya başarı gibi sunulmaz. Gerçek sıkıştırma ilerlemesi gösterilir. Kullanıcı iptal edebilir; sayfadan çıkış/oturum değişikliği worker'ı sonlandırır. İşlem yereldir, dosya seçimi sırasında Storage'a yükleme yapılmaz. Üretim CSP'sinde yalnızca aynı kaynaktaki worker'a izin verilir; script hash denetimi korunur.

Profil avatar/kapak seçimi mevcut küçültme ve Kaydet akışını kullanır. Metin alanlarının saklanma biçimi bu güncellemede değiştirilmedi.

## Hata ve güvenlik davranışı

Hazırlama, dosya yükleme ve gönderi kaydı ayrı durum mesajlarıyla gösterilir. Ölçülmeyen bir yükleme yüzdesi gösterilmez. İzin/ağ hatası taslağı silmez. Tamamlandığı bilinen yükleme, reddedilen DB kaydı tekrarlandığında yeniden yüklenmez. Sunucu yanıtındaki URL, tür, metin veya sahiplik beklenenden farklıysa başarı gösterilmez ve körlemesine tekrar gönderim engellenir.

Rastgele dosya adı, kullanıcı klasörü ve oturum sınırı korunur. Akış yalnızca aynı bucket'taki, gönderi sahibi ve medya türüyle uyumlu gönderi URL'lerini gösterir. Veritabanı yetkileri Supabase RLS'de uygulanmaya devam eder; frontend kontrolü RLS yerine geçmez.

Testler gerçek kullanıcı hesabına gönderi veya dosya eklemeden yerel HTTP/WebSocket sınırlarında çalışır. Canlı Supabase projesindeki mevcut RLS/bucket ayarları bu oturumda değiştirilmedi veya gerçek hesapla uçtan uca denenmedi.

## Gönderi kayıt hatasının teşhisi

Paylaşılan `08-post-save-diagnostics.sql` çıktısında `public.posts` için `rls_enabled: true` ve `policies: null` görüldü. Sütun izinleri bulunsa da satır erişim kuralları olmadığı için gönderi eklenemiyor.

`supabase/09-post-publishing-permissions.sql` mevcut tablo için hazırlandı. Supabase SQL Editor'da tamamı çalıştırıldığında giriş yapanlar akışı okuyabilir ve yalnızca kendi kullanıcı kimlikleriyle gönderi ekleyebilir. Gereksiz geniş istemci yetkileri daraltılır; RLS açık kalır. SQL yeni tablo/sütun oluşturmaz, gönderi eklemez/silmez ve `profiles`, Storage veya Auth ayarlarını değiştirmez. Uygulama bu SQL'i otomatik çalıştırmaz. Beklenen sonuç `authenticated` rolünde bir `SELECT` ve bir `INSERT` kuralıdır.

Mevcut `posts.user_id → profiles.user_id` ilişkisi korunur; paylaşım yapan hesabın `profiles` satırı mevcut olmalıdır. Medya URL'leri uygulamanın kullandığı proje, kullanıcı klasörü ve fotoğraf/video türüyle eşleşmelidir.

SQL, yerel PGlite üzerinde `node scripts/sql/verify-post-publishing-policies.cjs` ile 20 senaryoda doğrulandı. Önceki hatanın yeniden üretilmesi, metin ve medya kaydı, yabancı kullanıcı kimliği/URL reddi, anonim erişim reddi, silme/TRUNCATE yetkilerinin kaldırılması, şema sapmalarında durma ve tekrar uygulanabilirlik kapsandı. Bu test canlı Supabase'e bağlanmaz.

## 17 Ekim 2026 medya/düzen doğrulaması — güvenlik denetiminden önce

120 birim testi ve 10 üretim güvenlik testi geçti. Arayüz paketindeki 93 senaryonun 92'si ilk tam koşumda geçti; kalan masaüstü genişlik testi, sabit scrollbar boşluğunu hesaba katacak şekilde düzeltildi. Bu senaryo ve son Paylaş düğmesiyle dört menü senaryosu, beş testlik son koşumda geçti. Giriş/kayıt, profil düzenleme, sekme/klavye/dokunma, iki dil/tema, 320–1440 px düzen, erişilebilirlik, taslak koruma ve oturum kaybı kapsandı.

Gerçek, ses içeren bir WebM kaydı geçerli EBML dolgusuyla 50 MiB üzerine çıkarılarak worker'da yeniden kodlandı. Sonuçta dosya boyutu 50 MB altında, video süresi ve kaynak ses süresi korunmuş ve ses enerjisi mevcut bulundu. Yerel test Storage'ına yalnızca sıkıştırılmış dosya yüklendi; DB'ye yalnızca URL/tür/metin/kimlik yazıldı ve yenileme sonrası video oynatılabildi. Aynı büyük video, gerçek üretim CSP'si altında da hazırlandı. Testte blob verisini fetch ile okumaya izin açılmadı; üretim testi worker'ın gerçek File sonucunun boyutunu gözlemliyor. İptal testi metin taslağının korunduğunu ve hiçbir yükleme/yazma yapılmadığını doğruladı.

Uygulama ve worker TypeScript kontrolleri, 414 TR/EN anahtarı, Prettier, tasarım sözleşmesi lint kontrolü ve 20 JavaScript dosyasıyla üretim çıktı doğrulaması başarılı. Statik denetimde Angular olay bağlamalarını tanımayan aracın 12 yanlış pozitifi, yalnızca bu sözdizimini tanıyan mevcut adaptörle kontrol edildi; adaptörün sıkı denetiminde bulgu yok. Üretim başlangıç paketi 710,71 kB; mevcut 700 kB uyarı eşiğini yaklaşık 10,71 kB aşıyor. Video worker'ı ayrı, ihtiyaç anında yüklenen yaklaşık 459 kB'lık pakettir. Derlemeyi durduran hata yok. Yerel geliştirme sunucusu 4200 portunda başlatıldı ve HTTP 200 yanıtı doğrulandı.
