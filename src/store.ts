import './store.css';
import {frames} from './catalog';
import {lensTypes} from './lenses';
import {tryonUrl} from './integration';
import {loadCatalog} from './catalog-loader';
import {escapeHtml as e} from './admin-model';

try {await loadCatalog();}
catch(error) {document.body.textContent=error instanceof Error?error.message:'No se pudo cargar el catálogo. Volvé a intentar.';throw error;}

document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
<header><a href="./" class="brand">mirada<sup>®</sup></a><nav aria-label="Principal"><a href="#collection">La colección</a><a href="#how">Cómo probarlos</a></nav><span>ESTUDIO ÓPTICO / 01</span></header>
<main><section class="hero"><p class="eyebrow">UNA MONTURA. MUCHAS FORMAS DE SER VOS.</p><h1>Tu próxima mirada,<br>más cerca.</h1><div class="hero-bottom"><p>Elegí tus favoritos y probalos con tu cámara.<br>Encontrá esa forma que se siente tuya.</p><a href="#collection">Explorar la colección ↘</a></div></section>
<section id="collection" aria-labelledby="collection-title"><div class="collection-heading"><h2 id="collection-title">La colección</h2><span>${String(frames.length).padStart(2,'0')} MODELOS · PROBADOR VIRTUAL</span></div><div id="products" class="products"></div></section>
<section id="how" class="how"><p class="eyebrow">TU ESPEJO, DONDE ESTÉS</p><h2>Encontrá tu favorito<br>en tres pasos.</h2><ol><li><span>01</span><div><h3>Elegí una montura</h3><p>Explorá formas, colores y tipos de cristal.</p></div></li><li><span>02</span><div><h3>Probala en tu cara</h3><p>Abrí el probador y permití el acceso a tu cámara.</p></div></li><li><span>03</span><div><h3>Mirá desde otro ángulo</h3><p>Girá suavemente o guardá una captura de tu look.</p></div></li></ol></section><p class="privacy">◇ Tu video se procesa en tu navegador. La escala y los cristales son una simulación visual.</p></main>
<footer><a href="./" class="brand">mirada<sup>®</sup></a><span>Otra forma de verte.</span><span>COLECCIÓN DE DEMOSTRACIÓN</span></footer>
<dialog id="tryon-modal" aria-labelledby="modal-title"><div class="modal-bar"><h2 id="modal-title">Probador virtual</h2><button id="close-modal" type="button" aria-label="Cerrar probador">Cerrar ×</button></div><div id="embed-slot"></div></dialog>`;

const dialog=document.querySelector<HTMLDialogElement>('#tryon-modal')!;
const slot=document.querySelector<HTMLDivElement>('#embed-slot')!;
let iframe:HTMLIFrameElement|undefined;
let opener:HTMLButtonElement|undefined;

function close() {
  if(iframe) {
    iframe.contentWindow?.postMessage({type:'tryon:stop'},new URL(iframe.src).origin);
    // Destroy the browsing context so the camera and model cannot keep running.
    iframe.remove();iframe=undefined;
  }
  slot.replaceChildren();document.body.classList.remove('modal-open');opener?.focus();
}
dialog.addEventListener('close',close);
window.addEventListener('message',event=>{
  if(iframe && event.source===iframe.contentWindow && event.origin===new URL(iframe.src).origin && event.data?.type==='tryon:close') dialog.close();
});
document.querySelector<HTMLButtonElement>('#close-modal')!.onclick=()=>dialog.close();
dialog.addEventListener('click',event=>{
  const rect=dialog.getBoundingClientRect();
  if(event.target===dialog && (event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)) dialog.close();
});

function open(frameId:string,lensId:string,button:HTMLButtonElement) {
  if(!frames.some(frame=>frame.id===frameId)) return;
  opener=button;
  iframe=document.createElement('iframe');
  iframe.title=`Probador virtual — ${frames.find(frame=>frame.id===frameId)!.name}`;
  iframe.allow='camera';iframe.src=tryonUrl(location.href,frameId,lensId,location.origin).href;
  slot.replaceChildren(iframe);
  document.querySelector('#modal-title')!.textContent=`Probá ${frames.find(frame=>frame.id===frameId)!.name}`;
  dialog.showModal();document.body.classList.add('modal-open');
}

for(const frame of frames) {
  const card=document.createElement('article');card.className='product';
  card.innerHTML=`<div class="product-photo"><span>PROBALO ONLINE ↗</span><img src="${e(frame.image)}" alt="Montura ${e(frame.name)}, ${e(frame.color)}" loading="lazy"></div><div class="product-info"><div><h3>${e(frame.name)}</h3><p>${e(frame.shape)} · ${e(frame.color)}</p></div><span class="measurement">${e(frame.width)}</span></div><p class="product-measures"></p><label for="lens-${frame.id}">Tipo de cristal</label><select id="lens-${frame.id}"></select><button type="button" class="try-button">Probar anteojos <span>↗</span></button>`;
  const dimensions=frame.dimensions!;
  card.querySelector('.product-measures')!.textContent=[frame.material,dimensions.heightMm?`Alto ${dimensions.heightMm} mm`:dimensions.lensHeightMm?`Alto de cristal ${dimensions.lensHeightMm} mm`:'',`Patillas ${dimensions.templeMm} mm`].filter(Boolean).join(' · ');
  const select=card.querySelector('select')!;
  for(const lens of lensTypes) {const option=document.createElement('option');option.value=lens.id;option.textContent=lens.name;select.append(option);}
  const button=card.querySelector<HTMLButtonElement>('.try-button')!;
  button.onclick=()=>open(frame.id,select.value,button);
  document.querySelector('#products')!.append(card);
}
// Preserve previously shared product links at the site's root.
const requested=new URLSearchParams(location.search).get('frame');
if(requested && frames.some(frame=>frame.id===requested)) {
  const index=frames.findIndex(frame=>frame.id===requested);
  const button=document.querySelectorAll<HTMLButtonElement>('.try-button')[index];
  const lens=new URLSearchParams(location.search).get('lens') || 'clear';
  open(requested,lensTypes.some(type=>type.id===lens)?lens:'clear',button);
}
