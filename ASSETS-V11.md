# ATLAS v11 — ракурсы автомобиля и переход в салон

17 октября 2026. Встроенный imagegen, по исходным изображениям соответствующих автомобилей. Двенадцать иллюстраций 1536 × 1024, WebP quality 97, без уменьшения или искусственного увеличения. Front и entry сохраняют alpha. Cabin — обычные фотографии интерьеров.

- `front`: фронтальный ракурс с закрытыми дверями для обработки капота и бампера.
- `entry`: вид сзади и сбоку; передняя дверь открыта на передних петлях у A-стойки. Задние двери закрыты.
- `cabin`: вид из собственного салона выбранного класса.

Это иллюстрации концепта. Смена ракурсов выполняется переходами фотографических слоёв; автомобиль не является вращаемой 3D-моделью. GSAP объединяет смену кадров с обработкой в один управляемый сценарий. Three.js сканирует кузов по маскам, привязанным к каждому фронтальному кадру.

## Файлы и точные промпты

### coupe-entry

Файл: `assets/atlas-v11/coupe-entry.webp`.

Исходник: `exec-90f8b737-a6fe-46d9-b598-2519cf5dc085.png`.

Use case: precise-object-edit. Input is an identity reference for this exact dark British racing green Porsche 911 sports coupe. Produce one new photorealistic automotive studio view of the SAME car, viewed from REAR LEFT three-quarter, camera just behind the driver seat looking diagonally forward. The nose points to the RIGHT of the frame. Open the driver front door normally, hinged at the FRONT edge at the A-pillar beside the FRONT wheel, as on a real Porsche 911. Door rotates OUTWARD around a vertical hinge attached to the front/A-pillar, its free rear latch edge swings out toward the viewer. No rear-hinged coach/suicide door, no wing door, no detached door. Rear side of cabin and rear quarter panel remain fixed. Make hinge position and normal door mechanism unambiguous. Entire car visible with the open door and graphite sport seats visible. Same multi-spoke silver wheels, same deep green paint, no replacement model, no extra doors. All tires and the door stay inside frame. Crisp high-end automotive photography, natural smooth paint and clear fine detail without oversharpened outlines or illustration texture. Landscape 3:2, generous 8% margins. True alpha transparent background, no vignette or baked studio walls, subtle natural contact shadow. No people, letters, labels or watermark.

### coupe-front

Файл: `assets/atlas-v11/coupe-front.webp`.

Исходник: `exec-be0c4f47-da65-4632-bbc7-cd514162b06a.png`.

Use case: precise-object-edit. Reference identifies the exact dark British-racing-green Porsche 911 coupe, its headlights, front bumper, wheels and paint. Produce a new perfectly symmetrical HEAD-ON FRONT view of this SAME vehicle, camera centered on its longitudinal axis, slightly elevated enough that the full hood is clearly visible. All doors CLOSED. Full front width including mirrors and tires visible, no cropping. Large hood and front bumper are the subject, accurate 911 proportions and round headlights, no giant grille. Natural exceptionally clear premium studio photograph, realistic smooth deep green paint, authentic rubber and fine metallic details, no artificial sharpening halos, no illustration. Landscape 3:2 at highest available native detail, vehicle occupies 82% width and 72% height centered, transparent alpha background, no vignette or wall. No text/watermark/overlays. Keep the car identity and dark green paint exactly.

### coupe-cabin

Файл: `assets/atlas-v11/coupe-cabin.webp`.

Исходник: `exec-7d98d93b-bc22-4e8f-9adb-6672e9182342.png`.

Use case: product-mockup. Reference identifies a dark British-racing-green Porsche 911 coupe. Create an exceptionally sharp premium editorial photograph INSIDE its graphite leather 911 cockpit, camera from the rear-seat center looking forward between both sculpted sport seats toward the steering wheel, five-dial instrument cluster, dashboard and center console. Correct left-hand-drive Porsche 911 architecture, low sports-car cabin, driver wheel on the LEFT, two sport seat backs at the edges framing the view. No different car, no SUV dashboard. Doors closed in this cabin view. Smooth realistic graphite leather, finely visible stitching and perforation, authentic materials with natural texture. Subtle neutral soft detailing-studio light entering windows; glass reveals a softly blurred charcoal studio. Landscape 3:2 composition, no cutout, no people, cleaning tools, text, overlays or watermark. Natural photography with fine detail, no painterly rendering, sharpening halos or exaggerated glossy surfaces.

### sedan-entry

Файл: `assets/atlas-v11/sedan-entry.webp`.

Исходник: `exec-d295d526-1424-4821-95ca-591f10159494.png`.

