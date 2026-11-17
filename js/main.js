/* =====================================================================
   VR FAST FOOD — interface
   Menu façon écran de sélection, « Ma commande », infos pratiques,
   apparitions au défilement. Le contenu vient de js/data.js.
   ===================================================================== */
(function () {
  'use strict';

  const DATA = window.VR_DATA || {};
  const SITE = DATA.site || {};
  const CATS = (DATA.categories || []).filter((c) => c && Array.isArray(c.plats) && c.plats.length);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICONS = { burger: 'i-burger', menu: 'i-menu', frites: 'i-frites', boisson: 'i-boisson', dessert: 'i-dessert', star: 'i-star' };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Petits outils ---------- */
  function el(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else node.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const kid of kids.flat()) {
      if (kid != null && kid !== false) node.append(kid);
    }
    return node;
  }

  function icon(id, cls) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', cls || 'ico');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + id);
    svg.append(use);
    return svg;
  }

  const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const prix = (n) => euro.format(Number(n) || 0);
  const pluriel = (n, un, plusieurs) => n + ' ' + (n > 1 ? plusieurs : un);
  const pictoDe = (plat) => ICONS[plat.cat.icone] || 'i-burger';

  /* ---------- Index des plats et « niveaux » ---------- */
  const PLATS = new Map();
  CATS.forEach((cat) => cat.plats.forEach((p) => PLATS.set(p.id, Object.assign({}, p, { cat }))));
  const TOUS = Array.from(PLATS.values());
  const POPULAIRES = TOUS.filter((p) => p.populaire);

  const VIEWS = [];
  if (POPULAIRES.length) VIEWS.push({ id: 'populaires', nom: 'Populaires', icone: 'star', tag: 'Top', plats: POPULAIRES });
  CATS.forEach((c, i) => VIEWS.push({ id: c.id, nom: c.nom, icone: c.icone, tag: 'Niveau ' + (i + 1), plats: c.plats.map((p) => PLATS.get(p.id)) }));

  /* ---------- Commande (conservée dans le navigateur) ---------- */
  const KEY = 'vrff-commande';
  const cart = {
    items: new Map(),
    listeners: [],
    load() {
      try {
        const raw = JSON.parse(window.localStorage.getItem(KEY) || '{}');
        Object.entries(raw).forEach(([id, q]) => {
          q = Math.floor(Number(q));
          if (PLATS.has(id) && q > 0) this.items.set(id, Math.min(q, 99));
        });
      } catch (e) { /* stockage indisponible : la commande reste en mémoire */ }
    },
    save() {
      try { window.localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(this.items))); } catch (e) { /* idem */ }
    },
    qty(id) { return this.items.get(id) || 0; },
    set(id, q) {
      q = Math.max(0, Math.min(99, q));
      if (q) this.items.set(id, q); else this.items.delete(id);
      this.save();
      this.listeners.forEach((fn) => fn(id));
    },
    add(id, d) { this.set(id, this.qty(id) + d); },
    clear() {
      this.items.clear();
      this.save();
      this.listeners.forEach((fn) => fn(null));
    },
    count() { let n = 0; this.items.forEach((q) => { n += q; }); return n; },
    total() { let s = 0; this.items.forEach((q, id) => { s += q * (Number(PLATS.get(id).prix) || 0); }); return s; }
  };
  cart.load();

  /* ---------- Cartes du menu ---------- */

  // Emplacement photo : <img> si le plat a une photo, sinon pictogramme de la catégorie.
  function photoSlot(plat) {
    const box = el('div', { class: 'card__media', 'data-photo-slot': plat.id });
    const placeholder = () => {
      box.prepend(icon(pictoDe(plat), 'card__picto'));
      box.append(el('span', { class: 'card__note', text: 'Photo à venir' }));
    };
    if (plat.photo) {
      const img = el('img', { src: plat.photo, alt: '', loading: 'lazy', decoding: 'async', width: 800, height: 600 });
      img.addEventListener('error', () => { img.remove(); placeholder(); });
      box.append(img);
    } else {
      placeholder();
    }
    return box;
  }

  function stepper(plat, q, compact) {
    return el('div', { class: 'stepper' + (compact ? ' stepper--sm' : ''), role: 'group', 'aria-label': 'Quantité : ' + plat.nom },
      el('button', { type: 'button', 'data-dec': plat.id, 'aria-label': (q > 1 ? 'Retirer un : ' : 'Retirer de la commande : ') + plat.nom },
        icon(q > 1 ? 'u-minus' : 'u-trash')),
      el('output', { text: String(q) }),
      el('button', { type: 'button', 'data-inc': plat.id, 'aria-label': 'Ajouter un : ' + plat.nom }, icon('u-plus'))
    );
  }

  function focusKind(node) {
    if (!node || !node.hasAttribute) return null;
    if (node.hasAttribute('data-inc')) return 'inc';
    if (node.hasAttribute('data-dec')) return 'dec';
    if (node.hasAttribute('data-add')) return 'add';
    return null;
  }

  function renderAction(holder, plat) {
    const q = cart.qty(plat.id);
    const kind = holder.contains(document.activeElement) ? focusKind(document.activeElement) : null;
    holder.replaceChildren(q
      ? stepper(plat, q)
      : el('button', { class: 'btn btn--primary btn--sm', type: 'button', 'data-add': plat.id, 'aria-label': 'Ajouter à la commande : ' + plat.nom },
          icon('u-plus'), 'Ajouter'));
    if (kind) {
      const target = q ? $(kind === 'dec' ? '[data-dec]' : '[data-inc]', holder) : $('[data-add]', holder);
      if (target) target.focus({ preventScroll: true });
    }
  }

  function card(plat, i) {
    const action = el('div', { class: 'card__action' });
    const media = photoSlot(plat);
    media.append(el('span', { class: 'card__num', 'aria-hidden': 'true', text: '#' + String(i + 1).padStart(2, '0') }));
    const node = el('article', { class: 'card', style: '--i:' + i, 'data-plat': plat.id },
      plat.populaire && el('span', { class: 'badge-pop' }, icon('i-star'), 'Populaire'),
      media,
      el('div', { class: 'card__body' },
        el('h3', { class: 'card__name', text: plat.nom }),
        plat.description && el('p', { class: 'card__desc', text: plat.description }),
        el('div', { class: 'card__foot' },
          el('p', { class: 'price', text: prix(plat.prix) }),
          action))
    );
    renderAction(action, plat);
    return node;
  }

  /* ---------- Onglets « niveaux » ---------- */
  const tabsEl = $('#menuTabs');
  const panel = $('#menuPanel');
  const dotsEl = $('#levelDots');
  let current = 0;
  let swapTimer = 0;

  function revealTab(btn, animate) {
    if (tabsEl.scrollWidth <= tabsEl.clientWidth + 1) return;
    const left = btn.offsetLeft - (tabsEl.clientWidth - btn.offsetWidth) / 2;
    tabsEl.scrollTo({ left: Math.max(0, left), behavior: animate && !reduce ? 'smooth' : 'auto' });
  }

  function fillPanel(view) {
    panel.replaceChildren(...view.plats.map(card));
    panel.setAttribute('aria-labelledby', 'tab-' + view.id);
  }

  function select(i, opts) {
    opts = opts || {};
    if (!VIEWS.length) return;
    i = (i + VIEWS.length) % VIEWS.length;
    const view = VIEWS[i];
    current = i;

    $$('.level', tabsEl).forEach((btn, j) => {
      const on = j === i;
      btn.setAttribute('aria-selected', String(on));
      btn.tabIndex = on ? 0 : -1;
      if (on) {
        if (opts.focus) btn.focus({ preventScroll: true });
        revealTab(btn, !opts.instant);
      }
    });
    $$('.dot', dotsEl).forEach((d, j) => d.classList.toggle('is-on', j === i));
    $('#levelTag').textContent = view.tag;
    $('#levelName').textContent = view.nom;
    $('#levelCount').textContent = pluriel(view.plats.length, 'plat', 'plats');

    window.clearTimeout(swapTimer);
    if (opts.instant || reduce) {
      panel.classList.remove('is-leaving');
      fillPanel(view);
      return;
    }
    // transition douce : les cartes sortent, puis les nouvelles arrivent une à une
    panel.style.minHeight = panel.offsetHeight + 'px';
    panel.classList.add('is-leaving');
    swapTimer = window.setTimeout(() => {
      fillPanel(view);
      panel.classList.remove('is-leaving');
      window.setTimeout(() => { panel.style.minHeight = ''; }, 500);
    }, 170);
  }

  function initMenu() {
    if (!VIEWS.length) {
      panel.replaceChildren(el('p', { class: 'notice', text: 'Le menu arrive bientôt.' }));
      $('.level-bar').hidden = true;
      return;
    }
    VIEWS.forEach((v, i) => {
      tabsEl.append(el('button', { class: 'level', type: 'button', role: 'tab', id: 'tab-' + v.id, 'aria-selected': 'false', 'aria-controls': 'menuPanel', tabindex: '-1', 'data-view': i },
        el('span', { class: 'level__icon', 'aria-hidden': 'true' }, icon(ICONS[v.icone] || 'i-burger')),
        el('span', { class: 'level__meta' },
          el('span', { class: 'level__tag', text: v.tag }),
          el('span', { class: 'level__name', text: v.nom }))
      ));
      dotsEl.append(el('span', { class: 'dot' }));
    });

    tabsEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.level');
      if (btn) select(Number(btn.getAttribute('data-view')));
    });
    tabsEl.addEventListener('keydown', (ev) => {
      const moves = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: VIEWS.length - 1 };
      if (!(ev.key in moves)) return;
      ev.preventDefault();
      select(moves[ev.key], { focus: true });
    });
    $('[data-level-prev]').addEventListener('click', () => select(current - 1));
    $('[data-level-next]').addEventListener('click', () => select(current + 1));

    select(0, { instant: true });
  }

  /* ---------- Inclinaison 3D des cartes au survol (souris uniquement) ---------- */
  function initTilt() {
    if (!finePointer || reduce) return;
    let active = null;
    let raf = 0;
    let px = 0;
    let py = 0;

    function reset(node) {
      if (!node) return;
      node.classList.remove('is-tilting');
      node.style.removeProperty('--rx');
      node.style.removeProperty('--ry');
    }
    function apply() {
      raf = 0;
      if (!active) return;
      const r = active.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (px - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (py - r.top) / r.height));
      active.classList.add('is-tilting');
      active.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg');
      active.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
      active.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      active.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    }
    panel.addEventListener('pointermove', (ev) => {
      const node = ev.target.closest('.card');
      if (node !== active) { reset(active); active = node; }
      if (!node) return;
      px = ev.clientX;
      py = ev.clientY;
      if (!raf) raf = window.requestAnimationFrame(apply);
    });
    panel.addEventListener('pointerleave', () => { reset(active); active = null; });
  }

  /* ---------- Ma commande ---------- */
  const dialog = $('#cart');
  const cartBody = $('#cartBody');
  const cartFoot = $('#cartFoot');
  const live = $('#live');

  function orderMessage() {
    const lines = ['Bonjour, je souhaite passer commande :'];
    cart.items.forEach((q, id) => {
      const p = PLATS.get(id);
      lines.push('• ' + q + ' × ' + p.nom + ' (' + prix(q * p.prix) + ')');
    });
    lines.push('', 'Total : ' + prix(cart.total()));
    return lines.join('\n');
  }

  function renderCart() {
    const kind = cartBody.contains(document.activeElement) ? focusKind(document.activeElement) : null;
    const focusedId = kind ? document.activeElement.getAttribute('data-' + kind) : null;

    if (!cart.items.size) {
      cartBody.replaceChildren(el('div', { class: 'cart-empty' },
        icon('i-burger'),
        el('h3', { text: 'Votre commande est vide' }),
        el('p', { text: 'Ajoutez des plats depuis le menu : ils apparaîtront ici.' }),
        el('button', { class: 'btn btn--primary', type: 'button', 'data-goto-menu': true }, 'Voir le menu', icon('u-arrow'))));
      cartFoot.replaceChildren();
      if (kind) { const b = $('[data-goto-menu]', cartBody); if (b) b.focus(); }
      return;
    }

    const rows = [];
    cart.items.forEach((q, id) => {
      const p = PLATS.get(id);
      const thumb = el('div', { class: 'cart-item__thumb' });
      if (p.photo) {
        const img = el('img', { src: p.photo, alt: '', loading: 'lazy', width: 52, height: 52 });
        img.addEventListener('error', () => { img.replaceWith(icon(pictoDe(p))); });
        thumb.append(img);
      } else {
        thumb.append(icon(pictoDe(p)));
      }
      rows.push(el('li', { class: 'cart-item' },
        thumb,
        el('div', null,
          el('p', { class: 'cart-item__name', text: p.nom }),
          el('p', { class: 'cart-item__unit', text: prix(p.prix) + ' l’unité' })),
        el('div', { class: 'cart-item__side' },
          el('span', { class: 'cart-item__total', text: prix(q * p.prix) }),
          stepper(p, q, true))));
    });
    cartBody.replaceChildren(el('ul', { class: 'cart-list' }, rows));

    const cfg = SITE.commande || {};
    const wa = String(cfg.whatsapp || '').replace(/\D/g, '');
    const tel = String(cfg.telephone || '').trim();
    const actions = el('div', { class: 'cart-actions' });
    if (wa) {
      actions.append(el('a', { class: 'btn btn--primary btn--lg btn--block', href: 'https://wa.me/' + wa + '?text=' + encodeURIComponent(orderMessage()), target: '_blank', rel: 'noopener' },
        icon('u-chat'), 'Envoyer sur WhatsApp'));
    }
    if (tel) {
      actions.append(el('a', { class: 'btn btn--block' + (wa ? '' : ' btn--primary btn--lg'), href: 'tel:' + tel.replace(/[^\d+]/g, '') },
        icon('u-phone'), 'Appeler le ' + tel));
    }
    if (!wa && !tel) {
      actions.append(el('p', { class: 'notice', text: 'L’envoi de la commande n’est pas encore activé : le numéro du restaurant reste à renseigner.' }));
    }

    cartFoot.replaceChildren(
      el('p', { class: 'cart-total' }, el('span', { text: 'Total' }), el('strong', { text: prix(cart.total()) })),
      actions,
      el('p', { class: 'cart-note', text: 'Aucun paiement sur ce site.' }),
      el('div', { class: 'cart-foot-row' }, el('button', { class: 'text-btn', type: 'button', 'data-clear-cart': true }, icon('u-trash'), 'Vider la commande'))
    );

    if (kind) {
      const sel = focusedId ? '[data-' + kind + '="' + window.CSS.escape(focusedId) + '"]' : null;
      const target = (sel && $(sel, cartBody)) || $('[data-inc]', cartBody) || $('[data-close-cart]', dialog);
      if (target) target.focus({ preventScroll: true });
    }
  }

  function openCart() {
    renderCart();
    if (dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeCart() {
    if (!dialog.open) return;
    const done = () => {
      dialog.classList.remove('is-closing');
      if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    };
    if (reduce) { done(); return; }
    dialog.classList.add('is-closing');
    window.setTimeout(done, 210);
  }

  function updateBadges(bump) {
    const n = cart.count();
    $$('[data-cart-count]').forEach((node) => { node.textContent = String(n); });
    $$('[data-cart-count-text]').forEach((node) => { node.textContent = pluriel(n, 'article', 'articles'); });
    $$('[data-cart-summary]').forEach((node) => { node.textContent = n + ' · ' + prix(cart.total()); });
    const bar = $('.cart-bar');
    if (bar) bar.hidden = n === 0;
    document.body.classList.toggle('has-cart-bar', n > 0);
    if (bump && !reduce) {
      const btn = $('.cart-btn');
      btn.classList.remove('is-bump');
      void btn.offsetWidth;
      btn.classList.add('is-bump');
    }
  }

  function popPlusOne(id) {
    if (reduce) return;
    const foot = $('[data-plat="' + window.CSS.escape(id) + '"] .card__foot', panel);
    if (!foot) return;
    const pop = el('span', { class: 'pop', 'aria-hidden': 'true', text: '+1' });
    pop.addEventListener('animationend', () => pop.remove());
    foot.append(pop);
  }

  function initCart() {
    cart.listeners.push((id) => {
      updateBadges(true);
      $$('[data-plat]', panel).forEach((node) => {
        const pid = node.getAttribute('data-plat');
        if (id == null || pid === id) renderAction($('.card__action', node), PLATS.get(pid));
      });
      if (dialog.open) renderCart();
    });

    document.addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-add],[data-inc],[data-dec],[data-open-cart],[data-close-cart],[data-clear-cart],[data-goto-menu]');
      if (!t) return;
      if (t.hasAttribute('data-add') || t.hasAttribute('data-inc')) {
        const id = t.getAttribute('data-add') || t.getAttribute('data-inc');
        const inMenu = panel.contains(t);
        cart.add(id, 1);
        if (inMenu) popPlusOne(id);
        live.textContent = PLATS.get(id).nom + ' ajouté à la commande. ' + pluriel(cart.count(), 'article', 'articles') + ' au total.';
      } else if (t.hasAttribute('data-dec')) {
        const id = t.getAttribute('data-dec');
        cart.add(id, -1);
        live.textContent = PLATS.get(id).nom + ' retiré. ' + pluriel(cart.count(), 'article', 'articles') + ' au total.';
      } else if (t.hasAttribute('data-open-cart')) {
        openCart();
      } else if (t.hasAttribute('data-close-cart')) {
        closeCart();
      } else if (t.hasAttribute('data-clear-cart')) {
        cart.clear();
        live.textContent = 'Commande vidée.';
      } else if (t.hasAttribute('data-goto-menu')) {
        closeCart();
        const menu = $('#menu');
        if (menu) window.setTimeout(() => menu.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), reduce ? 0 : 230);
      }
    });

    dialog.addEventListener('cancel', (ev) => { ev.preventDefault(); closeCart(); });
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) closeCart(); });

    updateBadges(false);
  }

  /* ---------- Accueil : chiffres du menu et bandeau ---------- */
  function initHero() {
    const stats = $('#heroStats');
    if (stats && TOUS.length) {
      const rows = [
        ['i-frites', CATS.length, CATS.length > 1 ? 'catégories' : 'catégorie'],
        ['i-burger', TOUS.length, TOUS.length > 1 ? 'plats' : 'plat']
      ];
      if (POPULAIRES.length) rows.push(['i-star', POPULAIRES.length, POPULAIRES.length > 1 ? 'populaires' : 'populaire']);
      rows.forEach(([ic, n, label]) => stats.append(el('li', null, icon(ic), el('b', { text: String(n) }), label)));
    }

    const ticker = $('#ticker');
    if (ticker && !CATS.length) ticker.closest('.ticker').hidden = true;
    if (ticker && CATS.length) {
      const names = [];
      while (names.length < 12) CATS.forEach((c) => names.push(c.nom));
      const group = () => el('div', { class: 'ticker__group' }, names.map((n) => el('span', { class: 'ticker__item' }, n, icon('px-star', 'px'))));
      ticker.append(group(), group());
    }
  }

  /* ---------- Infos pratiques ---------- */
  function initInfos() {
    const todo = (label) => el('span', { class: 'todo', text: label || 'À compléter' });

    const hours = $('#hoursList');
    const horaires = Array.isArray(SITE.horaires) ? SITE.horaires : [];
    if (hours) {
      const today = horaires.length === 7 ? (new Date().getDay() + 6) % 7 : -1;
      horaires.forEach((h, i) => {
        hours.append(el('div', { class: 'hours__row' + (i === today ? ' is-today' : '') },
          el('dt', { text: h.jour }),
          el('dd', null, h.heures ? h.heures : todo())));
      });
      if (!horaires.length) hours.append(todo('Horaires à compléter'));
    }

    const contact = SITE.contact || {};
    const place = $('#placeBox');
    if (place) {
      if (contact.adresse) {
        const lien = contact.lienCarte || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(contact.adresse.replace(/\n/g, ', '));
        place.append(
          el('address', { text: contact.adresse }),
          el('p', null, el('a', { class: 'btn btn--mint btn--sm', href: lien, target: '_blank', rel: 'noopener' }, icon('u-pin'), 'Voir l’itinéraire')));
      } else {
        place.append(
          el('p', { class: 'info-label', text: 'Adresse du restaurant' }),
          el('p', null, todo()),
          el('p', { class: 'info-label', text: 'Itinéraire' }),
          el('p', null, todo('Lien de carte à ajouter')));
      }
    }

    const box = $('#contactBox');
    if (box) {
      const list = el('div', { class: 'contact-list' });
      list.append(contact.telephone
        ? el('a', { href: 'tel:' + String(contact.telephone).replace(/[^\d+]/g, '') }, icon('u-phone'), contact.telephone)
        : el('div', { class: 'contact-row' }, icon('u-phone'), 'Téléphone', todo()));
      list.append(contact.email
        ? el('a', { href: 'mailto:' + contact.email }, icon('u-mail'), contact.email)
        : el('div', { class: 'contact-row' }, icon('u-mail'), 'E-mail', todo()));
      box.append(list);

      const noms = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', snapchat: 'Snapchat' };
      const reseaux = Object.entries(SITE.reseaux || {}).filter(([, url]) => url);
      box.append(el('p', { class: 'info-label', text: 'Réseaux sociaux' }));
      box.append(reseaux.length
        ? el('div', { class: 'socials' }, reseaux.map(([k, url]) => el('a', { href: url, target: '_blank', rel: 'noopener' }, noms[k] || k)))
        : el('p', null, todo()));
    }
  }

  /* ---------- Navigation mobile ---------- */
  function initNav() {
    const toggle = $('.nav-toggle');
    const nav = $('#nav');
    if (!toggle || !nav) return;
    const set = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer la navigation' : 'Ouvrir la navigation');
    };
    toggle.addEventListener('click', () => set(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (ev) => { if (ev.target.closest('a')) set(false); });
    document.addEventListener('click', (ev) => { if (!ev.target.closest('.site-header__bar')) set(false); });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') set(false); });
  }

  /* ---------- Apparitions au défilement ---------- */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((n) => n.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    items.forEach((n) => io.observe(n));
  }

  /* ---------- Démarrage ---------- */
  $$('[data-year]').forEach((n) => { n.textContent = String(new Date().getFullYear()); });
  initNav();
  initHero();
  initMenu();
  initTilt();
  initCart();
  initInfos();
  initReveal();
})();
