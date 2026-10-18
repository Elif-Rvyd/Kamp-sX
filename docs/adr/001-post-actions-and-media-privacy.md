# Gönderi işlemleri ve medya gizliliği

17 Ekim 2026. Kaynak: kullanıcının gönderi menüsü/etkileşim/engelleme isteği ve
“engellediğim insanlar bizim hiçbir şeyimizi göremesin; uploads durumunu değiştirebilirim” açıklaması.

- Silme: onay → sunucuda rezervasyon → Storage API ile medya temizliği → DB satırını silme.
  Dosya kaldıysa son adım RLS tarafından reddedilir. Başarısız temizlik Arşivim içinde yeniden denenir.
  Storage ve PostgreSQL arasında dağıtık transaction yoktur; rezervasyon, benzersiz medya URL'si,
  dosya kilidi ve son kontrol tutarsız silme/yeniden referans yarışını sınırlar.
- Sabitleme: kullanıcı başına 1–3 numaralı benzersiz yuvalar; DB check/unique constraint ve
  kullanıcı kilidi dördüncü sabitlemeyi önler. Arşivleme/silme rezervasyonu sabitlemeyi kaldırır.
- Arşiv: sadece sahibi okuyabilir; akış, normal profil, arama ve etkileşim dışına çıkar.
- Beğeni/kaydetme/rapor: kullanıcı–gönderi çifti benzersiz. Beğeni ve kaydetme idempotent,
  iyimser UI; rapor nedeni dört değerle sınırlı, ikinci rapor yeni satır oluşturmaz.
- Yorum: kök yorum ve bir yanıt seviyesi. Sayaçlar trigger ile tutulur; istemci sayaç,
  sahiplik, zaman veya yönetim alanlarını yazamaz.
- Engel: iki yöndeki takipleri siler ve profil/gönderi/medya/etkileşim erişimini iki yönde
  keser; dosyanın public URL erişimi hariçtir. Engel kaldırma takipleri geri oluşturmaz. Kendi engel listesini okuma/kaldırma,
  gizlenmiş profil satırına okuma izni vermeden çalışır.
- Mevcut gizlilik RLS'i genişletilmez: engelleme RESTRICTIVE; etkileşimler
  ilgili gönderinin mevcut RLS'i üzerinden geçer. Profilin eski sahip-only okuması korunur.
  Public medya URL'sini açmak bu satır kurallarından bağımsızdır.
- 18 Ekim 2026 güncellemesi: kullanıcı ‘storage private olunca sorun çıkıyormuş, değişiklikleri geri al’ dedi. Private Storage geçişi geri alındı; medya mevcut public URL ile görüntülenir. SQL 12 bucket görünürlüğünü değiştirmez; eski private kurulum uygulandıysa SQL 13 yalnızca bu kısmı geri alır.
- Engel değişimi iki katılımcının korunan özel Realtime kanalına boş invalidation gönderir ve uygulama satırlarını yeniden okutur. Public dosyanın doğrudan URL'sine erişim engelleme kapsamına alınamaz. Bu sınırlama uygulamada tam medya gizliliği gibi sunulmaz.

Kapsam: mevcut kendi profil ekranı ve gönderi araması. Diğer kişilerin Auth metadata'sına
erişim açılmaz; görünür kişi adı yoksa mevcut öğrenci etiketi kullanılır. Moderasyon ekibine
rapor inceleme paneli veya yeni yönetici yetkisi bu karara dahil değildir.

Uygulama: `docs/supabase/12-post-actions-and-blocking.sql`, PostActionsService,
PostEntryComponent ve mevcut public medya görüntüleme bileşenleri.
Canlı SQL otomatik uygulanmaz. SQL/PGlite ve HTTP taklitli tarayıcı testleri canlı Supabase
üzerinde yapılmış penetrasyon testi olarak sunulmaz.
