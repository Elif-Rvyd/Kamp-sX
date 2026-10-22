# Dashboard dünya haberleri

Kullanıcının X benzeri haber kutusu talebi üzerine, dashboard'a masaüstünde sağ sütun ve mobilde
açılır bir haber alanı eklendi. Mevcut tasarım token'ları, tema, dil ve akış sekmeleri korunur.
Kullanıcının X örneğine göre kutu 1024px ve üzerinde sağda açılır; sütun genişliği ekrana göre
360–460px arasında değişir. Dikdörtgen yüzey, hafif mavi ton, ince mavi kenarlık ve sabit yumuşak
gölge mevcut tema renklerinden türetilir. Haber ve öneri kartları mevcut 24px panel yarıçapını
kullanır. Daha dar ekranlarda haber/öneri alanları başlangıçta kapalıdır.

Kaynak Euronews'in resmî RSS haber akışlarıdır. Türkçe arayüz `tr.euronews.com`, İngilizce arayüz
`www.euronews.com` akışını kullanır;
başlıklar otomatik çevrilmez. Başlık, yayıncı ve yayın zamanı gösterilir. Dört haberden sekize
genişletilebilir; bağlantı yeni sekmede Euronews'teki ilgili haberi açar. Tam makale, fotoğraf,
uydurulmuş trend sayısı veya görüntülenme verisi kopyalanmaz.

## Sunucu ve güvenlik

`world-news` Supabase Edge Function mevcut kullanıcıyı Auth sunucusuyla doğrular. Yalnızca GET/OPTIONS
kabul eder ve iki sabit haber URL'sine erişir; istemciden upstream URL almaz. Kullanıcı JWT'si veya
e-postası haber kaynağına gönderilmez. Veritabanı tablosu/migration ve service_role anahtarı gerekmez.

XML boyutu 1 MB, kaynak isteği sekiz saniyeyle sınırlıdır. DTD/ENTITY reddedilir; sadece doğrulanmış
HTTPS Euronews tarihli makale/video bağlantıları, yakın tarihli başlıklar ve kaynak etiketi JSON'a çevrilir.
İstemci de bağlantıları ve yanıtın dilini doğrular; metinler HTML olarak işlenmez.

Beş dakikalık bellek önbelleği dil başına ayrıdır; eşzamanlı kaynak istekleri birleştirilir.
Kaynak kesintisinde en fazla bir saatlik önceki içerik açıkça eski olarak işaretlenir; daha sonra
hata ve tekrar deneme gösterilir. Kimlik doğrulaması önbellek cevabından önce yapılır. Arayüzün
yenilemesi açık/görünür panelde beş dakikada birdir; ekran kapanınca zamanlayıcı ve istekler temizlenir.

`https://kampusx.vercel.app` ve localhost:4200 origin'leri tam eşleşmeyle tanımlıdır. Yeni preview
adresleri gerekirse `NEWS_ALLOWED_ORIGINS` ortam ayarına tam HTTPS origin olarak eklenir. Joker
origin yoktur. Bu özellik destek e-postasının origin/anahtar ayarlarını değiştirmez.

## Yayın ve geri dönüş

`npx supabase functions deploy world-news --project-ref djhezivksrvcyqxzpiau --use-api`

JWT platform kontrolü açık kalır. Dış haber API anahtarı veya kullanıcıdan ek hesap açılması gerekmez.
Haber kaynağına ulaşılamazsa kutu hata gösterir; ana gönderi akışı kullanılmaya devam eder.
Önceki frontend sürümüne dönmek kutuyu kaldırır; sosyal veriler ve hesaplar etkilenmez.

## Doğrulama

- 225 birim testi geçti; onu haber ayrıştırma, oturum, URL/DTD güvenliği, dil önbelleği,
  eşzamanlılık ve eski veri sınırını kapsar.
- Karışık öneri testleri okul/bölüm filtresinin kaldırılmasını, farklı adayların seçilmesini,
  mevcut takip/istek ve RLS'de gizlenen kişilerin dışarıda kalmasını, oturum değişimi ve iptalde
  sonuçların kullanılmamasını denetler.
