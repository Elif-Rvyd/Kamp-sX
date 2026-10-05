# KampüsX — doğrulama

4 Ekim 2026.

- `nx build shell`: production derlemesi geçti; welcome ve auth ayrı lazy chunk'larda.
- `npm run typecheck`: geçti.
- `npm test`: 3 doğrulama testi geçti; `.edu.tr` taklit uzantıları da kontrol edildi.
- `npm run check:i18n`: TR/EN 220 anahtar eşleşiyor, boş çeviri yok.
- `npm run format:check`: geçti.
- `designmd lint DESIGN.md`: 0 hata, 0 uyarı.
- `audit_project.py --mode strict`: 0 hata, 0 uyarı; rapor `premium-audit.json`.
- `npm run test:ui`: 23 senaryo geçti. Giriş, kayıt, sıfırlama, Google demo,
  topluluk CTA'sı, feed klavye sekmeleri, modal Escape/odak dönüşü, lazy route'lar,
  404, tema/dil değişimi ve kalıcılık kontrol edildi.
- Welcome: 1440/768/390/320 px × TR/EN × açık/koyu; yatay taşma yok.
- Auth: üç form × TR/EN × açık/koyu; label aktivasyonu, benzersiz DOM id'leri,
  ilk hataya odak, aria-invalid ve hata açıklaması bağlantıları kontrol edildi.
- axe-core WCAG A/AA otomatik taraması: kontrol edilen durumlarda 0 ihlal.
- Reduced motion, görünür odaklar ve global scrollbar baseline CSS'i mevcut.

PNG dosyaları gerçek Chromium ekran görüntüleridir. Tam ekran sayfaları ve
`hero-*` viewport görünümleri hem açık hem koyu temayı gösterir. `auth-*`
dosyaları hatalı form durumlarını gösterir. Otomatik erişilebilirlik taraması,
manuel ekran okuyucu veya fiziksel cihaz testi yerine geçmez.

Fontlar/ikon fontu brief doğrultusunda Google Fonts kullanır. Formlar demo:
API isteği, gerçek oturum/hesap/üyelik ve e-posta gönderimi yoktur.

## 5 Ekim 2026 — karşılama düzenlemeleri

- Gündem şeridi iki temada da surface-alt/text/border renklerini kullanıyor;
  etiket, ayraçlar ve duraklatma düğmesi tema renkleriyle uyumlu.
- Header giriş düğmesi, kampanya üst satırı ve footer önizleme/slogan metinleri kaldırıldı.
  Hakkında, Gizlilik, Kullanım şartları ve Çerezler footer navigasyonunda yer alıyor.
- Masaüstünde afiş ve auth paneli aynı üst ve alt hizaya sahip. Kayıt ve şifre
  yenileme modları doğal içerik yüksekliğiyle satırı genişletiyor; mobilde bağımsız
  yüksekliklerle tek sütun kullanılıyor. Öğrenci güven notu panel içine taşındı.
- `nx build shell`, `npm run typecheck`, `npm test`, `npm run check:i18n`,
  `npm run format:check`, `designmd lint DESIGN.md` ve strict premium audit geçti.
- `npm run test:ui`: 23 senaryo geçti. Mevcut tema/dil matrisi, kaldırılan
  navigasyon ve metinleri, footer bağlantılarını, gündem renklerini ve masaüstünde
  üç auth modunun afişle eşit yüksekliğini de doğruluyor.
- 1440/768/390/320 px × TR/EN × açık/koyu: yatay taşma ve otomatik axe ihlali yok.
- `updated-*` PNG dosyaları güncel masaüstü, mobil, kayıt, gündem ve footer
  görünümlerinin gerçek Chromium ekran görüntüleridir.
