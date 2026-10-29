import {productLookupQuery} from './storefront-model';
import {validId} from './admin-model';

const base=(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/,'');
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const host=new URL(/* @vite-ignore */ './',import.meta.url);
let embedReady:Promise<void>|undefined;
function loadEmbed() {
  if(!embedReady)embedReady=new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');script.src=new URL('tryon-embed.js',host).href;
    script.onload=()=>resolve();script.onerror=()=>reject(new Error('No se pudo cargar el probador.'));
    document.head.append(script);
  });
  return embedReady;
}
async function connect(container:HTMLElement) {
  if(!base || !key)return;
  const link=container.querySelector<HTMLAnchorElement>('a');if(!link)return;
  try {
    const product=new URL(container.dataset.tryonProductUrl || '',location.href);
    const response=await fetch(`${base}/rest/v1/tryon_frames?${productLookupQuery(product.href)}`,{
      headers:{apikey:key},signal:AbortSignal.timeout(8000),credentials:'omit'});
    if(!response.ok)throw new Error('No se pudo consultar el modelo.');
    const rows:unknown=await response.json();
    // Missing or ambiguous links must never open a different frame.
    if(!Array.isArray(rows)||rows.length!==1||typeof rows[0]?.id!=='string'||!validId(rows[0].id))return;
    const url=new URL('tryon.html',host);url.searchParams.set('frame',rows[0].id);url.searchParams.set('lens','clear');
    link.href=url.href;
    // The ordinary link remains usable if the modal script cannot load.
    try {await loadEmbed();link.dataset.tryon='';}catch { /* Full-page fallback. */ }
    container.hidden=false;
  } catch { /* Optional product feature: leave it hidden when unavailable. */ }
}
document.querySelectorAll<HTMLElement>('[data-tryon-product-url]').forEach(container=>void connect(container));
