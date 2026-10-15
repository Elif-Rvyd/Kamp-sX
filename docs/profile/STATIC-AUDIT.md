# Statik kontrol açıklaması

`docs/profile-premium-audit.json`, kurulu frontend-design-premium denetleyicisinin değiştirilmeden çalıştırılmış raporudur. Ham rapordaki buton bulguları Angular şablon sözdiziminin araçta tanınmamasından kaynaklanır: gerçek `(click)` bağlamaları ve görsel `aria-disabled` kontrolleri normalleştirilmeden tanınmaz. Bunlar dashboard, profil ve gönderi ekranlarının tarayıcı testlerinde ayrıca kontrol edilir.

`docs/profile-premium-audit-angular.json`, aynı strict denetleyicinin yalnızca HTML bağlama tanıması Angular'a uyarlanmış sonucudur: **0 hata, 0 uyarı**. Kurulu araç ve uygulama kaynakları bu uyarlama tarafından değiştirilmez. Diğer denetim kuralları aynen çalışır. Kaynakta textarea'ların `resize-none` sınıfı ile scoped `resize: none` kuralı birlikte bulunur.

Uyarlamanın tamamı aşağıdadır; ilk argüman kurulu `audit_project.py` dosyasının yoludur. Ardından normal aracın proje-kökü, `--mode strict` ve `--output` argümanları gelir.

```python
import importlib.util
import re
import sys
from dataclasses import replace
from pathlib import Path

upstream = Path(sys.argv.pop(1)).absolute()
spec = importlib.util.spec_from_file_location("premium_audit", upstream)
audit = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = audit
spec.loader.exec_module(audit)
original_tags = audit.iter_html_tags

def angular_tags(text, names=None):
    for tag in original_tags(text, names):
        if tag.name == "button" and not tag.closing:
            attributes = re.sub(r"\(click\)(?=\s*=)", "onclick", tag.attributes)
            if re.search(r'\baria-disabled\s*=\s*([\"\'])true\1', attributes):
                attributes += " disabled"
            tag = replace(tag, attributes=attributes)
        yield tag

audit.iter_html_tags = angular_tags
raise SystemExit(audit.main())
```

Bu kontrol erişilebilirlik, gerçek etkileşim veya performans ölçümünün yerine geçmez. Profilin her TR/EN ve açık/koyu kombinasyonunda Axe, taşma ve konsol kontrolleri ayrıca çalıştırılmıştır.
