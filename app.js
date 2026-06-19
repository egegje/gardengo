/* GardenGo — data-driven renderer. Works in view mode (index.html) and edit mode (admin.html). */
(() => {
  "use strict";

  const PALETTES = {
    'Лес':     { main:'#34503F', deep:'#21342A', soft:'#E6ECE3', tint:'#EFF2EC' },
    'Глина':   { main:'#A86A45', deep:'#5E3A23', soft:'#F1E5DB', tint:'#F6EEE6' },
    'Изумруд': { main:'#1C5A50', deep:'#0F352F', soft:'#DBE9E5', tint:'#EAF2EF' },
  };

  let C = {};               // active content
  let ADMIN = false;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---- path get/set: "hero.title1", "services.0.title", "walls.1.points.2" ---- */
  const get = (path) => path.split('.').reduce((o,k)=> (o==null?undefined:o[k]), C);
  const set = (path, val) => {
    const keys = path.split('.'); let o = C;
    for (let i=0;i<keys.length-1;i++){ o = o[keys[i]]; }
    o[keys[keys.length-1]] = val;
  };

  /* editable text element */
  const E = (tag, path, style, extra='') =>
    `<${tag} class="ed" data-path="${path}" style="${style}" ${extra}>${esc(get(path))}</${tag}>`;
  /* editable image */
  const IMG = (path, style, alt='', loading='lazy') =>
    `<img class="gimg" data-imgpath="${path}" src="${esc(get(path))}" alt="${esc(alt)}" loading="${loading}" style="${style}">`;

  /* ---- derived nav ---- */
  const navSections = () => {
    const s = [
      { id:'services', label:'Услуги' },
      { id:'walls', label:'Фитостены' },
      { id:'production', label:'Производство' },
      { id:'portfolio', label:'Портфолио' },
    ];
    if (C.config.showShop) s.push({ id:'shop', label:'Магазин' });
    s.push({ id:'contact', label:'Контакты' });
    return s;
  };
  const bottomNavItems = () => ([
    { id:'top', label:'Главная' },
    { id:'services', label:'Услуги' },
    { id:'walls', label:'Стены' },
    C.config.showShop ? { id:'shop', label:'Магазин' } : { id:'portfolio', label:'Работы' },
    { id:'contact', label:'Контакты' },
  ]);

  /* ===== sections ===== */
  function headerHTML(){
    const sec = navSections();
    return `
    <header style="position:sticky;top:0;z-index:60;background:rgba(245,241,232,0.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #E6DFCF;">
      <div style="max-width:1320px;margin:0 auto;padding:0 clamp(16px,5vw,56px);height:68px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <a href="#top" data-close style="display:flex;align-items:baseline;gap:2px;text-decoration:none;color:#20261F;flex:none;">
          <span style="font-family:'Lora',serif;font-weight:600;font-size:23px;letter-spacing:-.01em;">${esc(C.brand)}</span>
          <span style="font-family:'Lora',serif;font-weight:600;font-size:23px;color:var(--accent);">.</span>
        </a>
        <nav class="desktop-only" style="align-items:center;gap:clamp(8px,1.6vw,24px);">
          ${sec.map(n => `<a class="nav-link" data-nav="${n.id}" href="#${n.id}" style="position:relative;text-decoration:none;color:#3A4138;font:600 14.5px Manrope,sans-serif;padding:6px 1px;white-space:nowrap;">${esc(n.label)}<span class="bar" style="position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:2px;background:var(--accent);"></span></a>`).join('')}
        </nav>
        <div class="desktop-only" style="align-items:center;gap:16px;flex:none;">
          <a class="ed" data-path="phone" href="tel:${esc(C.tel)}" style="text-decoration:none;color:#20261F;font:600 15px Manrope,sans-serif;white-space:nowrap;">${esc(C.phone)}</a>
          <a class="btn-primary" href="#contact" style="display:inline-flex;align-items:center;background:var(--accent);color:#fff;padding:11px 22px;border-radius:100px;font:600 14px Manrope,sans-serif;text-decoration:none;white-space:nowrap;">Консультация</a>
        </div>
        <div class="mobile-only" style="align-items:center;gap:9px;flex:none;">
          <span style="display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border-radius:100px;background:var(--accent-soft);font:600 12.5px Manrope,sans-serif;color:var(--accent-deep);max-width:42vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);flex:none;"></span><span id="active-label">Главная</span>
          </span>
          <button id="burger" aria-label="Открыть меню" style="width:44px;height:44px;border:1px solid #D8CFB9;border-radius:12px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;flex:none;">
            <span style="width:18px;height:2px;border-radius:2px;background:#20261F;"></span>
            <span style="width:18px;height:2px;border-radius:2px;background:#20261F;"></span>
            <span style="width:18px;height:2px;border-radius:2px;background:#20261F;"></span>
          </button>
        </div>
      </div>
    </header>`;
  }

  function drawerHTML(){
    const sec = navSections();
    return `
    <div id="drawer" style="position:fixed;inset:0;z-index:90;display:none;">
      <div data-close style="position:absolute;inset:0;background:rgba(20,25,18,.45);backdrop-filter:blur(2px);animation:ggOv .2s ease both;"></div>
      <div style="position:absolute;top:0;right:0;bottom:0;width:min(86vw,360px);background:#F5F1E8;box-shadow:-20px 0 50px rgba(0,0,0,.22);display:flex;flex-direction:column;animation:ggSlide .28s ease both;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #E6DFCF;">
          <span style="font-family:'Lora',serif;font-weight:600;font-size:21px;color:#1B221B;">Навигация</span>
          <button data-close aria-label="Закрыть меню" style="width:42px;height:42px;border:1px solid #D8CFB9;border-radius:11px;background:#fff;font-size:18px;color:#20261F;cursor:pointer;line-height:1;">✕</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:3px;">
          <a class="drawer-link" data-close href="#top" style="display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-radius:12px;text-decoration:none;font:600 17px Manrope,sans-serif;color:#2A312A;">Главная<span style="color:var(--accent);">→</span></a>
          ${sec.map(n => `<a class="drawer-link" data-nav="${n.id}" data-close href="#${n.id}" style="display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-radius:12px;text-decoration:none;font:600 17px Manrope,sans-serif;color:#2A312A;">${esc(n.label)}<span style="color:var(--accent);">→</span></a>`).join('')}
        </div>
        <div style="padding:16px 18px;border-top:1px solid #E6DFCF;display:flex;flex-direction:column;gap:11px;">
          <a data-close href="tel:${esc(C.tel)}" style="text-align:center;background:var(--accent);color:#fff;padding:15px;border-radius:100px;font:700 15px Manrope,sans-serif;text-decoration:none;">Позвонить · ${esc(C.phone)}</a>
          <div style="display:flex;gap:10px;">
            <a href="${esc(C.whatsapp)}" style="flex:1;text-align:center;background:#fff;border:1px solid #E0D8C6;border-radius:100px;padding:13px;font:600 14px Manrope,sans-serif;color:#1B221B;text-decoration:none;">WhatsApp</a>
            <a href="${esc(C.telegram)}" style="flex:1;text-align:center;background:#fff;border:1px solid #E0D8C6;border-radius:100px;padding:13px;font:600 14px Manrope,sans-serif;color:#1B221B;text-decoration:none;">Telegram</a>
          </div>
        </div>
      </div>
    </div>`;
  }

  const heroHTML = () => `
  <section style="max-width:1320px;margin:0 auto;padding:clamp(48px,6vw,80px) clamp(20px,5vw,56px) clamp(40px,5vw,72px);">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr));gap:clamp(36px,4.5vw,72px);align-items:center;">
      <div style="animation:ggFade .8s ease both;">
        <div style="display:inline-flex;align-items:center;gap:9px;padding:8px 16px;border:1px solid #D8CFB9;border-radius:100px;background:rgba(255,255,255,.5);margin-bottom:28px;">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--accent);"></span>
          ${E('span','hero.badge','font:600 12px Manrope,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#5C6358;')}
        </div>
        <h1 style="font-family:'Lora',serif;font-weight:500;font-size:clamp(40px,5.4vw,72px);line-height:1.04;letter-spacing:-.015em;color:#1B221B;margin-bottom:24px;">${E('span','hero.title1','')}<br>${E('span','hero.title2','')}<em class="ed" data-path="hero.titleEm" style="font-style:italic;color:var(--accent);">${esc(get('hero.titleEm'))}</em></h1>
        ${E('p','hero.text','font:400 18px/1.62 Manrope,sans-serif;color:#565C50;max-width:520px;margin-bottom:36px;')}
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:44px;">
          <a class="btn-primary btn-primary-lg ed" data-path="hero.ctaPrimary" href="#contact" style="display:inline-flex;align-items:center;gap:10px;background:var(--accent);color:#fff;padding:17px 32px;border-radius:100px;font:600 15px Manrope,sans-serif;text-decoration:none;">${esc(get('hero.ctaPrimary'))}</a>
          <a class="btn-outline ed" data-path="hero.ctaSecondary" href="#services" style="display:inline-flex;align-items:center;gap:10px;background:transparent;color:var(--accent);padding:17px 30px;border-radius:100px;font:600 15px Manrope,sans-serif;text-decoration:none;border:1px solid var(--accent);">${esc(get('hero.ctaSecondary'))}</a>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:clamp(20px,3vw,40px);">
          ${C.stats.map((st,i) => `<div style="display:flex;flex-direction:column;gap:3px;">
            ${E('span',`stats.${i}.n`,'font-family:"Lora",serif;font-weight:600;font-size:24px;color:var(--accent);')}
            ${E('span',`stats.${i}.l`,'font:500 13px Manrope,sans-serif;color:#6B7163;max-width:130px;line-height:1.3;')}
          </div>`).join('')}
        </div>
      </div>
      <div style="position:relative;animation:ggFade 1s ease both;">
        <div style="border-radius:var(--radius);overflow:hidden;box-shadow:0 30px 70px rgba(30,45,30,.16);">
          ${IMG('hero.image','width:100%;height:clamp(360px,56vw,620px);object-fit:cover;background:#E6ECE3;','Фитодизайн интерьера GardenGo','eager')}
        </div>
        <div style="position:absolute;left:-8px;bottom:26px;background:#fff;border-radius:var(--radius);padding:18px 22px;box-shadow:0 16px 40px rgba(30,45,30,.16);max-width:260px;border:1px solid #EFE9DA;">
          ${E('div','hero.cardTitle','font:700 12px Manrope,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:6px;')}
          ${E('div','hero.cardText','font:400 14px/1.45 Manrope,sans-serif;color:#565C50;')}
        </div>
      </div>
    </div>
  </section>`;

  const marqueeHTML = () => `
  <section style="border-top:1px solid #E6DFCF;border-bottom:1px solid #E6DFCF;background:rgba(255,255,255,.4);">
    <div style="max-width:1320px;margin:0 auto;padding:22px clamp(20px,5vw,56px);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px 36px;">
      ${C.trust.map((t,i) => `<span style="font:500 14.5px Manrope,sans-serif;color:#5C6358;display:inline-flex;align-items:center;gap:10px;"><span style="color:var(--accent);font-size:16px;">✦</span>${E('span',`trust.${i}`,'')}</span>`).join('')}
    </div>
  </section>`;

  const servicesHTML = () => `
  <section id="services" style="max-width:1320px;margin:0 auto;padding:clamp(72px,9vw,124px) clamp(20px,5vw,56px);">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:48px;">
      <div style="max-width:620px;">
        ${E('div','servicesHead.kicker','font:600 12px Manrope,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;')}
        <h2 style="font-family:'Lora',serif;font-weight:500;font-size:clamp(30px,4vw,50px);line-height:1.08;letter-spacing:-.015em;color:#1B221B;">${E('span','servicesHead.title1','')}<br>${E('span','servicesHead.title2','')}</h2>
      </div>
      ${E('p','servicesHead.lead','font:400 16px/1.6 Manrope,sans-serif;color:#6B7163;max-width:320px;')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(290px,100%),1fr));gap:22px;">
      ${C.services.map((s,i) => `
        <div class="svc-card" style="background:#fff;border:1px solid #ECE5D6;border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;">
          <div style="position:relative;overflow:hidden;">
            ${IMG(`services.${i}.img`,'width:100%;height:208px;object-fit:cover;background:#E6ECE3;',s.title)}
            ${E('span',`services.${i}.tag`,'position:absolute;top:14px;left:14px;background:rgba(245,241,232,.92);backdrop-filter:blur(4px);padding:6px 13px;border-radius:100px;font:600 11px Manrope,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-deep);')}
          </div>
          <div style="padding:22px 22px 24px;display:flex;flex-direction:column;flex:1;">
            ${E('h3',`services.${i}.title`,'font-family:"Lora",serif;font-weight:500;font-size:21px;line-height:1.2;color:#1B221B;margin-bottom:10px;')}
            ${E('p',`services.${i}.desc`,'font:400 14.5px/1.55 Manrope,sans-serif;color:#6B7163;flex:1;')}
            <span style="margin-top:18px;font:600 14px Manrope,sans-serif;color:var(--accent);display:inline-flex;align-items:center;gap:7px;">Подробнее →</span>
          </div>
        </div>`).join('')}
    </div>
  </section>`;

  const wallsHTML = () => `
  <section id="walls" style="background:var(--accent-tint);border-top:1px solid #E6DFCF;border-bottom:1px solid #E6DFCF;">
    <div style="max-width:1320px;margin:0 auto;padding:clamp(72px,9vw,124px) clamp(20px,5vw,56px);">
      <div style="text-align:center;max-width:640px;margin:0 auto 52px;">
        ${E('div','wallsHead.kicker','font:600 12px Manrope,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;')}
        ${E('h2','wallsHead.title','font-family:"Lora",serif;font-weight:500;font-size:clamp(30px,4vw,50px);line-height:1.08;letter-spacing:-.015em;color:#1B221B;margin-bottom:16px;')}
        ${E('p','wallsHead.lead','font:400 16px/1.6 Manrope,sans-serif;color:#6B7163;')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:20px;">
        ${C.walls.map((w,i) => `
          <div class="wall-card" style="background:#fff;border:1px solid #E6DFCF;border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;">
            ${IMG(`walls.${i}.img`,'width:100%;height:188px;object-fit:cover;background:#E6ECE3;',w.name)}
            <div style="padding:22px 20px 24px;display:flex;flex-direction:column;flex:1;">
              <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:16px;">
                ${E('h3',`walls.${i}.name`,'font-family:"Lora",serif;font-weight:600;font-size:20px;color:#1B221B;')}
                ${E('span',`walls.${i}.count`,'font:600 12px Manrope,sans-serif;color:var(--accent);white-space:nowrap;')}
              </div>
              <div style="display:flex;flex-direction:column;gap:9px;flex:1;">
                ${w.points.map((pt,j) => `<div style="display:flex;align-items:flex-start;gap:9px;font:400 13.5px/1.4 Manrope,sans-serif;color:#5C6358;"><span style="color:var(--accent);margin-top:1px;flex:none;">—</span>${E('span',`walls.${i}.points.${j}`,'')}</div>`).join('')}
              </div>
              <a class="wall-cta" href="#contact" style="margin-top:20px;text-align:center;background:var(--accent-soft);color:var(--accent-deep);padding:12px;border-radius:100px;font:600 13.5px Manrope,sans-serif;text-decoration:none;">Открыть каталог</a>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>`;

  const productionHTML = () => `
  <section id="production" style="background:var(--accent-deep);color:#F2EEE3;">
    <div style="max-width:1320px;margin:0 auto;padding:clamp(72px,9vw,124px) clamp(20px,5vw,56px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr));gap:clamp(40px,5vw,72px);align-items:center;">
      <div style="position:relative;border-radius:var(--radius);overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.3);">
        ${IMG('production.image','width:100%;height:clamp(360px,42vw,480px);object-fit:cover;background:#2a3a2f;','Производство фитостен GardenGo')}
      </div>
      <div>
        ${E('div','production.kicker','font:600 12px Manrope,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#9DB9A4;margin-bottom:18px;')}
        <h2 style="font-family:'Lora',serif;font-weight:500;font-size:clamp(30px,4vw,48px);line-height:1.1;letter-spacing:-.015em;margin-bottom:22px;">${E('span','production.title1','')}<br>${E('span','production.title2','')}</h2>
        ${E('p','production.text','font:400 17px/1.62 Manrope,sans-serif;color:#C9D2C4;max-width:520px;margin-bottom:32px;')}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr));gap:18px;">
          ${C.production.facts.map((f,i) => `<div style="border-top:1px solid rgba(255,255,255,.16);padding-top:14px;">
            ${E('div',`production.facts.${i}.n`,'font-family:"Lora",serif;font-weight:600;font-size:26px;color:#fff;margin-bottom:4px;')}
            ${E('div',`production.facts.${i}.l`,'font:500 13.5px/1.4 Manrope,sans-serif;color:#A9B6A6;')}
          </div>`).join('')}
        </div>
      </div>
    </div>
  </section>`;

  const processHTML = () => `
  <section style="max-width:1320px;margin:0 auto;padding:clamp(72px,9vw,124px) clamp(20px,5vw,56px);">
    <div style="max-width:620px;margin-bottom:52px;">
      ${E('div','processHead.kicker','font:600 12px Manrope,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;')}
      ${E('h2','processHead.title','font-family:"Lora",serif;font-weight:500;font-size:clamp(30px,4vw,50px);line-height:1.08;letter-spacing:-.015em;color:#1B221B;')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr));gap:2px;background:#E6DFCF;border:1px solid #E6DFCF;border-radius:var(--radius);overflow:hidden;">
      ${C.steps.map((step,i) => `<div class="step-cell" style="background:#F8F5EC;padding:30px 24px;display:flex;flex-direction:column;gap:12px;min-height:200px;">
        ${E('span',`steps.${i}.n`,'font-family:"Lora",serif;font-weight:600;font-size:34px;color:var(--accent);opacity:.5;')}
        ${E('h3',`steps.${i}.t`,'font:700 16px Manrope,sans-serif;color:#1B221B;')}
        ${E('p',`steps.${i}.d`,'font:400 14px/1.5 Manrope,sans-serif;color:#6B7163;')}
      </div>`).join('')}
    </div>
  </section>`;

  const portfolioHTML = () => `
  <section id="portfolio" style="background:#1B221B;color:#F2EEE3;">
    <div style="max-width:1320px;margin:0 auto;padding:clamp(72px,9vw,124px) clamp(20px,5vw,56px);">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:44px;">
        <div>
          ${E('div','portfolioHead.kicker','font:600 12px Manrope,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#9DB9A4;margin-bottom:16px;')}
          ${E('h2','portfolioHead.title','font-family:"Lora",serif;font-weight:500;font-size:clamp(30px,4vw,50px);line-height:1.08;letter-spacing:-.015em;')}
        </div>
        <a class="ghost-btn ed" data-path="portfolioHead.cta" href="#contact" style="display:inline-flex;align-items:center;gap:9px;color:#F2EEE3;border:1px solid rgba(255,255,255,.3);padding:14px 26px;border-radius:100px;font:600 14px Manrope,sans-serif;text-decoration:none;">${esc(get('portfolioHead.cta'))}</a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:14px;">
        ${C.portfolio.map((ph,i) => `<div style="overflow:hidden;border-radius:var(--radius);aspect-ratio:${ph.ratio};">${IMG(`portfolio.${i}.src`,'width:100%;height:100%;object-fit:cover;background:#2a3a2f;','Проект GardenGo')}</div>`).join('')}
      </div>
    </div>
  </section>`;

  const shopHTML = () => !C.config.showShop ? '' : `
  <section id="shop" style="max-width:1320px;margin:0 auto;padding:clamp(72px,9vw,124px) clamp(20px,5vw,56px);">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:clamp(36px,4.5vw,64px);align-items:center;">
      <div>
        ${E('div','shop.kicker','font:600 12px Manrope,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;')}
        <h2 style="font-family:'Lora',serif;font-weight:500;font-size:clamp(30px,4vw,48px);line-height:1.1;letter-spacing:-.015em;color:#1B221B;margin-bottom:22px;">${E('span','shop.title1','')}<br>${E('span','shop.title2','')}</h2>
        ${E('p','shop.text','font:400 16.5px/1.62 Manrope,sans-serif;color:#565C50;max-width:480px;margin-bottom:30px;')}
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:34px;">
          ${C.shop.features.map((ft,i) => E('span',`shop.features.${i}`,'background:var(--accent-soft);color:var(--accent-deep);padding:9px 16px;border-radius:100px;font:600 13px Manrope,sans-serif;')).join('')}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <a class="btn-primary btn-primary-lg ed" data-path="shop.ctaMain" href="${esc(get('shop.shopUrl'))}" style="display:inline-flex;align-items:center;gap:9px;background:var(--accent);color:#fff;padding:15px 28px;border-radius:100px;font:600 15px Manrope,sans-serif;text-decoration:none;">${esc(get('shop.ctaMain'))}</a>
          <a class="shop-link" href="${esc(get('shop.linkOzon'))}" style="display:inline-flex;align-items:center;background:#fff;color:#1B221B;padding:15px 24px;border-radius:100px;font:600 14px Manrope,sans-serif;text-decoration:none;border:1px solid #E0D8C6;">Ozon</a>
          <a class="shop-link" href="${esc(get('shop.linkYandex'))}" style="display:inline-flex;align-items:center;background:#fff;color:#1B221B;padding:15px 24px;border-radius:100px;font:600 14px Manrope,sans-serif;text-decoration:none;border:1px solid #E0D8C6;">Яндекс Маркет</a>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div style="overflow:hidden;border-radius:var(--radius);aspect-ratio:3/4;">${IMG('shop.img1','width:100%;height:100%;object-fit:cover;background:#E6ECE3;')}</div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="overflow:hidden;border-radius:var(--radius);aspect-ratio:1/1;">${IMG('shop.img2','width:100%;height:100%;object-fit:cover;background:#E6ECE3;')}</div>
          <div style="overflow:hidden;border-radius:var(--radius);aspect-ratio:4/3;">${IMG('shop.img3','width:100%;height:100%;object-fit:cover;background:#E6ECE3;')}</div>
        </div>
      </div>
    </div>
  </section>`;

  const contactHTML = () => `
  <section id="contact" style="background:var(--accent-tint);border-top:1px solid #E6DFCF;">
    <div style="max-width:1320px;margin:0 auto;padding:clamp(72px,9vw,124px) clamp(20px,5vw,56px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:clamp(40px,5vw,72px);">
      <div>
        ${E('div','contact.kicker','font:600 12px Manrope,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;')}
        ${E('h2','contact.title','font-family:"Lora",serif;font-weight:500;font-size:clamp(30px,4vw,48px);line-height:1.1;letter-spacing:-.015em;color:#1B221B;margin-bottom:20px;')}
        ${E('p','contact.text','font:400 16.5px/1.62 Manrope,sans-serif;color:#565C50;max-width:440px;margin-bottom:32px;')}
        <div style="display:flex;flex-direction:column;gap:18px;">
          <a href="tel:${esc(C.tel)}" style="display:flex;align-items:center;gap:14px;text-decoration:none;color:#1B221B;">
            <span style="width:44px;height:44px;border-radius:50%;background:#fff;border:1px solid #E0D8C6;display:flex;align-items:center;justify-content:center;font-size:18px;flex:none;">☎</span>
            <span><span class="ed" data-path="phone" style="display:block;font:700 16px Manrope,sans-serif;">${esc(C.phone)}</span><span style="font:400 13px Manrope,sans-serif;color:#6B7163;">Звонок · WhatsApp · Telegram</span></span>
          </a>
          <div style="display:flex;align-items:center;gap:14px;color:#1B221B;">
            <span style="width:44px;height:44px;border-radius:50%;background:#fff;border:1px solid #E0D8C6;display:flex;align-items:center;justify-content:center;font-size:18px;flex:none;">⌖</span>
            <span>${E('span','contact.city','display:block;font:700 16px Manrope,sans-serif;')}${E('span','address','font:400 13px Manrope,sans-serif;color:#6B7163;')}</span>
          </div>
          <div style="display:flex;gap:10px;margin-top:6px;">
            <a class="msg-soft" href="${esc(C.whatsapp)}" style="flex:1;text-align:center;background:#fff;border:1px solid #E0D8C6;border-radius:100px;padding:13px;font:600 14px Manrope,sans-serif;color:#1B221B;text-decoration:none;">WhatsApp</a>
            <a class="msg-soft" href="${esc(C.telegram)}" style="flex:1;text-align:center;background:#fff;border:1px solid #E0D8C6;border-radius:100px;padding:13px;font:600 14px Manrope,sans-serif;color:#1B221B;text-decoration:none;">Telegram</a>
          </div>
        </div>
      </div>
      <div style="background:#fff;border:1px solid #E6DFCF;border-radius:var(--radius);padding:clamp(26px,3vw,38px);box-shadow:0 16px 40px rgba(30,45,30,.07);">
        <form id="lead-form" style="display:flex;flex-direction:column;gap:16px;">
          <label style="display:flex;flex-direction:column;gap:7px;font:600 13px Manrope,sans-serif;color:#3A4138;">Имя
            <input class="field" name="name" autocomplete="name" autocapitalize="words" placeholder="Как к вам обращаться" style="font:400 16px Manrope,sans-serif;padding:13px 16px;border:1px solid #E0D8C6;border-radius:10px;background:#FAF8F1;color:#1B221B;outline:none;">
          </label>
          <label style="display:flex;flex-direction:column;gap:7px;font:600 13px Manrope,sans-serif;color:#3A4138;">Телефон
            <input class="field" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="+7 ___ ___-__-__" style="font:400 16px Manrope,sans-serif;padding:13px 16px;border:1px solid #E0D8C6;border-radius:10px;background:#FAF8F1;color:#1B221B;outline:none;">
          </label>
          <label style="display:flex;flex-direction:column;gap:7px;font:600 13px Manrope,sans-serif;color:#3A4138;">Сообщение
            <textarea class="field" name="msg" placeholder="Помещение, размеры, пожелания" rows="3" style="font:400 16px Manrope,sans-serif;padding:13px 16px;border:1px solid #E0D8C6;border-radius:10px;background:#FAF8F1;color:#1B221B;outline:none;resize:vertical;"></textarea>
          </label>
          <button class="btn-primary" type="submit" style="background:var(--accent);color:#fff;border:none;padding:16px;border-radius:100px;font:600 15px Manrope,sans-serif;cursor:pointer;">Отправить заявку</button>
          <p style="font:400 12px/1.45 Manrope,sans-serif;text-align:center;color:#8A9081;">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</p>
        </form>
        <div id="lead-done" style="display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;min-height:280px;">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:30px;color:var(--accent);">✓</div>
          ${E('h3','contact.doneTitle','font-family:"Lora",serif;font-weight:500;font-size:26px;color:#1B221B;')}
          ${E('p','contact.doneText','font:400 15px/1.55 Manrope,sans-serif;color:#6B7163;max-width:280px;')}
        </div>
      </div>
    </div>
  </section>`;

  const bottomNavHTML = () => `
  <nav id="bottom-nav" class="mobile-only" style="position:fixed;left:0;right:0;bottom:0;z-index:70;background:rgba(245,241,232,0.95);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-top:1px solid #E6DFCF;align-items:stretch;box-shadow:0 -8px 24px rgba(30,45,30,.07);">
    ${bottomNavItems().map(b => `<a class="bnav-link" data-bnav="${b.id}" href="#${b.id}" style="position:relative;flex:1;display:flex;align-items:center;justify-content:center;padding:14px 2px;text-decoration:none;color:#6B7163;font:600 12px Manrope,sans-serif;text-align:center;"><span class="bar" style="position:absolute;top:0;left:20%;right:20%;height:3px;border-radius:0 0 3px 3px;background:var(--accent);"></span>${esc(b.label)}</a>`).join('')}
  </nav>
  <div class="mobile-only" style="height:calc(54px + env(safe-area-inset-bottom));"></div>`;

  const footerHTML = () => `
  <footer style="background:#151914;color:#C9CFC2;">
    <div style="max-width:1320px;margin:0 auto;padding:clamp(48px,6vw,72px) clamp(20px,5vw,56px) 36px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:36px;padding-bottom:40px;border-bottom:1px solid rgba(255,255,255,.1);">
        <div style="max-width:280px;">
          <div style="display:flex;align-items:baseline;gap:2px;margin-bottom:14px;">
            <span style="font-family:'Lora',serif;font-weight:600;font-size:24px;color:#fff;">${esc(C.brand)}</span>
            <span style="font-family:'Lora',serif;font-weight:600;font-size:24px;color:var(--accent);">.</span>
          </div>
          ${E('p','footer.about','font:400 14px/1.6 Manrope,sans-serif;color:#9AA194;')}
        </div>
        <div>
          <div style="font:700 12px Manrope,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7E8678;margin-bottom:16px;">Услуги</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <a class="ftr-link" href="#services" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">Фитостены с автополивом</a>
            <a class="ftr-link" href="#services" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">Стабилизированный мох</a>
            <a class="ftr-link" href="#services" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">Искусственное озеленение</a>
            <a class="ftr-link" href="#services" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">Зимний сад · Lounge</a>
          </div>
        </div>
        <div>
          <div style="font:700 12px Manrope,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7E8678;margin-bottom:16px;">Компания</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <a class="ftr-link" href="#production" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">Производство</a>
            <a class="ftr-link" href="#portfolio" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">Портфолио</a>
            ${C.config.showShop ? `<a class="ftr-link" href="#shop" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">Магазин</a>` : ''}
            <a class="ftr-link" href="#contact" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">Контакты</a>
          </div>
        </div>
        <div>
          <div style="font:700 12px Manrope,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7E8678;margin-bottom:16px;">Контакты</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <a class="ed" data-path="phone" href="tel:${esc(C.tel)}" style="font:600 15px Manrope,sans-serif;color:#fff;text-decoration:none;">${esc(C.phone)}</a>
            <a class="ftr-link ed" data-path="email" href="mailto:${esc(C.email)}" style="font:400 14px Manrope,sans-serif;color:#C9CFC2;text-decoration:none;">${esc(C.email)}</a>
            ${E('span','address','font:400 14px/1.5 Manrope,sans-serif;color:#9AA194;')}
          </div>
        </div>
      </div>
      <div style="padding-top:24px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;font:400 13px Manrope,sans-serif;color:#7E8678;">
        ${E('span','footer.copy','')}
        ${E('span','footer.geo','')}
      </div>
    </div>
  </footer>`;

  /* ===== mount + behaviour ===== */
  function applyTheme(){
    const p = PALETTES[C.config.accent] || PALETTES['Лес'];
    const r = C.config.corner === 'Острые' ? '2px' : '12px';
    const root = document.documentElement.style;
    root.setProperty('--accent', p.main);
    root.setProperty('--accent-deep', p.deep);
    root.setProperty('--accent-soft', p.soft);
    root.setProperty('--accent-tint', p.tint);
    root.setProperty('--radius', r);
  }

  function render(){
    applyTheme();
    document.getElementById('app').innerHTML =
      headerHTML() + drawerHTML() +
      `<main id="top">` + heroHTML() + marqueeHTML() + servicesHTML() + wallsHTML() +
      productionHTML() + processHTML() + portfolioHTML() + shopHTML() + contactHTML() +
      `</main>` + bottomNavHTML() + footerHTML();
    wire();
    if (ADMIN) enableEditing();
  }

  function wire(){
    const drawer = document.getElementById('drawer');
    const openMenu = () => { document.body.style.overflow='hidden'; drawer.style.display='block'; };
    const closeMenu = () => { document.body.style.overflow=''; drawer.style.display='none'; };
    const burger = document.getElementById('burger');
    if (burger) burger.addEventListener('click', openMenu);
    document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth >= 880) closeMenu(); }, { passive:true });

    const order = navSections().map(s => s.id);
    const labelMap = { top:'Главная' };
    navSections().forEach(s => labelMap[s.id] = s.label);
    const vis = {}; let active = 'top';
    const setActive = (id) => {
      if (id === active) return; active = id;
      document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('is-active', el.dataset.nav === id));
      document.querySelectorAll('[data-bnav]').forEach(el => el.classList.toggle('is-active', el.dataset.bnav === id));
      const lab = document.getElementById('active-label'); if (lab) lab.textContent = labelMap[id] || 'Главная';
    };
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { vis[e.target.id] = e.isIntersecting; });
        let cur = 'top'; for (const id of order){ if (vis[id]) cur = id; } setActive(cur);
      }, { rootMargin:'-78px 0px -72% 0px', threshold:0 });
      order.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    }

    const form = document.getElementById('lead-form');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (ADMIN){ return; }
      form.style.display='none';
      document.getElementById('lead-done').style.display='flex';
    });
  }

  /* ===== admin editing ===== */
  function enableEditing(){
    document.body.classList.add('gg-admin');
    // text
    document.querySelectorAll('.ed').forEach(el => {
      el.setAttribute('contenteditable','true');
      el.setAttribute('spellcheck','false');
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && el.tagName !== 'P' && el.tagName !== 'TEXTAREA'){ e.preventDefault(); el.blur(); }
      });
      el.addEventListener('click', (e) => { if (el.closest('a')) e.preventDefault(); }, true);
      el.addEventListener('blur', () => {
        const v = el.innerText.replace(/ /g,' ').trim();
        const path = el.dataset.path;
        if (v === String(get(path) ?? '')) return;
        set(path, v);
        document.querySelectorAll('.ed[data-path="' + CSS.escape(path) + '"]').forEach(o => { if (o !== el && o.innerText.trim() !== v) o.innerText = v; });
        if (path === 'phone'){
          const tel = '+' + v.replace(/[^\d]/g,'');
          set('tel', tel);
          document.querySelectorAll('a[href^="tel:"]').forEach(a => a.setAttribute('href', 'tel:' + tel));
        }
        if (path === 'email'){
          document.querySelectorAll('a[href^="mailto:"]').forEach(a => a.setAttribute('href', 'mailto:' + v));
        }
        GGAdmin._dirty();
      });
    });
    // links shouldn't navigate in edit mode
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', (e)=>{ if (ADMIN && !a.classList.contains('ed')) e.preventDefault(); }));
    // images
    document.querySelectorAll('.gimg').forEach(img => {
      const wrap = document.createElement('span');
      img.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); GGAdmin._pickImage(img.dataset.imgpath); });
    });
  }

  /* ===== public API ===== */
  window.GG = {
    async boot(opts){
      ADMIN = !!(opts && opts.admin);
      // load content: localStorage draft (admin) > content.json > nothing
      let base = null;
      try { const r = await fetch('content.json?ts=' + Date.now()); if (r.ok) base = await r.json(); } catch(_){}
      if (!base && window.GG_DEFAULT) base = window.GG_DEFAULT;
      const draft = ADMIN ? localStorage.getItem('gg_draft') : null;
      C = draft ? JSON.parse(draft) : (base || {});
      window.GG._published = base;
      render();
    },
    get content(){ return C; },
    set content(v){ C = v; render(); },
    rerender: render,
    _esc: esc,
  };
})();