Use case: precise-object-edit. Input is an identity reference for this exact silver four-door executive sedan with horizontal chrome grille and slim headlights. Produce one new exceptionally crisp photographic studio view of the SAME car, viewed from REAR LEFT three-quarter, camera just behind the driver seat looking diagonally forward. Nose points to the RIGHT of the frame. Open ONLY the driver front door normally: hinge fixed at FRONT edge at the A-pillar beside the FRONT wheel. Its free REAR latch edge swings outward toward the viewer. Physically correct single front-hinged door, no rear-hinged coach door, no floating door, no duplicated door. Rear doors remain CLOSED. Entire vehicle and door visible inside frame. Preserve exact body shape, wheels, paint, roofline and identity from reference. Cabin has wide graphite leather executive sedan cabin, relaxed seat bolsters, conventional central infotainment screen and brushed metallic trim. Show near-side driver seat and inside door panel. Natural detailed photography, smooth realistic paint, no etched outlines or painterly blur. 3:2 landscape, 8% margins, true transparent alpha background, only subtle contact shadow. No people, text or watermark.

### sedan-front

Файл: `assets/atlas-v11/sedan-front.webp`.

Исходник: `exec-bc9d25c7-39cf-4782-836a-39b107b9bd2b.png`.

Use case: precise-object-edit. Input identifies the exact silver four-door executive sedan with horizontal chrome grille and slim headlights. Produce a new perfectly symmetrical HEAD-ON FRONT view of this SAME vehicle, camera centered on its longitudinal axis, slightly elevated to show the full hood clearly. All doors CLOSED. Full front width including mirrors and tires visible. Preserve reference grille, headlights, bumper, width/height proportions, metallic SILVER paint and model identity. This is not a Porsche. Natural premium studio photography, exceptionally clear surfaces and fine metallic details, realistic rubber, no oversharpening halos, no painterly texture. Landscape 3:2, car fills about 82% width and 76% height, centered. True alpha transparent background with a faint contact shadow only; no vignette or studio wall. No text, watermark or overlays.

### sedan-cabin

Файл: `assets/atlas-v11/sedan-cabin.webp`.

Исходник: `exec-040208f8-3642-414d-b25c-d0828cc3632d.png`.

Use case: product-mockup. Input identifies the exact silver four-door executive sedan with horizontal chrome grille and slim headlights. Create a premium photorealistic cockpit photograph INSIDE this vehicle: wide graphite leather executive sedan cabin, relaxed seat bolsters, conventional central infotainment screen and brushed metallic trim. Camera from the rear-seat center looking forward between two front seat backs toward the steering wheel, dashboard and center console; both front-seat leather cushions visible along bottom edge. LEFT-hand drive, steering wheel on LEFT. Architecture appropriate to this sedan, no Porsche steering wheel or sports-car dashboard. Closed doors, silver mirrors visible at window edges, neutral softly blurred charcoal detailing studio beyond windscreen. Clean graphite leather, genuine fine stitching and material grain, crisp physical switches and air vents, coherent realistic geometry. Soft neutral white studio lighting and natural photographic contrast. Landscape 3:2, full frame opaque image. No people, tools, promotional text, oversized logos, overlays or watermark. Highest native detail, no sharpening halos or painterly rendering.

### crossover-entry

Файл: `assets/atlas-v11/crossover-entry.webp`.

Исходник: `exec-f2298d78-773a-486a-8315-d3feac23d65c.png`.

Use case: precise-object-edit. Input is an identity reference for this exact silver mid-size five-door crossover with hexagonal grille, slim headlights and roof rails. Produce one new exceptionally crisp photographic studio view of the SAME car, viewed from REAR LEFT three-quarter, camera just behind the driver seat looking diagonally forward. Nose points to the RIGHT of the frame. Open ONLY the driver front door normally: hinge fixed at FRONT edge at the A-pillar beside the FRONT wheel. Its free REAR latch edge swings outward toward the viewer. Physically correct single front-hinged door, no rear-hinged coach door, no floating door, no duplicated door. Rear doors remain CLOSED. Entire vehicle and door visible inside frame. Preserve exact body shape, wheels, paint, roofline and identity from reference. Cabin has upright mid-size crossover cabin, graphite cloth and leather seats, tall central console, broad front windows and practical sculpted dashboard. Show near-side driver seat and inside door panel. Natural detailed photography, smooth realistic paint, no etched outlines or painterly blur. 3:2 landscape, 8% margins, true transparent alpha background, only subtle contact shadow. No people, text or watermark.

### crossover-front

Файл: `assets/atlas-v11/crossover-front.webp`.

Исходник: `exec-1e25acc9-4e14-4719-aff3-0417cce59d7c.png`.

Use case: precise-object-edit. Input identifies the exact silver mid-size five-door crossover with hexagonal grille, slim headlights and roof rails. Produce a new perfectly symmetrical HEAD-ON FRONT view of this SAME vehicle, camera centered on its longitudinal axis, slightly elevated to show the full hood clearly. All doors CLOSED. Full front width including mirrors and tires visible. Preserve reference grille, headlights, bumper, width/height proportions, metallic SILVER paint and model identity. This is not a Porsche. Natural premium studio photography, exceptionally clear surfaces and fine metallic details, realistic rubber, no oversharpening halos, no painterly texture. Landscape 3:2, car fills about 82% width and 76% height, centered. True alpha transparent background with a faint contact shadow only; no vignette or studio wall. No text, watermark or overlays.

