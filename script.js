const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/ARBGS99CXA';
const TG_LINK = 'https://t.me/tovarishhDima';
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const safe = fn => { try { fn(); } catch (e) { console.error(e); } };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const scrollToId = id => { const t = $(id); if (t) scrollTo({ top: t.getBoundingClientRect().top + scrollY - 60, behavior: reduce ? 'auto' : 'smooth' }); };

  // верхняя панель
  const bar = $('#bar');
  const fb = () => bar.classList.toggle('show', scrollY > 30);
  addEventListener('scroll', fb, { passive: true }); fb();

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const h = a.getAttribute('href'); if (h.length < 2) return;
    if (!$(h)) return;
    e.preventDefault(); scrollToId(h);
  }));

  // ===== звук (включается только по кнопке) =====
  const NOTES = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66];
  let actx = null, soundOn = false;
  const pluckSound = (i, detuneCents) => {
    if (!soundOn || !actx) return;
    try {
      const t = actx.currentTime, f = NOTES[i] * Math.pow(2, detuneCents / 1200);
      const g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      const o1 = actx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
      const o2 = actx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
      const g2 = actx.createGain(); g2.gain.value = 0.25;
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(actx.destination);
      o1.start(t); o2.start(t); o1.stop(t + 2.3); o2.stop(t + 2.3);
    } catch (e) { console.error(e); }
  };
  const soundBtn = $('#soundBtn');
  soundBtn && soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn && !actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { soundOn = false; } }
    if (actx && actx.state === 'suspended') actx.resume();
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.textContent = soundOn ? 'Звук: вкл' : 'Звук: выкл';
  });

  // ===== гусли: 11 струн, расстроены -> настроены =====
  const N = 11, W = 600, H = 420, X0 = 126, DX = 34.8, YB = 352;
  const yTop = x => 82 + (x - 100) * 0.2;
  const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  const strs = Array.from({ length: N }, (_, i) => ({
    x: X0 + DX * i,
    sag: (rnd() * 2 - 1) * 20 + (i % 2 ? 7 : -7),
    ph: rnd() * 6.28, fr: 1.2 + rnd() * 2.4, am: 1.6 + rnd() * 2.4,
    cents: (rnd() * 2 - 1) * 95,
    pl: { a: 0, t: 0 }
  }));
  const C0 = [169, 79, 40], C1 = [46, 107, 98];

  function Inst(host) {
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true', focusable: 'false' });
    // корпус
    svg.appendChild(svgEl('path', { d: 'M84 366 L84 68 Q84 58 96 60 L512 142 Q522 144 522 156 L522 366 Q522 376 512 376 L94 376 Q84 376 84 366 Z', fill: '#EBDCC3', stroke: '#9B5A34', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    svg.appendChild(svgEl('path', { d: 'M92 346 L514 346 L514 368 Q514 370 512 370 L94 370 Q92 370 92 368 Z', fill: '#DCC7A4' }));
    // колки
    strs.forEach(s => svg.appendChild(svgEl('circle', { cx: s.x, cy: yTop(s.x) - 8, r: 5, fill: '#9B5A34' })));
    // подставка
    svg.appendChild(svgEl('line', { x1: 100, y1: YB, x2: 506, y2: YB, stroke: '#9B5A34', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    const paths = strs.map(() => { const p = svgEl('path', { fill: 'none', 'stroke-linecap': 'round' }); svg.appendChild(p); return p; });
    host.appendChild(svg);
    const inst = { svg, paths, e: 0, target: 0, vis: true, lastX: null, speed: 3 };
    new IntersectionObserver(en => { inst.vis = en[0].isIntersecting; }, { rootMargin: '60px' }).observe(host);

    const toSvgX = ev => { const r = svg.getBoundingClientRect(); const k = Math.min(r.width / W, r.height / H); return (ev.clientX - r.left - (r.width - W * k) / 2) / k; };
    const hit = (x0, x1, amp) => {
      const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
      strs.forEach((s, i) => {
        if (s.x >= lo - 1 && s.x <= hi + 1) {
          s.pl.a = Math.min(26, amp); s.pl.t = performance.now() / 1000;
          pluckSound(i, s.cents * (1 - smooth(clamp(inst.e))));
        }
      });
    };
    host.addEventListener('pointermove', ev => {
      const x = toSvgX(ev);
      if (inst.lastX !== null && Math.abs(x - inst.lastX) > 0.5) hit(inst.lastX, x, 8 + Math.min(14, Math.abs(ev.movementX || 8) * 0.6));
      inst.lastX = x;
    });
    host.addEventListener('pointerleave', () => { inst.lastX = null; });
    host.addEventListener('pointerdown', ev => { const x = toSvgX(ev); hit(x - 12, x + 12, 16); inst.lastX = x; });
    return inst;
  }

  const insts = [];
  const draw = (inst, now) => {
    const e = smooth(clamp(inst.e)), t = now / 1000;
    strs.forEach((s, i) => {
      const yt = yTop(s.x);
      const idle = reduce ? 0 : Math.sin(t * s.fr * 6.28 + s.ph) * s.am * (1 - e * 0.94);
      const dt = t - s.pl.t;
      const pl = s.pl.a * Math.exp(-dt * 1.6) * Math.cos(dt * 52);
      const off = s.sag * (1 - e) + idle + pl;
      const my = (yt + YB) / 2 + (1 - e) * (i % 3 - 1) * 10;
      const cx = s.x + off * 2, cy = my;
      const p = inst.paths[i];
      p.setAttribute('d', 'M' + s.x.toFixed(1) + ' ' + yt.toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + s.x.toFixed(1) + ' ' + YB);
      p.setAttribute('stroke', 'rgb(' + C0.map((c, k) => Math.round(c + (C1[k] - c) * e)).join(',') + ')');
      p.setAttribute('stroke-width', (1.5 + 0.9 * e).toFixed(2));
    });
  };
  let lastT = performance.now();
  const loop = now => {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    insts.forEach(inst => {
      if (!inst.vis) return;
      if (inst.mode === 'tween' && inst.e !== inst.target) {
        const r = inst.speed * dt;
        inst.e = Math.abs(inst.target - inst.e) <= r ? inst.target : inst.e + Math.sign(inst.target - inst.e) * r;
      } else if (inst.mode === 'follow') {
        inst.e += (inst.target - inst.e) * Math.min(1, dt * 6);
      }
      draw(inst, now);
      if (inst.onFrame) inst.onFrame(inst);
    });
    requestAnimationFrame(loop);
  };

  // hero
  safe(() => {
    const host = $('#heroStage'), btn = $('#heroTune'), st = $('#heroState');
    if (!host) return;
    const inst = Inst(host); inst.mode = 'tween'; inst.speed = 0.42; inst.e = 0; inst.target = 0;
    insts.push(inst);
    const label = () => {
      const tuned = inst.target === 1;
      btn.textContent = tuned ? 'Расстроить' : 'Настроить';
      st.textContent = 'Строй: ' + (tuned ? 'настроен' : 'расстроен');
      st.classList.toggle('ok', tuned);
    };
    inst.onFrame = i => { if (i.e > 0.98 && i.target === 1) st.textContent = 'Строй: настроен'; };
    btn.addEventListener('click', () => {
      inst.target = inst.target === 1 ? 0 : 1;
      if (reduce) { inst.e = inst.target; draw(inst, 0); }
      label();
    });
    label();
    if (reduce) { draw(inst, 0); }
  });

  // сцена со скроллом
  safe(() => {
    const host = $('#sceneStage'), sec = $('#how'); if (!host || !sec) return;
    const inst = Inst(host); inst.mode = 'follow'; inst.e = 0; inst.target = 0;
    insts.push(inst);
    const steps = $$('.step', sec), dots = $$('#stepDots i'), st = $('#sceneState');
    let cur = -1;
    const calc = () => {
      const r = sec.getBoundingClientRect(), total = r.height - innerHeight;
      const p = total > 0 ? clamp(-r.top / total) : 1;
      inst.target = reduce ? 1 : smooth(clamp((p - 0.06) / 0.82));
      const idx = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
      if (idx !== cur) {
        cur = idx;
        steps.forEach((s, i) => s.classList.toggle('is-on', i === idx));
        dots.forEach((d, i) => d.classList.toggle('on', i === idx));
      }
      st.textContent = 'Строй: ' + (inst.target > 0.9 ? 'настроен' : inst.target > 0.35 ? 'настраивается' : 'расстроен');
      st.classList.toggle('ok', inst.target > 0.9);
    };
    addEventListener('scroll', calc, { passive: true }); addEventListener('resize', calc); calc();
    if (reduce) { inst.e = 1; draw(inst, 0); }
  });

  if (!reduce) requestAnimationFrame(loop);

  // ===== подбор формата =====
  safe(() => {
    const chips = $$('#fit .chip'), list = $('#plist'), items = $$('#plist li'), svc = $('#svc');
    chips.forEach(c => c.addEventListener('click', () => {
      const on = c.getAttribute('aria-pressed') !== 'true';
      chips.forEach(x => x.setAttribute('aria-pressed', 'false'));
      c.setAttribute('aria-pressed', String(on));
      list.classList.toggle('has-fit', on);
      items.forEach(li => li.classList.toggle('is-fit', on && li.dataset.fit === c.dataset.fit));
    }));
    $$('[data-pick]').forEach(b => b.addEventListener('click', () => {
      const li = b.closest('li'); if (svc && li) svc.value = li.dataset.svc;
      scrollToId('#form');
    }));
  });

  // ===== форма =====
  const form = $('#leadForm');
  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]'), orig = btn.textContent, msg = $('#msg');
    const payload = {}; new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    msg.textContent = '';
    if (!payload.name.trim() || !payload.contact.trim()) { msg.textContent = 'Укажите имя и телефон или Telegram.'; return; }
    if (!form.consent.checked) { msg.textContent = 'Отметьте согласие на обработку персональных данных.'; return; }
    payload.phone = payload.contact;
    payload.comment = 'Формат: ' + payload.service + (payload.comment ? '. ' + payload.comment : '');
    delete payload.consent;
    const tgText = 'Заявка с сайта. Имя: ' + payload.name + '. Контакт: ' + payload.contact + '. ' + payload.comment;
    const tgLink = TG_LINK + '?text=' + encodeURIComponent(tgText);
    btn.disabled = true; btn.textContent = 'Отправляем...';
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      msg.textContent = 'Заявка отправлена. Скоро свяжусь с вами.'; form.reset();
    } catch (err) {
      console.error(err);
      msg.textContent = 'Заявка не ушла автоматически. Отправьте её одним касанием в Telegram: ';
      const a = document.createElement('a'); a.href = tgLink; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'отправить в Telegram';
      msg.append(a, '. Текст уже готов, останется нажать «Отправить».');
    } finally {
      clearTimeout(timer); btn.disabled = false; btn.textContent = orig;
    }
  });
})();
