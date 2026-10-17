# ATLAS v12 — настоящие 3D-модели

В конфигураторе теперь используются четыре локальных GLB с геометрией кузова, салона и передних дверей. Изображения v10 оставлены только резервной иллюстрацией при недоступном WebGL. Hero и блок услуг v9 не изменялись.

## Модели

Лицензии всех четырёх моделей сверены с актуальной Sketchfab Data API 17 октября 2026 года: **CC BY 4.0**, включая коммерческое использование с указанием авторства. Публичная атрибуция — `atlas/model-credits.html`, ссылка из окна «О концепте и данных».

| Файл | Оригинальная модель | Автор | Копия для обработки |
|---|---|---|---|
| `assets/atlas-3d/coupe.glb` | [Porsche GT3 RS](https://sketchfab.com/3d-models/porsche-gt3-rs-e738eae819c34d19a31dd066c45e0f3d) | [Black Snow](https://sketchfab.com/BlackSnow02) | [porsche-ui / public/car/911-gt3-rs.glb](https://github.com/vasiledraguta/porsche-ui/blob/main/public/car/911-gt3-rs.glb) |
| `assets/atlas-3d/sedan.glb` | [Mersedes-Benz s65 w222](https://sketchfab.com/3d-models/mersedes-benz-s65-w222-f42d9d13b0404b5b9a2302a4c590a94d) | Black Snow | [carros / assets](https://github.com/pedrosoandre/carros/tree/main/assets) |
| `assets/atlas-3d/crossover.glb` | [BMW X6M Competition Assetto](https://sketchfab.com/3d-models/bmw-x6m-competition-assetto-wwwvecarzcom-3979a908081948e0971f5a5380b60a0f) | [vecarz](https://sketchfab.com/heynic) | carros / assets / bmw-x6m-competition.glb |
| `assets/atlas-3d/suv.glb` | [Mersedes-Benz GLS](https://sketchfab.com/3d-models/mersedes-benz-gls-6f8ad7f1624e42c58b4e9525cc45c8be) | Black Snow | carros / assets / mercedes-benz-mersedes-gls.glb |

Адаптация: масштабирование до длины 4.65 единицы, перенос на поверхность, группировка кузова/интерьера/стёкол/дисков, подготовка узлов DoorLeft/DoorRight с передними петлями, объединение совместимых примитивов, локальные текстуры WebP до 1024 px и meshopt. Исходные авторство, URL и лицензия сохранены внутри каждого GLB. Материалы и освещение дополнительно настроены в сцене. Исследовательские модели с неподходящими лицензиями в выпуск не входят.

## Библиотеки

- Three.js 0.180.0: GLTFLoader, BufferGeometryUtils, RoomEnvironment — из официального npm-пакета `three@0.180.0`; MIT, `shared/three/LICENSE`. Изменены только пути импортов на локальные файлы.
- Meshoptimizer decoder 0.22 — из того же пакета Three.js; MIT, `shared/three/LICENSE-meshoptimizer.md`.
- Используется уже поставляемый с сайтом GSAP 3.13.0. У сцены одна активная временная шкала.

## Загрузка и рендер

Модель загружается при приближении к блоку. Загружается только выбранный автомобиль; кэш содержит максимум две модели, вытесненные ресурсы освобождаются. Все ресурсы GLB встроены в файл, запросы к Sketchfab во время работы сайта отсутствуют.

Рендер по запросу: анимация, перетаскивание, изменение ракурса/размера. После завершения и вне экрана кадров нет. DPR ограничен 1.75 на десктопе, 1.35 на узком экране и общим бюджетом 900000 пикселей; при медленных кадрах понижается до 1. Текст и SVG-кнопка изменяются только при смене состояния, прогресс — не чаще 10 раз в секунду.
