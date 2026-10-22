# KampüsX

[Türkçe](#türkçe) | [English](#english)

## Türkçe

KampüsX, üniversite öğrencilerinin kampüs hayatını, akademik çevrelerini ve günlük paylaşımlarını bir araya getiren bir sosyal medya platformudur. Öğrencilerin kendi üniversiteleri ve bölümleriyle bağ kurmasını, yeni topluluklar keşfetmesini ve kampüsteki gelişmeleri takip etmesini amaçlar.

### Kimlik doğrulama

E-posta ve şifreyle kayıt, giriş, oturum yönetimi ve şifre yenileme Supabase Auth ile entegredir. Giriş ekranında “Beni hatırla” seçeneği bulunur. Şifre yenileme, e-postayla gönderilen bağlantı üzerinden yeni şifre belirleme akışını içerir.

Başarılı girişten sonra oturum korumalı ana ekran açılır. Profil çekmecesi giriş yapan hesabın kullanıcı adını gösterir ve çıkış yapmayı sağlar.

### Kullanıcı deneyimi

- Kampüs gündemi, paylaşım örnekleri ve üniversite topluluklarını tanıtan karşılama ekranı.
- Ayrı giriş, kayıt ve şifre yenileme ekranları.
- Giriş sonrası dashboard, profil çekmecesi ve Keşfet / Üniversite / Kampüs / Bölüm sekmeleri. Akışlar gerçek gönderileri gösterir; akademik filtreler kayıtlı üniversite/kampüs/bölüm kimliklerini kullanır ve RLS görünürlüğünü korur.
- Profil, gönderi/yanıt/retweet sekmeleri ve fotoğraf, isim, bio düzenleme ekranı. Profil/kapak fotoğrafları Supabase Storage ve veritabanında saklanır; isim ve bio da public.profiles içinde kalıcıdır.
- Gerçek metin, fotoğraf ve video paylaşımı; Keşfet ve profil akışında kalıcı gönderiler.
- Beğenme/beğeniyi geri alma, gönderileri kaydetme ve Kaydedilenler listesi. Beğeni sayıları veritabanındaki sayaçlardan gelir.
- Kayıtta üniversiteye bağlı kampüs/bölüm seçim listeleri ve kullanıcı adı müsaitlik kontrolü; serbest akademik metin girişi yoktur. Sürümlü şartlar/gizlilik onayı sunucuda zorunludur.
- Tek seçimli beş görünürlük seviyesi; her seviyede onaylı takipçiler ve öncelikli engelleme.
- Yanıt, repost/geri alma ve alıntı; arşiv, en fazla üç orijinal gönderiyi öne çıkarma ve soft delete.
- Birebir canlı mesajlaşma ve erişilebilir gönderileri sohbet içinde paylaşma; tekil hesap görüntülenme sayacı.
- Dashboard’ın sağında yazdıkça arama, kaynak/tarihli Euronews haberleri ve bölümden takip önerileri; mevcut tema ve sosyal servislerle.
- Yardım Merkezi formu; doğrulanmış hesap bilgileriyle Resend üzerinden sunucu tarafında destek e-postası gönderimi. Canlı gönderim için sunucu anahtarı ve doğrulanmış gönderici ayarları gerekir.
- Anlık Türkçe ve İngilizce dil değişimi.
- Açık ve koyu tema.
- Masaüstü, tablet ve mobil ekranlara uyumlu tasarım.
- Klavyeyle kullanım, görünür odak durumları ve anlaşılır form geri bildirimleri.

Tasarım dili, üniversite hayatının enerjisini editoryal tipografi, güçlü renkler ve afiş kompozisyonlarıyla birleştirir.

### Ürün vizyonu

Akademik akışlar, yorum, repost/alıntı ve birebir mesajlaşma uygulanmıştır. Yöneticilerin üyelik isteklerini onayladığı uygulama içi topluluklar ürün vizyonunda yer alır.

22 Ekim kayıt/paylaşım sürümü, kurulum ve test ayrıntıları: [güncelleme raporu](docs/SOSYAL-YAYIN-2026-10-22.md). Katalog 208 üniversite ve 14.405 program içerir; kampüs kapsamı 112 üniversitede 292 kampüsle sınırlıdır. Kampüsü bulunmayan üniversitelerde liste tamamlanana kadar yeni kayıt tamamlanamaz.

Yardım Merkezi için [Resend kurulumu](docs/DESTEK-EPOSTA-KURULUMU.md) ve [güvenlik/test raporu](docs/GUVENLIK-VE-DESTEK-2026-10-22.md) bulunur. Destek SQL'i ve Edge Function yayındadır; dört sunucu ayarı mevcut ve gerçek bir başvuru Resend tarafından kabul edilmiştir. Gmail gelen kutusuna teslim ayrıca kontrol edilmelidir. Deneme göndericisinin alıcı kısıtları kurulum belgesinde açıklanır.

### Teknoloji

Frontend Angular ve Nx üzerine kuruludur. Ortak arayüz bileşenleri atomic design yaklaşımıyla düzenlenir; renk ve tipografi tasarım token'larıyla yönetilir. Tailwind CSS arayüz stillerini, Transloco dil desteğini, Supabase Auth kimlik doğrulamayı, Supabase Storage ve veritabanı profil medyası ile gönderi kalıcılığını sağlar.

## English

KampüsX is a social platform that brings together university students' campus life, academic networks and everyday conversations. It helps students connect with their universities and departments, discover communities and follow campus news.

### Authentication

Email and password registration, sign-in, session management and password recovery are integrated with Supabase Auth. The sign-in screen includes a “Remember me” option. Password recovery provides an email link that opens the new-password flow.

Successful sign-in opens the session-protected home screen. The profile drawer displays the signed-in account's username and provides sign-out.

### User experience

- A welcome screen introducing campus news, example posts and university communities.
- Dedicated sign-in, registration and password recovery screens.
- A dashboard after sign-in, a profile drawer and Explore / University / Campus / Department tabs. Feeds show persisted posts; academic filters use registered university/campus/department IDs while retaining RLS visibility.
- A profile with post/reply/repost tabs and photo, name and bio editing. Profile/cover photos persist in Supabase Storage and the database; name and bio also persist in public.profiles.
- Real text, photo and video publishing with persisted Explore and profile feeds.
- Like/unlike, bookmarks and a saved-post list. Like counts come from database-managed counters.
- Dependent university/campus/department registration selects and username availability, without free-text academic entries. Versioned terms/privacy acknowledgment is enforced on the server.
- Five exclusive audience levels, with accepted followers and block precedence at every level.
- Replies, repost/undo and quotes; archive, up to three featured original posts and soft deletion.
- Realtime direct messages and sharing accessible posts in conversations; unique-account view counts.
- A dashboard right rail with instant search, attributed Euronews headlines and department follow suggestions using existing theme/social services.
- A Help Center form that sends support email through Resend on the server with verified account details. Live sending requires server credentials and a verified sender.
- Instant Turkish and English language switching.
- Light and dark themes.
- Responsive layouts for desktop, tablet and mobile.
- Keyboard support, visible focus states and clear form feedback.

The visual language combines the energy of campus life with editorial typography, bold colors and poster compositions.

### Product vision

Academic feeds, comments, reposts, quotes and direct messaging are implemented. In-app communities with administrator-approved membership requests remain part of the product vision.

See the [22 October release report](docs/SOSYAL-YAYIN-2026-10-22.md) for deployment and validation. The catalog contains 208 universities and 14,405 programs; campus coverage is partial at 292 campuses across 112 universities. Registration cannot complete for universities without a campus until their catalog entries are added.

See the [Resend setup](docs/DESTEK-EPOSTA-KURULUMU.md) and [security/test report](docs/GUVENLIK-VE-DESTEK-2026-10-22.md) for the Help Center. Its SQL guard and Edge Function are deployed; all four server settings exist and Resend accepted one real request. Gmail inbox delivery requires a separate check. The setup guide explains test-sender recipient restrictions.

### Technology

The frontend is built with Angular and Nx. Shared UI components follow atomic design, with colors and typography managed through design tokens. Tailwind CSS provides interface styling, Transloco provides localization, Supabase Auth handles authentication, and Supabase Storage and database tables persist profile media and posts.
