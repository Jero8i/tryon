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
`;

for(const frame of frames) {
  const card=document.createElement('article');card.className='product';
  card.innerHTML=`<div class="product-photo"><a class="online-link" data-tryon href="${e(tryonUrl(location.href,frame.id,'clear',location.origin).href)}" data-tryon-lens-select="lens-${frame.id}">PROBALO ONLINE &#8599;</a><img src="${e(frame.image)}" alt="Montura ${e(frame.name)}, ${e(frame.color)}" loading="lazy"></div><div class="product-info"><div><h3>${e(frame.name)}</h3><p>${e(frame.shape)} · ${e(frame.color)}</p></div><span class="measurement">${e(frame.width)}</span></div><p class="product-measures"></p><label for="lens-${frame.id}">Tipo de cristal</label><select id="lens-${frame.id}"></select><a class="try-button" data-tryon href="${e(tryonUrl(location.href,frame.id,'clear',location.origin).href)}" data-tryon-lens-select="lens-${frame.id}">Probar anteojos <span>&#8599;</span></a>`;
  const dimensions=frame.dimensions!;
  card.querySelector('.product-measures')!.textContent=[frame.material,dimensions.heightMm?`Alto ${dimensions.heightMm} mm`:dimensions.lensHeightMm?`Alto de cristal ${dimensions.lensHeightMm} mm`:'',`Patillas ${dimensions.templeMm} mm`].filter(Boolean).join(' · ');
  const select=card.querySelector('select')!;
  for(const lens of lensTypes) {const option=document.createElement('option');option.value=lens.id;option.textContent=lens.name;select.append(option);}
  const details=document.createElement('details');details.className='integration-code';
  const summary=document.createElement('summary');summary.textContent='Código para mi tienda';
  const code=document.createElement('textarea');code.readOnly=true;code.setAttribute('aria-label','Código de integración de '+frame.name);
  const productUrl=new URL('https://jero8i.github.io/tryon/tryon.html');productUrl.searchParams.set('frame',frame.id);productUrl.searchParams.set('lens','clear');
  code.value='<a href="'+productUrl.href.replaceAll('&','&amp;')+'" data-tryon>Probalo online</a>\n<script defer src="https://jero8i.github.io/tryon/tryon-embed.js"></script>';
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar código';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(code.value);copy.textContent='Copiado';}catch{code.focus();code.select();copy.textContent='Seleccionado: copiá con Ctrl+C';}};
  details.append(summary,code,copy);card.append(details);
  document.querySelector('#products')!.append(card);
}
// Preserve previously shared product links at the site's root.
const requested=new URLSearchParams(location.search).get('frame');
if(requested && frames.some(frame=>frame.id===requested)) {
  const index=frames.findIndex(frame=>frame.id===requested);
  const button=document.querySelectorAll<HTMLAnchorElement>('.try-button')[index];
  const lens=new URLSearchParams(location.search).get('lens') || 'clear';
  const select=document.querySelectorAll<HTMLSelectElement>('.product select')[index];
  select.value=lensTypes.some(type=>type.id===lens)?lens:'clear';
  button.click();
}
