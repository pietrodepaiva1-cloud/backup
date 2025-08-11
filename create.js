// js/create.js
// lógica da página create.html
// usa saveProlink(payload) exportado por firebase-config.js

import { uid, buildAccessUrl, isValidUrl } from './main.js';
import { saveProlink, _internal } from './firebase-config.js';

// DOM helpers
function q(sel) { return document.querySelector(sel); }
function ce(tag, cls) { const el = document.createElement(tag); if (cls) el.className = cls; return el; }

document.addEventListener('DOMContentLoaded', () => {
  const form = q('#prolink-form');
  const newSocial = q('#new-social');
  const addBtn = q('#add-social');
  const socialsList = q('#socials-list');
  const generatedAnchor = q('#generated-url');
  const preview = q('#preview');
  const previewTitle = q('#preview-title');
  const previewList = q('#preview-list');
  const submitBtn = q('#submit-btn');

  let socials = [];

  function renderSocials() {
    socialsList.innerHTML = '';
    previewList.innerHTML = '';
    socials.forEach((s, idx) => {
      const row = ce('div', 'flex items-center justify-between bg-[#061122] p-2 rounded');
      const left = ce('div', 'text-sm truncate');
      left.textContent = s;
      const right = ce('div', 'flex items-center gap-2');
      const rm = ce('button', 'remove text-xs px-2 py-1 rounded bg-red-600');
      rm.textContent = 'Remover';
      rm.addEventListener('click', () => {
        socials.splice(idx, 1);
        renderSocials();
      });
      right.appendChild(rm);
      row.appendChild(left);
      row.appendChild(right);
      socialsList.appendChild(row);

      // preview
      const p = ce('div', 'text-sm text-gray-400 truncate');
      p.textContent = s;
      previewList.appendChild(p);
    });
    preview.style.display = socials.length ? 'block' : 'none';
  }

  addBtn.addEventListener('click', () => {
    const v = newSocial.value.trim();
    if (!v) { newSocial.focus(); return; }
    if (!isValidUrl(v)) { alert('Insira um link válido começando com http(s)://'); newSocial.focus(); return; }
    socials.push(v);
    newSocial.value = '';
    renderSocials();
  });

  // allow Enter key to add
  newSocial.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBtn.click();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (q('#pl-name').value || '').trim() || 'ProLink';
    const target = (q('#pl-target').value || '').trim();
    if (!target) { alert('Informe o link final (destino).'); q('#pl-target').focus(); return; }
    if (!isValidUrl(target)) { alert('Link final inválido. Use http(s)://'); q('#pl-target').focus(); return; }
    if (socials.length === 0) { alert('Adicione pelo menos uma rede social.'); newSocial.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Gerando...';

    const id = uid(8);
    const payload = { id, name, target, socials };

    try {
      const res = await saveProlink(payload);
      if (!res.ok) throw new Error(res.error || 'save-failed');

      const accessUrl = buildAccessUrl('access.html', id);
      generatedAnchor.textContent = accessUrl;
      generatedAnchor.href = accessUrl;
      generatedAnchor.target = '_blank';
      generatedAnchor.classList.add('url-animate');

      // copy to clipboard with fallback
      try {
        await navigator.clipboard.writeText(accessUrl);
        generatedAnchor.textContent = accessUrl + " (copiado)";
      } catch (copyErr) {
        // ignore, show manual
      }

      alert('Link criado com sucesso! URL copiada (quando possível).');
    } catch (err) {
      console.error('[create] Erro ao criar ProLink:', err);
      alert('Erro ao salvar. Verifique configuração do Firebase e regras. Mensagem: ' + (err.message || err));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gerar Link';
    }
  });

  /* small diagnostic / helper */
  const diag = ce('div', 'text-xs text-gray-500 mt-2');
  diag.innerHTML = `Backend: ${_internal.firebaseAvailable ? 'Firebase' : 'No Firebase (local fallback)'} - LS key: ${_internal.LS_KEY}`;
  if (form) form.appendChild(diag);

  // initial render
  renderSocials();
});

/* Expose a programmatic create helper for console testing:
   ProLink.createTest({name:'T', target:'https://example.com', socials:['https://...']})
*/
if (typeof window !== 'undefined') {
  window.ProLink = window.ProLink || {};
  window.ProLink.createTest = async function(payload) {
    const mod = await import('./firebase-config.js');
    const save = mod.saveProlink;
    payload.id = payload.id || uid(8);
    return await save(payload);
  };
}
