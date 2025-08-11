// js/main.js
// utilitários (uid, url helpers, validation, icons map)

export function uid(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

export function buildAccessUrl(filename, id) {
  try {
    const url = new URL(filename, window.location.href);
    url.searchParams.set('id', id);
    return url.toString();
  } catch (e) {
    return `${window.location.origin}/${filename}?id=${encodeURIComponent(id)}`;
  }
}

export function isValidUrl(s){
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch(e){ return false; }
}

export function getHost(s){
  try { return new URL(s).host.replace('www.',''); } catch(e) { return s; }
}

/* icons map: network slug -> FontAwesome class (fallback to bi if needed) */
export const ICONS = {
  instagram: 'fab fa-instagram',
  twitter: 'fab fa-twitter',
  youtube: 'fab fa-youtube',
  tiktok: 'fab fa-tiktok',
  facebook: 'fab fa-facebook-f',
  linkedin: 'fab fa-linkedin-in',
  whatsapp: 'fab fa-whatsapp',
  telegram: 'fab fa-telegram-plane',
  github: 'fab fa-github',
  default: 'fas fa-link'
};

/* helper to get icon html */
export function iconHtml(network){
  const key = (network || '').toLowerCase();
  const cls = ICONS[key] || ICONS.default;
  return `<i class="${cls}"></i>`;
}

/* expose small debug */
export const ProLink = {
  uid: () => uid(8),
  testHelpers: () => {
    console.log('uid', uid(6));
    return true;
  }
};

if(typeof window !== 'undefined') window.ProLink = window.ProLink || ProLink;
