// js/access.js
import { getHost, getParam, ICONS, iconHtml } from './main.js';
import { fetchProlink, _internal } from './firebase-config.js';

// DOM helpers
const q = s => document.querySelector(s);
const ce = (t,c) => { const e=document.createElement(t); if(c) e.className=c; return e; };

document.addEventListener('DOMContentLoaded', async ()=>{
  const id = getParam('id');
  const titleEl = q('#pl-title');
  const descEl = q('#pl-desc');
  const socialButtons = q('#social-buttons');
  const proceedBtn = q('#proceed-btn');

  if(!id){ titleEl.textContent='Link inválido'; descEl.textContent='ID não fornecido.'; return; }

  // fetch
  let rec;
  try {
    const res = await fetchProlink(id);
    if(!res.ok){ titleEl.textContent='Não encontrado'; descEl.textContent='Este ProLink não existe.'; return; }
    rec = res.data;
  } catch(err){
    console.error('[access] fetch err', err);
    titleEl.textContent='Erro'; descEl.textContent='Não foi possível carregar os dados.';
    return;
  }

  titleEl.textContent = rec.name || 'ProLink';
  descEl.textContent = 'Clique em todas as redes abaixo; quando todas forem clicadas e seus timers de 10s terminarem, o botão será liberado.';

  // state: for each social store {url, network, clicked:false, timerDone:false}
  const state = (rec.socials || []).map(s => {
    // socials may be strings or {network,url} depending how created; handle both
    if(typeof s === 'string') {
      // try to determine network from host (simple heuristics)
      const host = (()=>{ try { return new URL(s).host.replace('www.',''); } catch(e){ return ''; }})();
      let net = 'default';
      if(host.includes('instagram')) net='instagram';
      else if(host.includes('youtube')) net='youtube';
      else if(host.includes('tiktok')) net='tiktok';
      else if(host.includes('twitter')) net='twitter';
      else if(host.includes('facebook')) net='facebook';
      else if(host.includes('wa.me') || host.includes('whatsapp')) net='whatsapp';
      return { network: net, url: s, clicked:false, timerDone:false };
    } else {
      return { network: s.network || 'default', url: s.url || '', clicked:false, timerDone:false };
    }
  });

  function refreshProceedState(){
    const allDone = state.length > 0 && state.every(it => it.timerDone === true);
    if(allDone){
      proceedBtn.disabled = false;
      proceedBtn.classList.remove('disabled');
      proceedBtn.classList.add('enabled');
      proceedBtn.setAttribute('aria-disabled','false');
      // visually indicate enabled
    } else {
      proceedBtn.disabled = true;
      proceedBtn.classList.remove('enabled');
      proceedBtn.classList.add('disabled');
      proceedBtn.setAttribute('aria-disabled','true');
    }
  }

  // render social buttons
  socialButtons.innerHTML='';
  state.forEach((it, idx) => {
    const btn = ce('button','pl-social');
    const iconWrap = ce('div','icon'); iconWrap.innerHTML = iconHtml(it.network);
    const meta = ce('div','meta'); meta.innerHTML = `<div class="name">${it.network.charAt(0).toUpperCase()+it.network.slice(1)}</div><div style="font-size:13px;color:var(--muted)">${it.url}</div>`;
    btn.appendChild(iconWrap); btn.appendChild(meta);
    btn.addEventListener('click', ()=>{
      // open url safely
      try { window.open(it.url, '_blank', 'noopener'); } catch(e){ window.location.href = it.url; }
      // if not clicked yet, mark clicked and start timer of 10s, after that set timerDone true
      if(!it.clicked){
        it.clicked = true;
        // visual feedback
        btn.classList.add('clicked');
        // Start a 10s invisible timer
        setTimeout(()=> {
          it.timerDone = true;
          refreshProceedState();
          // optionally add a subtle glow to the button to show completion
          btn.style.boxShadow = '0 8px 30px rgba(16,185,129,0.08)';
        }, 10000);
      } else {
        // if already clicked, do nothing (re-clicks do not restart)
      }
      refreshProceedState();
    });
    socialButtons.appendChild(btn);
  });

  // initial proceed disabled
  proceedBtn.disabled = true;
  proceedBtn.classList.add('disabled');
  proceedBtn.addEventListener('click', ()=>{
    if(!rec || !rec.target) return;
    // safe redirect
    try { window.location.href = rec.target; } catch(e){ window.open(rec.target, '_blank'); }
  });

  // diagnostic
  const diag = ce('div','small-muted'); diag.textContent = `Backend: ${_internal.firebaseAvailable ? 'Firebase' : 'Fallback local'}`;
  const panel = q('#panel'); if(panel) panel.appendChild(diag);

  refreshProceedState();
});
