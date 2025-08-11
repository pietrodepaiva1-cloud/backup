// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* CONFIG: Coloque aqui a config do seu Firebase */
const DEBUG_FALLBACK_LOCAL = true;

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

let db = null;
let firebaseAvailable = false;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseAvailable = true;
  console.info('[firebase-config] Firebase inicializado.');
} catch (err) {
  firebaseAvailable = false;
  console.warn('[firebase-config] Falha init Firebase — fallback localStorage', err);
}

const LS_KEY = 'prolink_db_v1';
function lsSave(payload){
  try {
    const raw = localStorage.getItem(LS_KEY) || '{}';
    const obj = JSON.parse(raw);
    obj[payload.id] = Object.assign({}, payload, {_savedAt: Date.now()});
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
    return true;
  } catch(e){ console.error('[firebase-config] lsSave', e); return false;}
}
function lsFetch(id){
  try {
    const raw = localStorage.getItem(LS_KEY) || '{}';
    const obj = JSON.parse(raw);
    return obj[id] || null;
  } catch(e){ console.error('[firebase-config] lsFetch', e); return null; }
}

export async function saveProlink(payload){
  try {
    if(firebaseAvailable && db){
      const toSave = Object.assign({}, payload, { createdAt: serverTimestamp() });
      await setDoc(doc(db, 'prolinks', payload.id), toSave);
      return { ok:true, id: payload.id, source:'firestore' };
    } else if(DEBUG_FALLBACK_LOCAL){
      lsSave(payload);
      return { ok:true, id: payload.id, source:'local' };
    } else return { ok:false, error:'no-backend' };
  } catch (err) {
    console.error('[firebase-config] saveProlink err', err);
    if(DEBUG_FALLBACK_LOCAL){ lsSave(payload); return { ok:true, id: payload.id, source:'local' } }
    return { ok:false, error:err.message||String(err) };
  }
}

export async function fetchProlink(id){
  try {
    if(firebaseAvailable && db){
      const snap = await getDoc(doc(db, 'prolinks', id));
      if(!snap.exists()) return { ok:false, error:'not-found' };
      return { ok:true, data:snap.data(), source:'firestore' };
    } else if(DEBUG_FALLBACK_LOCAL){
      const rec = lsFetch(id);
      if(!rec) return { ok:false, error:'not-found-local' };
      return { ok:true, data:rec, source:'local' };
    } else return { ok:false, error:'no-backend' };
  } catch(err){
    console.error('[firebase-config] fetchProlink err', err);
    if(DEBUG_FALLBACK_LOCAL){
      const rec = lsFetch(id);
      if(!rec) return { ok:false, error:'not-found-local' };
      return { ok:true, data:rec, source:'local' };
    }
    return { ok:false, error:err.message||String(err) };
  }
}

export const _internal = { firebaseAvailable, DEBUG_FALLBACK_LOCAL, LS_KEY };
