import './admin.css';
import {type Frame} from './catalog';
import {drafts} from './draft-store';
import {cloud,cloudEnabled} from './cloud';
import {validateFrame,isDraft,type Draft} from './admin-model';
import {PhotoEditor} from './photo-editor';
import {normalizeTempleQuad,type Quad} from './temples';
import {createLensMask} from './lenses';
import {integrationSnippet} from './integration';
import {normalizeProductUrl} from './storefront-model';

document.querySelector('#app')!.innerHTML=`<header><a class="brand" href="./">mirada<sup>®</sup></a><span>ADMINISTRACIÓN DEL PROBADOR</span><button id="logout" type="button">Cerrar sesión</button></header>
<main><div class="page-title"><div><p class="eyebrow">LA FILLE AUX LUNETTES</p><h1>Modelos del probador</h1><p>Configurá fotos, medidas y enlaces para el probador de tu tienda.</p></div><button id="new" type="button" class="primary">＋ Nuevo modelo</button></div>
<section class="connection"><div><strong id="connection-title"></strong><p id="connection-help"></p></div><button id="back-library" type="button" hidden>← Volver a modelos</button></section>
<p id="notice" role="status" aria-live="polite"></p><div class="admin-grid"><aside class="library"><h2>Modelos configurados</h2><input id="search" placeholder="Buscar por nombre o ID" aria-label="Buscar modelos"><div id="models"></div><p class="hint">Los borradores locales se guardan solo en este navegador. Exportá una copia para conservarlos.</p></aside>
<form id="editor" hidden><div class="form-heading"><h2 id="editor-title">Nuevo modelo</h2><span id="state">BORRADOR</span></div><fieldset><legend>01 · Datos y medidas</legend><div class="fields"><label>Nombre del modelo<input id="name" maxlength="120" required placeholder="Ej. Bless carey & black"></label><label>ID para conectar con la tienda<input id="model-id" pattern="[a-z0-9][a-z0-9-]{1,63}" required placeholder="bless-carey-black"><small>Único, en minúsculas y sin espacios. Se mantiene después de guardar.</small></label><label>Forma<input id="shape" placeholder="Rectangular, redonda…" maxlength="80"></label><label>Color<input id="color" placeholder="Carey y negro" maxlength="80"></label><label>Material<input id="material" placeholder="Zilo, metal…" maxlength="80"></label><label>Enlace del producto en la tienda<input id="product-url" type="url" placeholder="https://lafilleauxlunettes.com.ar/productos/…"><small>Vincula este lente con su ficha de Tiendanube. Al habilitarlo, el botón aparece automáticamente en ese producto.</small></label><label>Ancho total de montura (mm)<input id="width-mm" type="number" min="70" max="200" step="0.5" required></label><label>Alto total de montura (mm)<input id="height-mm" type="number" min="15" max="100" step="0.5"><small>Opcional. No usar el alto del cristal como alto de montura.</small></label><label>Largo de patillas (mm)<input id="temple-mm" type="number" min="70" max="200" step="0.5" required></label><label>Alto de patilla en la bisagra (mm)<input id="temple-height-mm" type="number" min="1" max="40" step="0.5"><small>Opcional. Medí de arriba a abajo junto a la bisagra para reproducir el grosor real.</small></label><label>Ancho de cristal (mm)<input id="lens-width" type="number" min="10" max="100" step="0.5"></label><label>Alto de cristal (mm)<input id="lens-height" type="number" min="10" max="100" step="0.5"></label><label>Puente (mm)<input id="bridge" type="number" min="5" max="40" step="0.5"></label></div></fieldset>
<fieldset><legend>02 · Fotos del producto</legend><details class="photo-guide"><summary>Cómo sacar las fotos</summary><p>Usá luz difusa, fondo blanco liso y cámara a la altura de la montura. Evitá filtros, reflejos intensos y sombras fuertes. La frontal debe estar nivelada, centrada y sin perspectiva. Sacá también una foto de costado donde se vea una patilla completa. Un producto por foto, sin textos ni collage. Conservamos la foto original.</p><p>Para el probador, quitá el fondo y las patillas que se ven detrás de los cristales. Prepará la frontal con tu prompt antes de cargarla. El zoom y el borrador manual sirven para retocar el PNG. Comprobá que el puente claro no se haya borrado.</p></details><label class="file-label">Foto frontal · PNG, JPEG o WebP<input id="front-file" type="file" accept="image/png,image/jpeg,image/webp"></label><div class="photo-restore"><button id="restore-front" type="button">Restaurar foto original</button><p class="hint">Subí la frontal ya preparada con tu prompt y usá el zoom y el borrador manual para retocarla.</p></div><div id="front-editor"></div><div class="alignment"><button type="button" id="mark-bridge">Marcar apoyo del puente</button><span id="bridge-label">Apoyo: 42% de altura de foto</span></div><label class="file-label">Foto lateral · opcional<input id="side-file" type="file" accept="image/png,image/jpeg,image/webp"></label><div id="side-editor"></div><div class="alignment"><button type="button" id="mark-temple">Marcar región de patilla</button><button type="button" id="clear-temple">Sin patillas laterales</button><span id="temple-label">Sin región marcada</span></div><p class="hint">Marcá cuatro puntos sobre el tramo recto de la patilla: arriba en bisagra, arriba atrás, abajo atrás y abajo en bisagra. Si no la marcás, el probador usará solo el frente.</p><label>Altura de la bisagra (% del alto de montura)<input id="hinge-y" type="number" min="0" max="100" value="27"></label></fieldset>
<fieldset><legend>03 · Revisar y habilitar en la tienda</legend><label class="review"><input id="reviewed" type="checkbox"> Revisé colores, medidas, contorno y que las aberturas de ambos cristales estén libres.</label><div class="actions"><button type="submit" class="primary" id="save">Guardar borrador</button><button type="button" id="preview">Probar con cámara ↗</button><button type="button" id="publish">Habilitar en la tienda</button><button type="button" id="unpublish">Deshabilitar en la tienda</button></div><div class="actions"><button type="button" id="export">Exportar copia</button><label class="import">Importar copia<input id="import" type="file" accept="application/json" hidden></label><button type="button" id="remove">Borrar copia local</button></div><p class="hint" id="publish-help"></p><label>Enlace para el botón de tu tienda<input id="integration-link" readonly placeholder="Disponible después de publicar"></label><button id="copy-link" type="button">Copiar enlace</button></fieldset></form></div></main><dialog id="preview-modal" aria-label="Vista previa del modelo"><div class="preview-bar"><strong>Vista previa · borrador</strong><button id="close-preview" type="button">Cerrar ×</button></div><div id="preview-slot"></div></dialog>`;
const $=<T extends HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const input=(id:string)=>$<HTMLInputElement>('#'+id);
const form=$<HTMLFormElement>('#editor');
let records:Draft[]=[];let currentId='';let currentStatus:Draft['status']='draft';
let originalFront:string|undefined,originalSide:string|undefined,anchorY=.42;
let texture:Frame['templeTexture'];let pointBuffer:{x:number;y:number}[]=[];
let publishedIds=new Set<string>();let dirty=false;let busy=false;let loading=false;
const front=new PhotoEditor($('#front-editor'),'Frontal preparada');
const side=new PhotoEditor($('#side-editor'),'Lateral preparada');
function message(text:string,error=false) {$('#notice').textContent=text;$('#notice').classList.toggle('error',error);}
function changed(){if(!loading){dirty=true;input('reviewed').checked=false;}}
front.onChange=changed;side.onChange=changed;form.addEventListener('input',event=>{if((event.target as HTMLElement).id!=='reviewed')dirty=true;});
async function run(action:()=>Promise<void>) {
  if(busy)return;busy=true;document.body.classList.add('busy');
  try {await action();}catch(error){message(error instanceof Error?error.message:'No se pudo completar la operación.',true);}
  finally {busy=false;document.body.classList.remove('busy');}
}
function connection() {
  $('#connection-title').textContent='Sesión: '+cloud.email();
  $('#connection-help').textContent='Panel privado · Los modelos habilitados pueden abrirse desde el botón de tu tienda.';
  $('#publish-help').textContent='Guardar borrador conserva cambios para revisar. Habilitar en la tienda actualiza la versión disponible para tus clientes.';
}
async function refresh() {
  const local=await drafts.list();const online=cloudEnabled&&cloud.signedIn()?await cloud.list():[];
  publishedIds=new Set(online.filter(d=>d.status==='published').map(d=>d.id));
  const combined=new Map<string,Draft>();for(const d of [...online,...local])if(!combined.has(d.id)||d.updatedAt>combined.get(d.id)!.updatedAt)combined.set(d.id,d);
  records=[...combined.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));renderList();
}
function renderList(){
  const list=$('#models');list.replaceChildren();const query=input('search').value.toLowerCase();
  for(const draft of records.filter(d=>(d.frame.name+' '+d.id).toLowerCase().includes(query))) {
    const card=document.createElement('article');card.className='model-card';
    const photo=document.createElement('img');photo.src=draft.frame.image;photo.alt=draft.frame.name;photo.loading='lazy';
    const title=document.createElement('h3');title.textContent=draft.frame.name || 'Sin nombre';
    const detail=document.createElement('p');detail.className='hint';detail.textContent=draft.id+' · '+(publishedIds.has(draft.id)?'Habilitado en tienda':'Borrador');
    const measurements=document.createElement('p');measurements.className='hint';measurements.textContent=draft.frame.width+' · '+draft.frame.color;
    const editButton=document.createElement('button');editButton.type='button';editButton.textContent='Editar modelo';editButton.onclick=()=>void run(()=>edit(draft));
    card.append(photo,title,detail,measurements,editButton);
    if(publishedIds.has(draft.id)) {
      const url=new URL('./tryon.html',location.href);url.searchParams.set('frame',draft.id);
      const preview=document.createElement('a');preview.href=url.href;preview.dataset.tryon='';preview.textContent='Probar modelo ↗';preview.className='model-preview';card.append(preview);
      card.append(integrationCode(draft.id));
    }
    list.append(card);
  }
  if(!records.length){const p=document.createElement('p');p.className='hint';p.textContent='Todavía no hay cargas. Empezá con Nuevo modelo.';list.append(p);}
}
function discard(){return !dirty||confirm('Hay cambios sin guardar. ¿Querés descartarlos?');}
async function edit(draft?:Draft) {
  if(!discard())return;loading=true;
  form.hidden=false;$('.admin-grid').classList.add('editing');$('#back-library').hidden=false;
  try {
    form.reset();front.clear();side.clear();texture=undefined;pointBuffer=[];front.onPoint=undefined;side.onPoint=undefined;
    currentId=draft?.id || '';currentStatus=draft?.status || 'draft';originalFront=draft?.originalFront;originalSide=draft?.originalSide;
    const f=draft?.frame;anchorY=f?.anchorY ?? .42;
    for(const [id,value] of Object.entries({'name':f?.name,'model-id':f?.id,'shape':f?.shape,'color':f?.color,'material':f?.material,'width-mm':f?.dimensions?.widthMm,'height-mm':f?.dimensions?.heightMm,'temple-mm':f?.dimensions?.templeMm,'temple-height-mm':f?.dimensions?.templeHeightMm,'lens-width':f?.dimensions?.lensWidthMm,'lens-height':f?.dimensions?.lensHeightMm,'bridge':f?.dimensions?.bridgeMm,'hinge-y':(f?.templeHingeY ?? .27)*100,'product-url':(draft as Draft & {productUrl?:string})?.productUrl})) input(id).value=value===undefined?'':String(value);
    input('model-id').readOnly=!!draft;
    if(f?.image)await front.load(f.image);
    if(f?.sideImage)await side.load(f.sideImage);
    texture=f?.templeTexture ? {...f.templeTexture,quad:f.templeTexture.quad ? normalizeTempleQuad(f.templeTexture.quad) : undefined} : undefined;
    front.setMarkers(f?[{x:.5,y:anchorY}]:[]);side.setMarkers(texture?.quad || []);
    $('#editor-title').textContent=f?.name || 'Nuevo modelo';$('#state').textContent=currentStatus==='published'?'PUBLICADO':'BORRADOR';
    $('#bridge-label').textContent=`Apoyo: ${Math.round(anchorY*100)}% de altura de foto`;
    $('#temple-label').textContent=texture?'Región de patilla guardada':'Sin región marcada';
    updateLink();dirty=false;
  } finally {loading=false;}
}
function number(id:string){return input(id).value?Number(input(id).value):undefined;}
function integrationCode(id:string) {
  const details=document.createElement('details');details.className='integration-code';
  const summary=document.createElement('summary');summary.textContent='Código para la tienda';
  const code=document.createElement('textarea');code.readOnly=true;code.setAttribute('aria-label','Código de integración de '+id);
  code.value=integrationSnippet('https://jero8i.github.io/tryon/',id);
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar código';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(code.value);copy.textContent='Copiado';}catch{code.focus();code.select();copy.textContent='Seleccionado: copiá con Ctrl+C';}};
  const hint=document.createElement('p');hint.className='hint';hint.textContent='Pegá el enlace en el producto y cargá el script una sola vez en la plantilla de tu tienda.';
  details.append(summary,code,copy,hint);return details;
}
function frameFromForm():Frame {
  const width=number('width-mm') ?? NaN;
  return {id:input('model-id').value.trim(),name:input('name').value.trim(),shape:input('shape').value.trim(),color:input('color').value.trim(),material:input('material').value.trim(),width:`${width} mm`,image:front.data,sideImage:side.data||undefined,anchorY,templeTexture:texture,templeHingeY:(number('hinge-y') ?? 27)/100,demo:false,dimensions:{widthMm:width,heightMm:number('height-mm'),templeMm:number('temple-mm') ?? NaN,templeHeightMm:number('temple-height-mm'),lensWidthMm:number('lens-width'),lensHeightMm:number('lens-height'),bridgeMm:number('bridge')}};
}
function updateLink(){const url=new URL('./tryon.html',location.href);url.searchParams.set('frame',currentId);input('integration-link').value=currentId&&currentStatus==='published'?url.href:'';}
async function save(status:Draft['status']='draft') {
  if(!form.reportValidity())throw new Error('Revisá los datos marcados en el formulario.');
  const frame=frameFromForm(),errors=validateFrame(frame);if(errors.length)throw new Error(errors.join(' '));
  const productUrl=input('product-url').value.trim();
  const normalizedProductUrl=productUrl?normalizeProductUrl(productUrl):'';
  if(productUrl&&!normalizedProductUrl)throw new Error('El enlace del producto debe ser una URL HTTPS válida.');
  if(!currentId&&records.some(d=>d.id===frame.id))throw new Error('Ese ID ya existe. Elegí otro o abrí el modelo guardado.');
  const draft:Draft & {productUrl?:string}={id:frame.id,frame,status,updatedAt:new Date().toISOString(),originalFront,originalSide,productUrl:normalizedProductUrl || ''};
  await drafts.put(draft);currentId=draft.id;input('model-id').readOnly=true;currentStatus=status;dirty=false;$('#state').textContent=status==='published'?'PUBLICADO':'BORRADOR';updateLink();await refresh();return draft;
}
form.onsubmit=event=>{event.preventDefault();void run(async()=>{
  const draft=await save('draft');
  // Drafts and published snapshots live in separate tables.
  if(cloudEnabled&&cloud.signedIn()) {
    const saved=await cloud.save(draft);await drafts.put(saved);
    originalFront=saved.originalFront;originalSide=saved.originalSide;
    await refresh();
  }
  message(publishedIds.has(draft.id)?'Cambios guardados como borrador. La versión publicada sigue visible hasta que pulses Habilitar en la tienda.':'Borrador guardado. Revisalo antes de publicar.');
});};
$('#new').onclick=()=>void run(()=>edit());input('search').oninput=renderList;
$('#preview').onclick=()=>void run(async()=>{
  const draft=await save('draft');const url=new URL('./tryon.html',location.href);url.searchParams.set('frame',draft.id);url.searchParams.set('preview',draft.id);url.searchParams.set('embed','1');url.searchParams.set('parentOrigin',location.origin);
  const iframe=document.createElement('iframe');iframe.title='Vista previa del borrador';iframe.allow='camera';iframe.src=url.href;
  $('#preview-slot').replaceChildren(iframe);$<HTMLDialogElement>('#preview-modal').showModal();message('Vista previa local. Cerrar el probador apaga la cámara.');
});
$('#publish').onclick=()=>void run(async()=>{
  if(!cloudEnabled||!cloud.signedIn())throw new Error('Para publicar, activá el almacenamiento online e ingresá con tu cuenta. Podés guardar borradores locales mientras tanto.');
  if(!input('reviewed').checked)throw new Error('Revisá el modelo y marcá la confirmación antes de publicar.');
  const image=new Image();image.src=front.data;await image.decode();
  const ctx=front.canvas.getContext('2d')!,pixels=ctx.getImageData(0,0,front.canvas.width,front.canvas.height);
  let x0=image.width,y0=image.height,x1=-1,y1=-1;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(pixels.data[(y*image.width+x)*4+3]>=128){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(!createLensMask(image,{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1}))throw new Error('La frontal debe tener ambas aberturas transparentes y cerradas por la montura. Limpiá fondo y patillas interiores, sin borrar el puente.');
  const draft=await save('draft');draft.status='published';
  const published=await cloud.save(draft);await drafts.put(published);currentStatus='published';dirty=false;$('#state').textContent='PUBLICADO';updateLink();await refresh();message('Modelo publicado. Ya podés usar su ID en el botón de tu tienda.');
});
$('#unpublish').onclick=()=>void run(async()=>{
  if(!currentId||!cloudEnabled||!cloud.signedIn())throw new Error('Ingresá y abrí un modelo online para retirarlo.');
  if(!confirm('¿Deshabilitar este modelo en el probador de la tienda?'))return;
  const draft=await save('draft');await cloud.unpublish(draft.id);const saved=await cloud.save(draft);await drafts.put(saved);updateLink();message('Modelo deshabilitado para el probador de la tienda.');await refresh();
});
$('#remove').onclick=()=>void run(async()=>{if(!currentId)return;if(!confirm('¿Borrar la copia de este navegador? Esto no elimina un modelo publicado online.'))return;await drafts.remove(currentId);dirty=false;await edit();await refresh();message('Copia local eliminada.');});
$('#mark-bridge').onclick=()=>{if(!front.data){message('Primero cargá la frontal.',true);return;}message('Tocá el centro del puente donde apoya sobre la nariz.');front.onPoint=(_x,y)=>{anchorY=y;front.onPoint=undefined;front.setMarkers([{x:.5,y}]);$('#bridge-label').textContent=`Apoyo: ${Math.round(y*100)}% de altura de foto`;changed();};};
$('#mark-temple').onclick=()=>{if(!side.data){message('Primero cargá una foto lateral.',true);return;}pointBuffer=[];message('Marcá: 1 arriba bisagra, 2 arriba atrás, 3 abajo atrás, 4 abajo bisagra.');side.onPoint=(x,y)=>{pointBuffer.push({x,y});side.setMarkers(pointBuffer);$('#temple-label').textContent=`${pointBuffer.length}/4 puntos`;if(pointBuffer.length<4)message(['','Ahora: arriba atrás (extremo opuesto a la bisagra).','Ahora: abajo atrás (debajo del punto 2).','Ahora: abajo en bisagra (debajo del punto 1).'][pointBuffer.length]);if(pointBuffer.length===4){side.onPoint=undefined;const xs=pointBuffer.map(p=>p.x),ys=pointBuffer.map(p=>p.y);texture={x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),quad:normalizeTempleQuad(pointBuffer as Quad)};changed();message('Región de patilla marcada. Revisala en la vista previa.');}};};
$('#clear-temple').onclick=()=>{texture=undefined;side.onPoint=undefined;side.setMarkers([]);$('#temple-label').textContent='Solo frente, sin patillas laterales';changed();};
async function readFile(file:File){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Usá una foto PNG, JPEG o WebP de hasta 10 MB.');return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('No se pudo leer la foto.'));reader.readAsDataURL(file);});}
input('front-file').onchange=()=>void run(async()=>{const file=input('front-file').files?.[0];if(!file)return;originalFront=await readFile(file);await front.load(originalFront);message('Frontal cargada. Usá el zoom y el borrador manual para retocar la imagen preparada con tu prompt.');});
input('side-file').onchange=()=>void run(async()=>{const file=input('side-file').files?.[0];if(!file)return;originalSide=await readFile(file);await side.load(originalSide);texture=undefined;changed();message('Lateral cargada. Prepará el fondo y marcá la región de patilla.');});
$('#export').onclick=()=>void run(async()=>{const draft=await save('draft');const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,draft})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${draft.id}-catalogo.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Copia exportada con las imágenes incluidas.');});
input('import').onchange=()=>void run(async()=>{const file=input('import').files?.[0];if(!file)return;if(file.size>60*1024*1024)throw new Error('La copia supera 60 MB.');const data=JSON.parse(await file.text());const draft=data.draft as Draft;if(data.version!==1 || !isDraft(draft))throw new Error('La copia no es válida.');draft.status='draft';draft.updatedAt=new Date().toISOString();await edit(draft);message('Copia cargada. Revisá los datos y guardala.');});
$('#copy-link').onclick=()=>void run(async()=>{const link=input('integration-link').value;if(!link)throw new Error('Publicá primero el modelo para obtener su enlace.');await navigator.clipboard.writeText(link);message('Enlace copiado. Para un modal, agregá embed=1 y parentOrigin de tu tienda.');});

$('#logout').onclick=()=>void run(async()=>{
  if(!discard())return;
  previewDialog.close();$('#preview-slot').replaceChildren();
  dirty=false;document.querySelector('#app')!.textContent='Cerrando sesión…';
  await cloud.logout();location.reload();
});
$('#back-library').onclick=()=>{if(!discard())return;dirty=false;form.hidden=true;$('.admin-grid').classList.remove('editing');$('#back-library').hidden=true;message('');};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
const previewDialog=$<HTMLDialogElement>('#preview-modal');
$('#restore-front').onclick=()=>void run(async()=>{
  if(!originalFront)throw new Error('No hay foto original guardada para este modelo.');
  await front.load(originalFront);anchorY=.42;front.onPoint=undefined;front.setMarkers([]);
  $('#bridge-label').textContent='Foto original restaurada; marcá el apoyo del puente después de preparar el recorte.';
  changed();message('Foto original restaurada.');
});
$('#close-preview').onclick=()=>previewDialog.close();
previewDialog.addEventListener('close',()=>{$('#preview-slot').replaceChildren();});
window.addEventListener('message',event=>{const iframe=$('#preview-slot').querySelector('iframe');if(iframe && event.source===iframe.contentWindow && event.origin===location.origin && event.data?.type==='tryon:close')previewDialog.close();});
connection();void run(async()=>{await refresh();});
