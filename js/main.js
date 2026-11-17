/* Restaurant UI. Published data only; a selection never confirms an order. */
(() => {
  'use strict';
  const data = window.VR_DATA || {}, site = data.site || {};
  const cats = (data.categories || []).filter(c => c && Array.isArray(c.plats));
  const dishes = new Map();
  cats.forEach(c => c.plats.filter(p => p.publie === true && p.id && p.nom).forEach(p => dishes.set(p.id, p)));
  const canAdd = p => !!p && p.publie === true && p.disponible !== false && typeof p.prix === 'number' && Number.isFinite(p.prix) && p.prix > 0;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = n => new Intl.NumberFormat('fr-FR', {style:'currency',currency:'EUR'}).format(n);
  const phone = v => { const n = String(v || '').replace(/[\s().-]/g,''); return /^\+?\d{8,15}$/.test(n) ? n : ''; };
  const safeURL = v => { if(typeof v !== 'string' || !v.trim()) return ''; try { const u = new URL(v, location.href); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const el = (tag, attrs = {}, ...children) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => { if(v === false || v == null) return; if(k === 'text') n.textContent = v; else n.setAttribute(k,v === true ? '' : String(v)); });
    children.flat().filter(c => c != null).forEach(c => n.append(c)); return n;
  };
  const key = 'vrff-commande', cart = new Map();
  try { Object.entries(JSON.parse(localStorage.getItem(key) || '{}')).forEach(([id,q]) => { if(canAdd(dishes.get(id)) && Number.isFinite(q) && q > 0) cart.set(id, Math.min(99,Math.floor(q))); }); } catch { /* Memory-only selection. */ }
  const save = () => { try { localStorage.setItem(key,JSON.stringify(Object.fromEntries(cart))); } catch {} };
  save(); // Remove obsolete example items from an earlier version.
  const total = () => [...cart].reduce((s,[id,q]) => s + Math.round(dishes.get(id).prix * 100) * q,0)/100;
  const count = () => [...cart.values()].reduce((s,q) => s+q,0);
  const tabs = $('#menuTabs'), panel = $('#menuPanel'), dialog = $('#cart');
  let current = 0, timer, opener;
  function stepper(p,q) {
    return el('div',{class:'stepper',role:'group','aria-label':'Quantité : '+p.nom},
      el('button',{'data-dec':p.id,'aria-label':'Retirer un : '+p.nom,type:'button',text:'−'}),
      el('output',{'aria-label':'Quantité',text:q}),
      el('button',{'data-inc':p.id,'aria-label':'Ajouter un : '+p.nom,type:'button',disabled:q>=99,text:'+'}));
  }
  function action(p) {
    return cart.has(p.id) ? stepper(p,cart.get(p.id)) : el('button',{class:'btn btn--primary','data-add':p.id,type:'button',disabled:!canAdd(p),'aria-label':'Ajouter : '+p.nom,text:canAdd(p)?'Ajouter +':'Indisponible'});
  }
  function card(p) {
    const media=el('div',{class:'card__media'});
    const missing=()=>media.replaceChildren(el('span',{text:'Photographie à venir'}));
    const url=p.photo && safeURL(p.photo);
    if(url){const img=el('img',{src:url,alt:p.nom,loading:'lazy',decoding:'async',width:800,height:600});img.addEventListener('error',missing,{once:true});media.append(img);}else missing();
    return el('article',{class:'card','data-plat':p.id},media,el('div',{class:'card__body'},el('h3',{text:p.nom}),el('p',{class:'card__desc',text:p.description || ''}),el('div',{class:'card__foot'},el('p',{class:'price'+(canAdd(p)?'':' price--unknown'),text:typeof p.prix==='number' && Number.isFinite(p.prix) && p.prix>0 ? money(p.prix) : 'Prix à confirmer'}),el('div',{class:'card__action'},action(p)))));
  }
  function fill() {
    const cat=cats[current], list=(cat?.plats || []).map(p=>dishes.get(p.id)).filter(Boolean);
    panel.setAttribute('aria-labelledby',cat?'tab-'+cat.id:'menu-title');
    panel.replaceChildren(...(list.length ? list.map(card) : [el('div',{class:'menu-empty'},el('div',{class:'menu-empty__title','aria-hidden':'true',text:cat?.nom || 'La carte'}),el('div',{},el('h3',{text:'Encore un peu de patience.'}),el('p',{text:'Les plats et les prix de cette catégorie ne sont pas encore publiés. Retrouvez-les ici dès leur confirmation.'})))]));
  }
  function select(i, focus=false, instant=false){
    if(!cats.length){fill();return;}current=(i+cats.length)%cats.length;
    [...tabs.children].forEach((t,j)=>{t.setAttribute('aria-selected',String(j===current));t.tabIndex=j===current?0:-1;if(j===current&&focus){t.focus({preventScroll:true});tabs.scrollTo({left:t.offsetLeft-20,behavior:reduce()?'instant':'smooth'});}});
    clearTimeout(timer);panel.classList.remove('is-leaving');
    if(instant||reduce())fill();else{panel.classList.add('is-leaving');timer=setTimeout(()=>{fill();panel.classList.remove('is-leaving');},140);}
  }
  cats.forEach((c,i)=>{const t=el('button',{class:'tab',role:'tab',id:'tab-'+c.id,type:'button','aria-controls':'menuPanel',text:c.nom});t.addEventListener('click',()=>select(i));tabs.append(t);});
  tabs.addEventListener('keydown',e=>{const moves={ArrowRight:current+1,ArrowLeft:current-1,Home:0,End:cats.length-1};if(e.key in moves){e.preventDefault();select(moves[e.key],true);}});
  select(0,false,true);
  if(dishes.size)$('#menuIntro').textContent='Choisissez selon votre envie.';
  const cfg=site.commande || {}, wa=phone(cfg.whatsapp).replace(/^\+/,''), tel=phone(cfg.telephone);
  if((wa||tel)&&[...dishes.values()].some(canAdd))$('#orderStatus').textContent=wa?'Composez votre sélection, puis préparez votre message sur WhatsApp. Le restaurant vous confirmera la disponibilité et la prise en charge.':'Composez votre sélection, puis appelez le restaurant pour vérifier la disponibilité et passer commande.';
  function renderCart(){
    const body=$('#cartBody'), foot=$('#cartFoot');
    if(!cart.size){body.replaceChildren(el('div',{class:'cart-empty'},el('h3',{text:'Votre prochaine envie.'}),el('p',{text:dishes.size?'Votre sélection est vide. Retrouvez les plats disponibles dans la carte.':'La carte n’est pas encore publiée. Aucun plat ne peut être ajouté pour le moment.'}),el('button',{class:'btn btn--primary',type:'button','data-goto-menu':true,text:'Voir le menu ↗'})));foot.replaceChildren();return;}
    const rows=[...cart].map(([id,q])=>{const p=dishes.get(id);return el('li',{class:'cart-item'},el('div',{},el('p',{class:'cart-item__name',text:p.nom}),el('p',{class:'cart-item__unit',text:money(p.prix)+' l’unité'})),el('div',{class:'cart-item__side'},el('strong',{text:money(Math.round(p.prix*100)*q/100)}),stepper(p,q)));});
    body.replaceChildren(el('ul',{class:'cart-list'},rows));
    const actions=el('div',{class:'cart-actions'});
    if(wa){const msg=['Bonjour, je souhaite commander :',...[...cart].map(([id,q])=>q+' × '+dishes.get(id).nom+' — '+money(Math.round(dishes.get(id).prix*100)*q/100)),'Total : '+money(total()),'Pouvez-vous confirmer la disponibilité ?'].join('\n');actions.append(el('a',{class:'btn btn--primary',href:'https://wa.me/'+wa+'?text='+encodeURIComponent(msg),target:'_blank',rel:'noopener noreferrer',text:'Préparer le message WhatsApp ↗'}));}
    if(tel)actions.append(el('a',{class:'btn',href:'tel:'+tel,text:'Appeler le restaurant'}));
    if(!wa&&!tel)actions.append(el('p',{class:'notice',text:'La prise de commande est indisponible : les coordonnées du restaurant ne sont pas encore publiées.'}));
    foot.replaceChildren(el('p',{class:'cart-total'},el('span',{text:'Total'}),el('strong',{text:money(total())})),actions,el('p',{class:'cart-note',text:'Aucun paiement sur ce site. Un message préparé n’est pas envoyé : envoyez-le dans WhatsApp et attendez la confirmation du restaurant.'}),el('button',{class:'text-btn',type:'button','data-clear-cart':true,text:'Vider la sélection'}));
  }
  function update(){
    const active=document.activeElement;const attr=['data-inc','data-dec','data-add'].find(a=>active?.hasAttribute(a));const id=attr&&active.getAttribute(attr);const inCart=dialog.contains(active);
    $$('[data-plat]').forEach(n=>n.querySelector('.card__action').replaceChildren(action(dishes.get(n.dataset.plat))));
    if(dialog.open)renderCart();
    if(id){const root=inCart?dialog:panel;const target=root.querySelector('['+attr+'="'+CSS.escape(id)+'"]')||root.querySelector('[data-add="'+CSS.escape(id)+'"]')||root.querySelector('[data-inc="'+CSS.escape(id)+'"]')||root.querySelector('button');target?.focus({preventScroll:true});}
    const n=count();$$('[data-cart-count]').forEach(b=>{b.textContent=n;b.setAttribute('aria-label',n+' article'+(n>1?'s':''));});$$('[data-cart-summary]').forEach(b=>b.textContent=money(total()));$('.cart-bar').hidden=n===0;document.body.classList.toggle('has-cart-bar',n>0);save();
  }
  const close=()=>{dialog.close();opener?.focus({preventScroll:true});};
  document.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.hasAttribute('data-open-cart')){opener=t;renderCart();if(!dialog.open)dialog.showModal();}
    else if(t.hasAttribute('data-close-cart'))close();
    else if(t.hasAttribute('data-goto-menu')){close();$('#menu').scrollIntoView({behavior:reduce()?'instant':'smooth'});panel.focus({preventScroll:true});}
    else if(t.hasAttribute('data-clear-cart')){cart.clear();update();dialog.querySelector('[data-goto-menu]')?.focus();$('#live').textContent='Sélection vidée.';}
    else{const id=t.dataset.add||t.dataset.inc||t.dataset.dec;if(!canAdd(dishes.get(id)))return;const q=Math.max(0,Math.min(99,(cart.get(id)||0)+(t.hasAttribute('data-dec')?-1:1)));if(q)cart.set(id,q);else cart.delete(id);update();$('#live').textContent=dishes.get(id).nom+' : '+q+'. '+count()+' article(s) dans la sélection.';}
  });
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  update();
  const contact=site.contact||{}, place=$('#placeBox');
  if(contact.adresse){place.append(el('address',{text:contact.adresse}));const map=safeURL(contact.lienCarte)||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(contact.adresse);place.append(el('a',{href:map,target:'_blank',rel:'noopener noreferrer',text:'Voir l’itinéraire ↗'}));}else place.append(el('p',{text:'L’adresse sera communiquée ici.'}));
  const hours=(site.horaires||[]).filter(h=>h.jour&&h.heures);if(hours.length)hours.forEach(h=>$('#hoursList').append(el('div',{class:'hours__row'},el('dt',{text:h.jour}),el('dd',{text:h.heures}))));else $('#hoursList').append(el('div',{},el('dt',{class:'sr-only',text:'Disponibilité'}),el('dd',{text:'Les horaires restent à confirmer.'})));
  const box=$('#contactBox'), contactTel=phone(contact.telephone);
  if(contactTel)box.append(el('p',{},el('a',{href:'tel:'+contactTel,text:contact.telephone})));
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email||''))box.append(el('p',{},el('a',{href:'mailto:'+contact.email,text:contact.email})));
  Object.entries(site.reseaux||{}).forEach(([name,url])=>{if(safeURL(url))box.append(el('p',{},el('a',{href:safeURL(url),target:'_blank',rel:'noopener noreferrer',text:name+' ↗'})));});
  if(!box.childElementCount)box.append(el('p',{text:'Les coordonnées seront bientôt disponibles.'}));
  const toggle=$('.nav-toggle'), nav=$('#nav');const navSet=open=>{nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fermer la navigation':'Ouvrir la navigation');};
  toggle.addEventListener('click',()=>navSet(!nav.classList.contains('is-open')));nav.addEventListener('click',()=>navSet(false));document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))navSet(false);});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){navSet(false);toggle.focus();}});
  $$('[data-year]').forEach(n=>n.textContent=new Date().getFullYear());
})();

