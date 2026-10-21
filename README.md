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
- Giriş sonrası dashboard, profil çekmecesi ve Keşfet / Üniversite / Kampüs / Bölüm sekmeleri. Keşfet gerçek gönderileri gösterir; akademik kapsam filtreleri geliştirme aşamasındadır.
- Profil, gönderi/yanıt/retweet sekmeleri ve fotoğraf, isim, bio düzenleme ekranı. Profil/kapak fotoğrafları Supabase Storage ve veritabanında saklanır; isim ve bio düzenlemeleri henüz oturum içi görseldir.
- Gerçek metin, fotoğraf ve video paylaşımı; Keşfet ve profil akışında kalıcı gönderiler.
- Beğenme/beğeniyi geri alma, gönderileri kaydetme ve Kaydedilenler listesi. Beğeni sayıları veritabanındaki sayaçlardan gelir.
- Kayıt sırasında üniversite ve bölüm bilgileri.
- Anlık Türkçe ve İngilizce dil değişimi.
- Açık ve koyu tema.
- Masaüstü, tablet ve mobil ekranlara uyumlu tasarım.
- Klavyeyle kullanım, görünür odak durumları ve anlaşılır form geri bildirimleri.

Tasarım dili, üniversite hayatının enerjisini editoryal tipografi, güçlü renkler ve afiş kompozisyonlarıyla birleştirir.

### Ürün vizyonu

Platformun geliştirme hedefleri; bölüm ve üniversite akışları, yorum, yeniden paylaşım ve alıntılama özellikleridir. Birebir mesajlaşma ve yöneticilerin üyelik isteklerini onayladığı uygulama içi topluluklar da bu kapsamda yer alır.

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
- A dashboard after sign-in, a profile drawer and Explore / University / Campus / Department tabs. Explore shows persisted posts; academic scope filters are under development.
- A profile with post/reply/repost tabs and photo, name and bio editing. Profile/cover photos persist in Supabase Storage and the database; name and bio edits remain local display changes.
- Real text, photo and video publishing with persisted Explore and profile feeds.
- Like/unlike, bookmarks and a saved-post list. Like counts come from database-managed counters.
- University and department details during registration.
- Instant Turkish and English language switching.
- Light and dark themes.
- Responsive layouts for desktop, tablet and mobile.
- Keyboard support, visible focus states and clear form feedback.

The visual language combines the energy of campus life with editorial typography, bold colors and poster compositions.

### Product vision

Development goals include department and university feeds, comments, reposts and quote posts. Direct messaging and in-app communities with administrator-approved membership requests are also part of the product vision.

### Technology

The frontend is built with Angular and Nx. Shared UI components follow atomic design, with colors and typography managed through design tokens. Tailwind CSS provides interface styling, Transloco provides localization, Supabase Auth handles authentication, and Supabase Storage and database tables persist profile media and posts.