- Dört sağ arama testi eski yanıtların iptalini, çıkışta temizlenmeyi, IME/kısmi hataları,
  mevcut arama rotasını ve gizlilik değişiminde sonuçların yeniden okunmasını denetler.
- Angular typecheck, 706 TR/EN anahtarı ve Deno tip kontrolü geçti.
- Üretim derlemesi ve 40 JavaScript dosyasının üretim çıktı kontrolü geçti.
- İlk tasarımda dashboard/haberler için 11 tarayıcı testi geçti. Geniş pakette 203 test geçti;
  bir yorum testi, sayfa hazırlığında gezinme nedeniyle kaybolan execution context hatasıyla
  tamamlanamadı. Son mavi/geniş tasarım tarayıcıda tekrar doğrulanamadı: otomatik onay
  incelemesi kullanım limiti nedeniyle erişimi reddetti. Statik UI denetimi 0 bulgu verdi.
- Google akışı yerel kontrolde çalışmasına rağmen canlı Edge isteğinde 503 döndürdü;
  kullanıcı `http_503_source_http_503` kodunu paylaştı. Resmî Euronews akışlarına geçildi:
  doğrudan TR/EN testleri 200 ve sekizer başlık döndürdü, fonksiyon canlıya yayımlandı.
  Kullanıcı ardından uygulamada **“Haberler görünüyor”** diyerek gerçek veri sonucunu doğruladı.
- Sunucu yalnızca sabit hata kategorileri (`configuration`, `authentication`, `source_http`,
  `source_parse`, `source_network`) ve gerekirse kaynak HTTP durumunu döndürür. İstemci bunları
  yerel geliştirme ekranında kısa tanılama kodu olarak gösterir; üretim arayüzünde görünmez.
  Token, kullanıcı bilgisi veya kaynak hata gövdesi gösterilmez/loglanmaz.
- npm kurulumu sırasında 0 bilinen bağımlılık açığı bildirildi. XML kütüphanesi yalnızca sunucu ve
  test ortamında kullanılır; Angular paketine eklenmez.

## Sağ sütun kapsamı

Yalnız dashboard'ın sağ sütunu örneğe göre düzenlendi: üstte tek satır arama, altında haberler ve
ayrı kişi önerileri. Tema token'ları, sol navigasyon, giriş/tanıtım ve diğer sayfaların tasarımı
korundu. FormField ve FollowPerson'a yalnız bu sütunun kullandığı varyantlar eklendi.

Arama mevcut `FollowsService.searchPeople` ve `PostActionsService.search` servislerini kullanır;
300ms sonra kullanıcı/gönderi önizlemeleri gelir, tıklama gerçek profil/gönderi rotasını açar.
22 Ekim'deki son kullanıcı kararıyla öneriler yalnız bölüme bağlı değildir. En fazla 30 görünür
hesap okul/bölüm filtresi olmadan okunur; mevcut takip/istek durumları yüklenir, kendi hesabın,
yinelenen kimlikler ve takip/istek gönderilmiş hesaplar çıkarılır. Kalanlardan rastgele en fazla
üç kişi gösterilir; Önerileri yenile düğmesi yeni bir seçim yapar. Kayıtlı akademik kimliklerin
eksik olması önerileri durdurmaz. Bu sınırlı havuz tüm kullanıcılar üzerinde eşit olasılıklı
örnekleme iddiasında bulunmaz. Engeller/gizlilik mevcut RLS'den geçer; takip mevcut işlemle yapılır.

Mevcut sosyal backend, tablolar ve RLS değiştirilmedi; SQL çalıştırılması gerekmiyor.
Kaynak: [Euronews resmî RSS/widget sayfası](https://www.euronews.com/widgets).

## Karışık öneriler güncellemesinin doğrulaması

230 birim testi, Angular tip kontrolü, 707 eşleşen TR/EN anahtarı, biçim kontrolü ve üretim
derlemesi geçti. Statik UI denetimi sıfır bulgu verdi. Önceki otomatik tarayıcı erişim engeli
nedeniyle yeni görsel/oturumlu tarayıcı testi çalıştırılmadı. Sunucu politikaları korunur;
görünür ve henüz takip/istek gönderilmemiş aday yoksa boş durum gösterilmeye devam eder.
