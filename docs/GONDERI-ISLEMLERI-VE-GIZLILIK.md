# Public Storage geri alma — 18 Ekim 2026

Kullanıcının isteğiyle yalnızca private Storage geçişi geri alındı. Gönderi menüsü,
arşivleme, öne çıkarma, rapor, beğeni/kaydetme, yorumlar ve uygulama içi engelleme kodu korundu.

## Geri alınanlar

- Private indirme servisi, directive ve uygulama bağlantıları kaldırıldı.
- Avatar, kapak, gönderi fotoğrafı ve video tekrar mevcut public URL ile görüntülenir.
- Fotoğraf/video sıkıştırma, yükleme, URL kaydı ve dosya doğrulama akışı korunur.
- SQL 12 bucket'ı private yapmaz ve Storage işlem yardımcısı gerektirmez.
- Private okuma testlerinin yerine public görüntüleme ve geri alma testleri eklendi.
- Tema, welcome ve giriş/kayıt ekranlarının tasarımı değiştirilmedi.

## Supabase ayarı

Canlı Supabase ayarları bu çalışma sırasında değiştirilmedi.
Bucket'ı kendin private yaptıysan Storage → uploads → Configuration bölümünde **Public** aç.
Önceki private SQL 12'yi de çalıştırdıysan `docs/supabase/13-restore-public-uploads.sql`
dosyasını SQL Editor'da çalıştır. Bu dosya bucket'ı Public yapar ve yalnızca private okuma
kurallarını geri alır. Tekrar çalıştırılabilir; dosya/tablo/satır silmez, yükleme ve gönderi
silme sahiplik kurallarını kaldırmaz. Sonuçta `is_public = true` görünür.

Mevcut gönderi özellikleri için hazırlanan `12-post-actions-and-blocking.sql` ayrı kurulumdur;
yeni ilişki tabloları ve gönderi alanlarını gerektirir. Daha önce uygulanan 12 tekrar çalıştırılmaz.

## Gizlilik sınırı

Engelleme uygulamadaki profil, akış, arama ve etkileşim satırlarına RLS ile uygulanır.
**Public dosyanın URL'sini bilen kişi dosyayı açabilir.** Uygulama bu dosyalar için tam erişim
engeli vaat etmez. [Supabase public bucket davranışı](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## Doğrulama

- Tip kontrolü geçti; TR/EN 490 anahtarı eşleşiyor.
- 131 birim testi ve 24 PostgreSQL/PGlite senaryosu geçti. Public geri alma SQL'i tekrar çalıştırılarak dosya/satır sayısının ve gönderi silme kurallarının korunduğu doğrulandı.
- Üretim derlemesi ve çıktı denetimi geçti. İlk paket 725,38 kB; 700 kB uyarısı var, 1 MB hata sınırının altında.
- Üretim CSP/oturum/medya güvenlik kontrollerinin 10'u geçti.
- Angular olay bağlama adaptörüyle strict UI kontrolü sıfır bulgu verdi.
- Tam tarayıcı paketindeki 108 test geçti; public medya görüntüleme, fotoğraf/video yükleme,
  profil, gönderi işlemleri, auth ve tüm ekran/tema/dil kontrolleri dahil.

Önceki private sürümdeki test sonuçları yeni sürüme mal edilmez.
Canlı Supabase üzerinde gerçek kullanıcıya ait dosya/gönderi eklenmedi veya silinmedi.
