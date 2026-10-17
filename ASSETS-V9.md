# ATLAS v9 — единый автомобиль и понятные действия

17 октября 2026. Изображения созданы встроенным инструментом imagegen. Внешние фотографии не использовались. Это иллюстрации авторского концепта, а не реальные клиентские автомобили или результаты студии.

## Файлы

| Файл | Назначение |
| --- | --- |
| `assets/atlas-v9/hero.webp` | Главный экран: тот же Porsche в более глубоком зелёном цвете |
| `assets/atlas-v9/coupe.webp` | Прозрачное купе для существующих масок конфигуратора |
| `assets/atlas-v9/film.webp` | Укладка прозрачной плёнки на капот |
| `assets/atlas-v9/polish.webp` | Полировка машинкой и мягким кругом |
| `assets/atlas-v9/coating.webp` | Нанесение состава небольшим аппликатором |
| `assets/atlas-v9/interior.webp` | Крупный план чистки сиденья и интерьера |
| `portfolio/assets/atlas.webp` | Новый снимок первого экрана, полученный из браузера |

Все новые кадры используют `assets/atlas-v7/hero.webp` как референс идентичности автомобиля. Для редактирования купе использован `assets/atlas-v7/coupe.webp`. Генерация hero и купе — редактирование исходников; сцены услуг — новые ракурсы того же автомобиля. Для купе запрошена прозрачность и сохранение координат силуэта. После генерации выполнены только преобразование в WebP и уменьшение купе до 1200 × 800; цвет и фон программно не перекрашивались.

## Промпты

Общая формулировка оттенка, подставленная в каждый запрос:

> deep British racing green metallic: nearly black forest green in shadow, restrained rich green in soft highlights, subtle metallic flake. Sophisticated muted paint, not emerald neon, not turquoise, no exaggerated white contour reflections

### Hero

Use case: precise-object-edit. Edit this website hero photograph. Change ONLY the Porsche paint to the color specification above. Keep exactly the same Porsche 911, wheels, position, framing, studio, floor, light strips and background. Retain realistic paint highlights but soften blown-out contour streaks on car. Wide 16:9 photograph. No text, no new objects.

### Coupe

Use case: precise-object-edit. Repaint this exact Porsche cutout with the color specification above. STRICT preserve original car shape, wheels, viewing angle, size, placement, transparent margins and original 3:2 canvas. The existing silhouette and every wheel/window boundary must remain at exactly the same normalized image coordinates because animation masks align to them. Only change paint color and soften excessively sharp white reflected streaks. Keep real transparent background. No text.

### Film

Use case: product-mockup. Photograph for a premium detailing website showing the EXACT SAME Porsche 911 from reference, same wheels and the color specification above. New close three-quarter photograph focused on hood and one distinctive oval headlight. A real transparent protective film sheet is partially lifted above the hood with gentle soft curl, tiny water droplets underneath; two black nitrile gloved hands carefully tension the film and guide a short felt squeegee. The hood curvature and headlight clearly establish the same Porsche. Dark clean high-end studio, neutral softbox reflections. Photorealistic editorial detailing photography, richly tactile, precise believable hands and tools. Wide 3:2, no text, no logos added, no grids, no magic effects, no other vehicle. Film installation must be instantly legible.

### Polish

Use case: product-mockup. Premium automotive detailing photograph: EXACT SAME Porsche 911, same design and the color specification above. Distinct close angled view of front fender and hood beside the oval headlight. Black nitrile gloved hands hold a professional dual-action polisher with a round pale foam pad visibly touching the hood, aligned flat with its surface. Subtle buffing haze near pad, pristine rich reflection behind it. Same dark refined studio with broad white softbox lighting. Photorealistic, credible ergonomics, high-end editorial, wide 3:2 composition. No text, no added logos, no protective film in this shot, no different vehicle. Show the act of polishing clearly.

### Coating

Use case: product-mockup. Premium detailing editorial photograph of EXACT SAME Porsche 911 with the color specification above. A distinct macro-close view of the curved hood edge and oval headlight with a black nitrile gloved hand applying ceramic coating using a SMALL rectangular suede-wrapped foam applicator flat on the paint. A small unlabelled dark glass ceramic coating bottle rests on clean folded microfiber at the edge of the work area. Show a subtle wet straight application trail and crisp softbox reflection in green paint. Dark refined studio, natural tactile materials, photorealistic credible hand/tool interaction. Wide 3:2. No text, no extra logos, no large polishing machine, no film, no repeated reference composition.

### Interior

Use case: product-mockup. Premium automotive detailing editorial photograph showing INTERIOR of the exact Porsche 911 reference. View through open driver's door: graphite black leather sport seat in foreground, matching Porsche steering wheel and circular instruments in background, a small visible strip of the color specification above on door sill. Black nitrile gloved hand carefully guides a compact clear upholstery extraction nozzle over the lower leather seat cushion; restrained foam and visible clean leather grain, no dramatic steam. Believable Porsche sports-car cabin, charcoal leather and silver trim, high-end soft neutral studio light. Realistic anatomy and tools. Wide 3:2 composition with the seat and active cleaning tool clearly visible, no text, no added logos, no different car.