### crossover-cabin

Файл: `assets/atlas-v11/crossover-cabin.webp`.

Исходник: `exec-a3d54f89-5986-4af2-8d03-b45b048b1541.png`.

Use case: product-mockup. Input identifies the exact silver mid-size five-door crossover with hexagonal grille, slim headlights and roof rails. Create a premium photorealistic cockpit photograph INSIDE this vehicle: upright mid-size crossover cabin, graphite cloth and leather seats, tall central console, broad front windows and practical sculpted dashboard. Camera from the rear-seat center looking forward between two front seat backs toward the steering wheel, dashboard and center console; both front-seat leather cushions visible along bottom edge. LEFT-hand drive, steering wheel on LEFT. Architecture appropriate to this crossover, no Porsche steering wheel or sports-car dashboard. Closed doors, silver mirrors visible at window edges, neutral softly blurred charcoal detailing studio beyond windscreen. Clean graphite leather, genuine fine stitching and material grain, crisp physical switches and air vents, coherent realistic geometry. Soft neutral white studio lighting and natural photographic contrast. Landscape 3:2, full frame opaque image. No people, tools, promotional text, oversized logos, overlays or watermark. Highest native detail, no sharpening halos or painterly rendering.

### suv-entry

Файл: `assets/atlas-v11/suv-entry.webp`.

Исходник: `exec-5af72b73-7ece-44c5-afaf-4637ebb950b5.png`.

Use case: precise-object-edit. Input is an identity reference for this exact silver large full-size SUV with tall horizontal chrome grille, broad rectangular headlights and roof rails. Produce one new exceptionally crisp photographic studio view of the SAME car, viewed from REAR LEFT three-quarter, camera just behind the driver seat looking diagonally forward. Nose points to the RIGHT of the frame. Open ONLY the driver front door normally: hinge fixed at FRONT edge at the A-pillar beside the FRONT wheel. Its free REAR latch edge swings outward toward the viewer. Physically correct single front-hinged door, no rear-hinged coach door, no floating door, no duplicated door. Rear doors remain CLOSED. Entire vehicle and door visible inside frame. Preserve exact body shape, wheels, paint, roofline and identity from reference. Cabin has spacious tall full-size SUV cabin, broad graphite leather seats, wide dashboard with a large landscape center screen, robust horizontal architecture and high seating position. Show near-side driver seat and inside door panel. Natural detailed photography, smooth realistic paint, no etched outlines or painterly blur. 3:2 landscape, 8% margins, true transparent alpha background, only subtle contact shadow. No people, text or watermark.

### suv-front

Файл: `assets/atlas-v11/suv-front.webp`.

Исходник: `exec-81e62905-654d-42e9-9ad8-756da747e2f3.png`.

Use case: precise-object-edit. Input identifies the exact silver large full-size SUV with tall horizontal chrome grille, broad rectangular headlights and roof rails. Produce a new perfectly symmetrical HEAD-ON FRONT view of this SAME vehicle, camera centered on its longitudinal axis, slightly elevated to show the full hood clearly. All doors CLOSED. Full front width including mirrors and tires visible. Preserve reference grille, headlights, bumper, width/height proportions, metallic SILVER paint and model identity. This is not a Porsche. Natural premium studio photography, exceptionally clear surfaces and fine metallic details, realistic rubber, no oversharpening halos, no painterly texture. Landscape 3:2, car fills about 82% width and 76% height, centered. True alpha transparent background with a faint contact shadow only; no vignette or studio wall. No text, watermark or overlays.

### suv-cabin

Файл: `assets/atlas-v11/suv-cabin.webp`.

Исходник: `exec-ff08c5ac-90d4-4824-9bc7-170f1886c50e.png`.

Use case: product-mockup. Input identifies the exact silver large full-size SUV with tall horizontal chrome grille, broad rectangular headlights and roof rails. Create a premium photorealistic cockpit photograph INSIDE this vehicle: spacious tall full-size SUV cabin, broad graphite leather seats, wide dashboard with a large landscape center screen, robust horizontal architecture and high seating position. Camera from the rear-seat center looking forward between two front seat backs toward the steering wheel, dashboard and center console; both front-seat leather cushions visible along bottom edge. LEFT-hand drive, steering wheel on LEFT. Architecture appropriate to this suv, no Porsche steering wheel or sports-car dashboard. Closed doors, silver mirrors visible at window edges, neutral softly blurred charcoal detailing studio beyond windscreen. Clean graphite leather, genuine fine stitching and material grain, crisp physical switches and air vents, coherent realistic geometry. Soft neutral white studio lighting and natural photographic contrast. Landscape 3:2, full frame opaque image. No people, tools, promotional text, oversized logos, overlays or watermark. Highest native detail, no sharpening halos or painterly rendering.
