# KampüsX

[Türkçe](#türkçe) | [English](#english)

## Türkçe

KampüsX, üniversite öğrencilerinin kampüs hayatını, akademik çevrelerini ve günlük paylaşımlarını bir araya getiren bir sosyal medya platformudur. Öğrencilerin kendi üniversiteleri ve bölümleriyle bağ kurmasını, yeni topluluklar keşfetmesini ve kampüsteki gelişmeleri takip etmesini amaçlar.

### Kimlik doğrulama

E-posta ve şifreyle kayıt, giriş, oturum yönetimi ve şifre yenileme Supabase Auth ile entegredir. Giriş ekranında “Beni hatırla” seçeneği bulunur. Şifre yenileme, e-postayla gönderilen bağlantı üzerinden yeni şifre belirleme akışını içerir.

### Kullanıcı deneyimi

- Kampüs gündemi, paylaşım örnekleri ve üniversite topluluklarını tanıtan karşılama ekranı.
- Ayrı giriş, kayıt ve şifre yenileme ekranları.
- Anlık Türkçe ve İngilizce dil değişimi.
- Açık ve koyu tema.
- Masaüstü, tablet ve mobil ekranlara uyumlu tasarım.
- Klavyeyle kullanım, görünür odak durumları ve anlaşılır form geri bildirimleri.

Tasarım dili, üniversite hayatının enerjisini editoryal tipografi, güçlü renkler ve afiş kompozisyonlarıyla birleştirir.

### Ürün vizyonu

Platformun geliştirme hedefleri; bölüm, üniversite ve genel keşfet akışları, yazı/fotoğraf/video paylaşımı, beğeni, yorum, yeniden paylaşım ve alıntılama özellikleridir. Birebir mesajlaşma ve yöneticilerin üyelik isteklerini onayladığı uygulama içi topluluklar da bu kapsamda yer alır.

### Teknoloji

Frontend Angular ve Nx üzerine kuruludur. Ortak arayüz bileşenleri atomic design yaklaşımıyla düzenlenir; renk ve tipografi tasarım token'larıyla yönetilir. Tailwind CSS arayüz stillerini, Transloco dil desteğini, Supabase Auth ise kimlik doğrulamayı sağlar.

## English

KampüsX is a social platform that brings together university students' campus life, academic networks and everyday conversations. It helps students connect with their universities and departments, discover communities and follow campus news.

### Authentication

Email and password registration, sign-in, session management and password recovery are integrated with Supabase Auth. The sign-in screen includes a “Remember me” option. Password recovery provides an email link that opens the new-password flow.

### User experience

- A welcome screen introducing campus news, example posts and university communities.
- Dedicated sign-in, registration and password recovery screens.
- Instant Turkish and English language switching.
- Light and dark themes.
- Responsive layouts for desktop, tablet and mobile.
- Keyboard support, visible focus states and clear form feedback.

The visual language combines the energy of campus life with editorial typography, bold colors and poster compositions.

### Product vision

Development goals include department, university and general discovery feeds; text, photo and video posts; likes, comments, reposts and quote posts. Direct messaging and in-app communities with administrator-approved membership requests are also part of the product vision.

### Technology

The frontend is built with Angular and Nx. Shared UI components follow atomic design, with colors and typography managed through design tokens. Tailwind CSS provides interface styling, Transloco provides localization, and Supabase Auth handles authentication.
