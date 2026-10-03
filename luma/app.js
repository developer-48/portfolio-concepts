(() => {
  let temperature = 2700;
  let finish = 'Орех';
  let on = true;
  const range = document.getElementById('brightness');
  const power = document.getElementById('power');
  const classes = {'Орех': 'walnut', 'Чёрный дуб': 'oak', 'Светлый ясень': 'ash'};
  const labels = {2700: 'Тёплый', 3500: 'Мягкий', 4000: 'Нейтральный'};
  const setText = (id, value) => {document.getElementById(id).textContent = value;};

  function sync() {
    const value = Number(range.value);
    const root = document.documentElement.style;
    root.setProperty('--light-brightness', on ? String(.4 + value * .0068) : '.22');
    root.setProperty('--light-hue', temperature === 2700 ? '0deg' : temperature === 3500 ? '11deg' : '20deg');
    root.setProperty('--light-saturation', temperature === 2700 ? '1' : temperature === 3500 ? '.72' : '.38');
    setText('brightness-value', value + '%');
    setText('scene-label', on ? labels[temperature] + ' свет · ' + temperature + ' K · ' + value + '%' : 'Свет выключен');
    setText('power-label', on ? 'Свет включён' : 'Свет выключен');
    power.setAttribute('aria-pressed', String(on));
    power.setAttribute('aria-label', on ? 'Выключить свет' : 'Включить свет');
    setText('selected-finish', 'Основание: ' + finish.toLowerCase());
    document.getElementById('finish-sample').className = 'finish-sample ' + classes[finish];
    document.getElementById('selection-finish').value = finish;
    document.getElementById('selection-temp').value = temperature + ' K';
    document.getElementById('selection-brightness').value = value + '%';
    document.getElementById('selection-power').value = on ? 'Включён' : 'Выключен';
    setText('selection-summary', 'AMBER 01 · ' + finish + ' · ' + temperature + ' K · яркость ' + value + '% · свет ' + (on ? 'включён' : 'выключен') + '.');
  }

  range.addEventListener('input', sync);
  power.addEventListener('click', () => {on = !on; sync();});
  document.querySelectorAll('[data-temperature]').forEach(button => button.addEventListener('click', () => {
    temperature = Number(button.dataset.temperature);
    document.querySelectorAll('[data-temperature]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    sync();
  }));
  document.querySelectorAll('[data-finish]').forEach(button => button.addEventListener('click', () => {
    finish = button.dataset.finish;
    document.querySelectorAll('[data-finish]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    sync();
  }));

  const products = {
    amber: {name: 'AMBER 01', image: '../assets/luma.webp', copy: 'Стеклянный объём на деревянном основании. Мягкий локальный свет для прикроватной тумбы, полки или небольшого столика.', specs: {'Тип': 'Настольный', 'Материалы': 'Стекло / дерево', 'Размер концепта': 'Ø 180 × 300 мм', 'Свет': '2700–4000 K'}},
    line: {name: 'LINE 02', image: '../assets/luma-line.webp', copy: 'Тонкая линия света над обеденным столом. Подвес подчёркивает горизонталь и оставляет пространство открытым.', specs: {'Тип': 'Подвесной', 'Материалы': 'Алюминий / рассеиватель', 'Размер концепта': '1200 × 35 мм', 'Свет': 'Направленный'}},
    arc: {name: 'ARC 03', image: '../assets/luma-arc.webp', copy: 'Напольный светильник рядом с креслом. Тканевый абажур смягчает свет и создаёт спокойный уголок для вечернего чтения.', specs: {'Тип': 'Напольный', 'Материалы': 'Металл / ткань', 'Высота концепта': '1450 мм', 'Свет': 'Рассеянный'}}
  };
  const dialog = document.getElementById('product-detail');
  document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
    const product = products[button.dataset.product];
    const image = document.getElementById('product-image');
    image.src = product.image;
    image.alt = product.name + ' в интерьере';
    setText('product-title', product.name);
    setText('product-description', product.copy);
    const specs = document.getElementById('product-specs');
    specs.replaceChildren();
    Object.entries(product.specs).forEach(([key, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = key;
      description.textContent = value;
      row.append(term, description);
      specs.append(row);
    });
    dialog.showModal();
  }));
  document.getElementById('detail-config').addEventListener('click', () => dialog.close());
  sync();

  if (window.gsap && window.ScrollTrigger) {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.l-hero-photo', {scale: 1.035}, {scale: 1.09, ease: 'none', scrollTrigger: {trigger: '.l-hero', start: 'top top', end: 'bottom top', scrub: 1}});
      document.querySelectorAll('.l-model-photo').forEach(frame => {
        gsap.fromTo(frame.querySelector('img'), {scale: 1.06, yPercent: -2}, {scale: 1.06, yPercent: 2, ease: 'none', scrollTrigger: {trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 1}});
      });
    });
  }
})();
