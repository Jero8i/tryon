import './style.css';
import { lensTypes, createLensMask, glassLayer } from './lenses';
import { projectedSize, estimatePd, AutoPd, frameRatio } from './fit';
import { drawTemple, headYaw, nearTemple, unprojectWidth, type Quad } from './temples';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { frames, type Frame } from './catalog';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header><a class="brand" href="./">mirada<span>®</span></a><span class="header-note">Una nueva forma de encontrar tus anteojos</span><span class="edition">ESTUDIO ÓPTICO / 01</span></header>
<main><div class="intro"><div><p class="eyebrow">TU PRÓXIMA MIRADA</p><h1>Encontrá tu forma<br>de ver el mundo.</h1></div><p>Probá una nueva perspectiva.<br>Elegí una montura y mirá cómo te queda,<br>desde donde estés.</p></div>
<section class="workspace" aria-label="Probador virtual"><div class="viewer"><div class="view-top"><span class="pill">◉ PROBADOR VIRTUAL</span><span id="live">VISTA PREVIA</span></div><div class="stage"><video playsinline muted></video><canvas></canvas><div id="placeholder"><div class="face-outline"><span>+</span></div><h2>Tu nueva mirada empieza acá.</h2><p>Activá la cámara y encontrá tu próximo favorito.</p><button id="start" class="primary">Activar cámara <span>↗</span></button><small>La cámara se activa solo con tu permiso.</small></div></div><div class="view-bottom"><span id="status" role="status" aria-live="polite">Buscá un lugar con buena luz y mirá de frente.</span><button id="stop" hidden>Apagar cámara</button></div></div>
<aside><div class="section-title"><h2>La colección</h2><span>01 — ${String(frames.length).padStart(2, '0')}</span></div><p class="muted">Un estilo para cada versión de vos.</p><div id="catalog"></div><div class="details"><p class="eyebrow">TU SELECCIÓN</p><div class="product-title"><h3 id="name"></h3><span id="width"></span></div><p id="description"></p><p id="dimensions"></p><span class="sample">Montura de demostración · ajuste aproximado</span></div><div class="lens-picker"><label for="lens-type">Tipo de cristal</label><select id="lens-type" aria-describedby="lens-help"></select><p id="lens-help" role="status">Efecto visual de transparencia y color.</p></div><div class="calibration"><p id="fit-mode" role="status">Activá la cámara para estimar tu distancia pupilar.</p><p>Escala automática según las medidas de cada montura. La DP se estima a partir de los iris; no equivale a una medición óptica.</p></div></aside></section>
<div class="footnotes"><p><span>01</span> Elegí tu montura</p><p><span>02</span> Activá tu cámara</p><p><span>03</span> Descubrí cómo te queda</p><button id="capture" disabled>↓ Guardar mi look</button></div><div class="privacy"><span>◇ Tu imagen se queda con vos. El video se procesa en tu navegador.</span><span>Frente 2D + patillas con perspectiva</span></div></main><footer><a class="brand" href="./">mirada<span>®</span></a><span>Otra forma de verte.</span><span>PROBADOR VIRTUAL — MVP 0.1</span></footer>`;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const video = $<HTMLVideoElement>('video');
const canvas = $<HTMLCanvasElement>('canvas');
const ctx = canvas.getContext('2d')!;
const start = $<HTMLButtonElement>('#start');
const capture = $<HTMLButtonElement>('#capture');
let selectedFrame: Frame;
let crop: {x: number; y: number; width: number; height: number} | undefined;
let detector: FaceLandmarker | undefined;
let stream: MediaStream | undefined;
let animation = 0, generation = 0, lastTime = -1;
let image: HTMLImageElement | undefined;
let templeImage: HTMLImageElement | undefined;
let lensMaskCanvas: HTMLCanvasElement | null = null;
let glass: HTMLCanvasElement | undefined;
let anchorY = 0.42;
const autoPd = new AutoPd();
let lastFaceTime = 0;
let imageGeneration = 0;
let pose: { x: number; y: number; width: number; height: number; angle: number; yaw: number } | undefined;
const status = (message: string) => { $('#status').textContent = message; };



const lensSelect = $<HTMLSelectElement>('#lens-type');
for (const type of lensTypes) { const option=document.createElement('option'); option.value=type.id; option.textContent=type.name; lensSelect.append(option); }
function updateGlass() {
  glass=lensMaskCanvas && crop ? glassLayer(lensMaskCanvas,crop,lensSelect.value) : undefined;
  $('#lens-help').textContent=lensMaskCanvas ? 'Simulación visual de color y reflejos. No representa graduación ni protección UV.' : 'No se pudieron delimitar ambas aberturas; se muestra la montura sin efecto.';
}
lensSelect.onchange=updateGlass;

// Exclude transparent padding from the physical width/height without changing the PNG.
function visibleBounds(img: HTMLImageElement) {
  const buffer = document.createElement('canvas'); buffer.width = img.naturalWidth; buffer.height = img.naturalHeight;
  const context = buffer.getContext('2d')!; context.drawImage(img,0,0);
  const pixels = context.getImageData(0,0,buffer.width,buffer.height).data;
  let x0=buffer.width, y0=buffer.height, x1=-1, y1=-1;
  for (let y=0;y<buffer.height;y++) for (let x=0;x<buffer.width;x++) {
    if (pixels[(y*buffer.width+x)*4+3] >= 128) { x0=Math.min(x0,x); y0=Math.min(y0,y); x1=Math.max(x1,x); y1=Math.max(y1,y); }
  }
  return x1 < 0 ? {x:0,y:0,width:buffer.width,height:buffer.height} : {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};
}

async function select(frame: Frame) {
  const token = ++imageGeneration;
  selectedFrame = frame;
  crop = undefined;
  templeImage = undefined; lensMaskCanvas=null; glass=undefined;
  lensSelect.disabled=true;
  pose = undefined;
  anchorY = frame.anchorY ?? 0.42;
  $('.sample').textContent = frame.templeTexture ? 'Patillas con perspectiva · geometría aproximada' : frame.demo === false ? 'Montura de producto · ajuste aproximado' : 'Montura de demostración · ajuste aproximado';
  $('#name').textContent = frame.name;
  $('#description').textContent = [frame.shape,frame.color,frame.material].filter(Boolean).join(' / ');
  $('#width').textContent = frame.width;
  const dimensions = frame.dimensions;
  $('#dimensions').textContent = dimensions ? [
    `Ancho de montura ${dimensions.widthMm} mm`,
    dimensions.heightMm ? `Alto de montura ${dimensions.heightMm} mm` : '',
    dimensions.lensWidthMm ? `Ancho de cristal ${dimensions.lensWidthMm} mm` : '',
    dimensions.lensHeightMm ? `Alto de cristal ${dimensions.lensHeightMm} mm` : '',
    dimensions.bridgeMm ? `Puente ${dimensions.bridgeMm} mm` : '',
    `Patillas ${dimensions.templeMm} mm`
  ].filter(Boolean).join(' · ') : '';
  document.querySelectorAll<HTMLButtonElement>('.frame').forEach(button => {
    const selected = button.dataset.id === frame.id;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  image = undefined;
  const next = new Image(); next.src = frame.image;
  try {
    await next.decode();
    if (token === imageGeneration) {
      if (frame.dimensions) {
        crop = visibleBounds(next);
        anchorY = (anchorY*next.naturalHeight-crop.y)/crop.height;
      }
      image = next;
      if (crop) lensMaskCanvas=createLensMask(next,crop);
      lensSelect.disabled=!lensMaskCanvas;
      updateGlass();
    }
  }
  catch { status('No pudimos cargar la montura. Elegí otra imagen.'); }
  if (frame.sideImage && frame.templeTexture) {
    const side = new Image(); side.src = frame.sideImage;
    try { await side.decode(); if (token === imageGeneration) templeImage = side; }
    catch { if (token === imageGeneration) status('La vista frontal está disponible; no pudimos cargar las patillas.'); }
  }
}
for (const frame of frames) {
  const button = document.createElement('button');
  button.className = 'frame'; button.dataset.id = frame.id;
  button.innerHTML = `<img src="${frame.image}" alt=""><span><strong>${frame.name}</strong><small>${frame.shape} · ${frame.color}</small></span><i>↗</i>`;
  button.onclick = () => void select(frame);
  $('#catalog').append(button);
}
void select(frames.find(frame => frame.id === new URLSearchParams(location.search).get('frame')) || frames[0]);

function stop() {
  generation++; cancelAnimationFrame(animation);
  stream?.getTracks().forEach(track => track.stop()); stream = undefined;
  video.srcObject = null; ctx.clearRect(0, 0, canvas.width, canvas.height);
  pose = undefined; lastTime = -1; capture.disabled = true; autoPd.reset(); lastFaceTime=0;
  $('#fit-mode').textContent = 'Activá la cámara para estimar tu distancia pupilar.';
  $('.viewer').classList.remove('active'); $('#stop').hidden = true;
  start.disabled = false; start.innerHTML = 'Activar cámara <span>↗</span>';
  $('#live').textContent = 'VISTA PREVIA';
}
start.onclick = async () => {
  const token = ++generation;
  start.disabled = true; start.textContent = 'Preparando probador…';
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Necesitás HTTPS o localhost y un navegador con acceso a cámara.');
    status('Descargando el detector facial. La primera carga puede tardar unos segundos.');
    if (!detector) {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
      detector = await FaceLandmarker.createFromOptions(vision, {baseOptions: {modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'}, runningMode:'VIDEO', numFaces:1});
    }
    if (token !== generation) return;
    const acquired = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
    if (token !== generation) { acquired.getTracks().forEach(track => track.stop()); return; }
    stream = acquired; video.srcObject = stream; await video.play();
    if (token !== generation) return;
    $('.viewer').classList.add('active'); $('#stop').hidden = false; $('#live').textContent = '● EN VIVO';
    loop();
  } catch (error) {
    stop();
    const denied = error instanceof DOMException && error.name === 'NotAllowedError';
    status(denied ? 'Permiso de cámara denegado. Habilitalo en tu navegador y volvé a intentar.' : error instanceof DOMException && error.name === 'NotFoundError' ? 'No encontramos una cámara conectada.' : `No se pudo iniciar. ${error instanceof Error ? error.message : 'Volvé a intentar.'}`);
  }
};
function loop() {
  if (!stream || !detector) return;
  try {
    if (video.readyState >= 2 && video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const points = detector.detectForVideo(video, performance.now()).faceLandmarks[0];
      capture.disabled = !points || !image;
      if (points) {
        const left = points[33], right = points[263], bridge = points[168];
        const dx = (right.x-left.x)*canvas.width, dy = (right.y-left.y)*canvas.height;
        const yaw = headYaw(left,right,canvas.width,canvas.height);
        const irisLeft = points[468], irisRight = points[473];
        lastFaceTime=performance.now();
        const knownPd = autoPd.add(estimatePd(points,canvas.width,canvas.height,yaw));
        $('#fit-mode').textContent = knownPd === null ? 'Mirá de frente, a la cámara y con los ojos abiertos para estimar tu DP.' : `DP estimada: ≈ ${Math.round(knownPd)} mm · escala automática aproximada`;
        const irisDistance = irisLeft && irisRight ? Math.hypot((irisRight.x-irisLeft.x)*canvas.width,(irisRight.y-irisLeft.y)*canvas.height) : 0;
        if (knownPd === null || !Number.isFinite(irisDistance) || irisDistance<1) {
          capture.disabled=true; pose=undefined;
          status('Mirá a la cámara con buena luz y mantené el rostro quieto un momento.');
          animation=requestAnimationFrame(loop);return;
        }
        const imageRatio = crop ? crop.height/crop.width : image ? image.naturalHeight/image.naturalWidth : 1/3;
        const ratio = selectedFrame.dimensions ? frameRatio(selectedFrame.dimensions.widthMm,selectedFrame.dimensions.heightMm,imageRatio) : imageRatio;
        const physical = selectedFrame.dimensions && knownPd !== null
          ? projectedSize(irisDistance,knownPd,selectedFrame.dimensions.widthMm,selectedFrame.dimensions.heightMm ?? selectedFrame.dimensions.widthMm*ratio) : null;
        // The observed eye span shortens with yaw. Recover the frontal scale once,
        // then project the frame width; frame height must not shrink with the turn.
        if (!physical) {capture.disabled=true;animation=requestAnimationFrame(loop);return;}
        const width = unprojectWidth(physical.width,yaw);
        const target = {x:bridge.x*canvas.width,y:bridge.y*canvas.height,width,height:width*ratio,angle:Math.atan2(dy,dx),yaw};
        if (!pose) pose = target;
        else { const alpha = .4; pose.x += (target.x-pose.x)*alpha; pose.y += (target.y-pose.y)*alpha; pose.width += (target.width-pose.width)*alpha; pose.height += (target.height-pose.height)*alpha; pose.yaw += (target.yaw-pose.yaw)*alpha; pose.angle += Math.atan2(Math.sin(target.angle-pose.angle),Math.cos(target.angle-pose.angle))*alpha; }
        if (image) {
          const width = pose.width, height = pose.height;
          const shiftY = 0;
          ctx.imageSmoothingEnabled=true;
          ctx.imageSmoothingQuality='high';
          ctx.save(); ctx.translate(pose.x,pose.y+shiftY); ctx.rotate(pose.angle);
          if (templeImage && selectedFrame.templeTexture && selectedFrame.dimensions) {
            const texture=selectedFrame.templeTexture;
            const side=nearTemple(pose.yaw);
            const ear=points[side === -1 ? 234 : 454];
            const ex=ear.x*canvas.width-pose.x, ey=ear.y*canvas.height-pose.y-shiftY;
            drawTemple(ctx,templeImage,{
              width,height,anchorY,yaw:pose.yaw,templeLengthRatio:selectedFrame.dimensions.templeMm/selectedFrame.dimensions.widthMm,hingeHeightFraction:selectedFrame.templeHingeY,
              source:{x:texture.x*templeImage.naturalWidth,y:texture.y*templeImage.naturalHeight,width:texture.width*templeImage.naturalWidth,height:texture.height*templeImage.naturalHeight},
              photoQuad:texture.quad?.map(point=>({x:point.x*templeImage!.naturalWidth,y:point.y*templeImage!.naturalHeight})) as Quad | undefined,
              ear:{x:ex*Math.cos(pose.angle)+ey*Math.sin(pose.angle),y:-ex*Math.sin(pose.angle)+ey*Math.cos(pose.angle)}
            });
          }
          // Front rim covers the hinge. Both surfaces use the same yaw and roll.
          ctx.scale(Math.cos(pose.yaw),1);
          if (glass && crop) ctx.drawImage(glass,crop.x,crop.y,crop.width,crop.height,-width/2,-height*anchorY,width,height);
          if (crop) ctx.drawImage(image,crop.x,crop.y,crop.width,crop.height,-width/2,-height*anchorY,width,height);
          else ctx.drawImage(image,-width/2,-height*anchorY,width,height);
          ctx.restore();
        }
        status(Math.abs(pose.yaw) > .8 ? 'Giro pronunciado: volvé un poco de frente para mejorar el ajuste.' : 'Medidas de montura aplicadas · DP estimada automáticamente. Girá suavemente para ver las patillas.');
      } else {
        pose = undefined; autoPd.add(null);
        if (performance.now()-lastFaceTime>800) autoPd.reset();
        $('#fit-mode').textContent='Buscando rostro · estimación automática de DP';
        status('Ubicá tu rostro en el centro y buscá buena iluminación.');
      }
    }
    animation = requestAnimationFrame(loop);
  } catch { stop(); status('Se interrumpió el seguimiento facial. Volvé a activar la cámara.'); }
}
$('#stop').onclick = () => { stop(); status('Cámara apagada. Podés volver a activarla cuando quieras.'); };
document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); status('Cámara apagada al salir de la pestaña.'); } });
window.addEventListener('pagehide', () => { stop(); detector?.close(); });
capture.onclick = () => {
  if (!stream || capture.disabled) return;
  const snapshot = document.createElement('canvas'); snapshot.width = canvas.width; snapshot.height = canvas.height;
  const c = snapshot.getContext('2d')!; c.translate(snapshot.width,0); c.scale(-1,1); c.drawImage(video,0,0); c.drawImage(canvas,0,0);
  snapshot.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='mi-mirada.png'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); },'image/png');
};
