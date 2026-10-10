# Bağımlılık güvenlik incelemesi

İnceleme tarihi: 10 Ekim 2026. Bu rapor auth incelemesi sırasında alınan npm audit çıktısını ve resmi paket metadatasını açıklıyor. npm audit sayıları etkilenen üst paketleri de sayar; her bulgu ayrı bir kök güvenlik açığı anlamına gelmez.

## Uygulanan yapılandırma

Projenin çalışan `nx` ve `@nx/angular` sürümleri **23.2.1** olarak korundu. Nx'in üç geliştirme bağımlılığı için sadece Nx altında geçerli dar kapsamlı npm overrides tanımlandı:

```json
{
  "overrides": {
    "nx": {
      "axios": "1.20.0",
      "brace-expansion": "5.0.12",
      "smol-toml": "1.9.0"
    }
  }
}
```

| Nx bağımlılığı    | Önceki sürüm | Yeni sürüm | Uyumluluk değerlendirmesi                                                                              |
| ----------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `axios`           | `1.18.1`     | `1.20.0`   | Aynı major; Node CommonJS girişi korunuyor. Güvenlik düzeltmeleri runtime seçeneklerini güçlendiriyor. |
| `brace-expansion` | `5.0.9`      | `5.0.12`   | Aynı major/patch; Node şartı 20 veya 22 ve üstü.                                                       |
| `smol-toml`       | `1.6.1`      | `1.9.0`    | Aynı major; Node şartı `>=18`, CommonJS girişi mevcut.                                                 |

Resmi registry sorguları bu sürümlerin yayında olduğunu doğruladı. Projenin Node `24.15.0` sürümü belirtilen Node şartlarını karşılıyor. Metadata/API uyumu tek başına davranış garantisi değildir; build ve test sonuçları genel auth incelemesinde ayrıca raporlanır. [Axios 1.20.0 release](https://github.com/axios/axios/releases/tag/v1.20.0), [brace-expansion registry](https://registry.npmjs.org/brace-expansion/5.0.12), [smol-toml registry](https://registry.npmjs.org/smol-toml/1.9.0)

Nx 23.3.0 da değerlendirildi; bu sürümün Windows native yükleme başarısız olduğunda kullanılan WASI wrapper ve wasm export adları arasında uyuşmazlık gözlendi ve `WorkspaceContext` bulunamadığı için Nx başlatılamadı. Resmi npm registry'de düzeltilmiş bir 23.3.1+ stable sürüm bulunmadı. Çalışan geliştirme ortamını korumak için orijinal Nx sürümü ve yukarıdaki dar overrides seçildi. Nx 23.2.1 Undici bağımlılığı taşımadığı için Undici override'ı son yapılandırmada gerekli değildir.

## Audit sonuçları

Son kurulum başarılı tamamlandı. Yeniden çalıştırılan `npm audit --omit=dev` **0 bulgu**, tam `npm audit` ise **7 bulgu (5 high, 2 moderate)** bildirdi. Son değişiklikler yalnızca geliştirme bağımlılıklarına uygulandı. Build ve UI testlerinin sonuçları auth incelemesinin genel doğrulama raporunda ayrıca yer alır.

Başlangıçtaki tam audit **16 bulgu (14 high, 2 moderate)** bildirmişti. Nx araç zincirindeki üç etkilenen sürüm yukarıdaki overrides ile düzeltildi; son audit'te Nx, Axios, brace-expansion veya smol-toml listelenmiyor.

Kalan yedi paket `braces`, `chokidar`, `fast-glob`, `micromatch`, `postcss-nested`, `postcss-selector-parser` ve `tailwindcss`. Bunlar aşağıda açıklanan iki kök açık ailesinin derleme araçlarına yayılmasıyla oluşuyor.

```bash
npm audit --omit=dev
npm audit
npm test
npm run typecheck
npm run build
npm run test:ui
```

## Tailwind tarafında kalan sınır

Resmi npm registry sorgusunda Tailwind 3'ün en yeni sürümü `3.4.19`, `braces` latest sürümü `3.0.3`, selector-parser 6'nın en yeni sürümü `6.1.4` olarak doğrulandı. Normal `npm update`, bu iki açık ailesini kendiliğinden güvenli bir sürüme taşıyamıyor:

- `braces <=3.0.3` için GitHub Reviewed advisory'de **Patched versions: None** yazıyor. Çok derin brace desenleri Node.js sürecini durdurabilen kontrolsüz recursion'a neden olabilir. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- Tailwind 3, `postcss-selector-parser: ^6.1.2` istiyor. Audit'in belirttiği düzeltilmiş `7.1.6` bu aralığın dışında. Parser 7 override'ı major aralığını bilinçli aşar; CSS çıktısı ve uyumluluk doğrulanmadan uygulanmamalıdır.

Tailwind 4'e geçiş CSS ve build yapılandırması göçü gerektirir. Bu nedenle `npm audit fix --force` ile geniş kapsamlı otomatik sürüm değişikliği uygulanmadı. Bu auth incelemesi kalan Tailwind araç bulgularını gizlemez; düzeltme yayınlandığında tekrar değerlendirilmelidir.

Bu paketler lock dosyasında `dev: true` olarak işaretlidir ve geliştirme/derleme araçlarından gelir. Bu inceleme uygulamanın tarayıcıda bunları çalıştırdığını veya auth verilerinin bu açıklarla sızdığını göstermedi. Bununla birlikte CI/derleme süreçleri de korunmalıdır: dışarıdan gelen glob/brace/selector girdilerini build araçlarına doğrudan iletme, güvenilmeyen PR derlemelerine üretim sırlarını verme.

Üretim auth güvenliği ayrıca Supabase RLS, server-side kayıt kuralları, güvenilir rol kaynakları, redirect allowlist ve SMTP ayarlarına bağlıdır. Paket audit'inin temiz çıkması bu ayarların doğrulandığı anlamına gelmez.
