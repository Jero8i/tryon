import type {Frame} from './catalog';
export interface Draft {id:string;frame:Frame;status:'draft'|'published';updatedAt:string;originalFront?:string;originalSide?:string;productUrl?:string}
export function validId(id:string) {return /^[a-z0-9][a-z0-9-]{1,63}$/.test(id);}
export function validateFrame(frame:Frame):string[] {
  const errors:string[]=[];
  if(!validId(frame.id)) errors.push('El ID debe tener 2–64 letras minúsculas, números o guiones.');
  if(!frame.name.trim() || frame.name.length>120) errors.push('Completá un nombre de hasta 120 caracteres.');
  const d=frame.dimensions;
  if(!d || !Number.isFinite(d.widthMm)||d.widthMm<70||d.widthMm>200) errors.push('Indicá el ancho total de montura entre 70 y 200 mm.');
  if(!d || !Number.isFinite(d.templeMm)||d.templeMm<70||d.templeMm>200) errors.push('Indicá el largo de patillas entre 70 y 200 mm.');
  if(d?.heightMm!==undefined && (!Number.isFinite(d.heightMm)||d.heightMm<15||d.heightMm>100)) errors.push('El alto total debe estar entre 15 y 100 mm.');
  for(const [value,min,max] of [[d?.lensWidthMm,10,100],[d?.lensHeightMm,10,100],[d?.bridgeMm,5,40]])if(value!==undefined && (!Number.isFinite(value)||value<min!||value>max!))errors.push('Revisá las medidas opcionales de cristales y puente.');
  if(frame.templeHingeY!==undefined && (!Number.isFinite(frame.templeHingeY)||frame.templeHingeY<0||frame.templeHingeY>1))errors.push('La bisagra debe estar dentro de la montura.');
  if(!frame.image) errors.push('Cargá una foto frontal.');
  if(frame.anchorY!==undefined && (!Number.isFinite(frame.anchorY)||frame.anchorY<0||frame.anchorY>1)) errors.push('Marcá el apoyo del puente dentro de la foto.');
  return errors;
}
export function safeImageUrl(value:unknown):value is string {
  if(typeof value!=='string') return false;
  try {const url=new URL(value);return url.protocol==='https:' || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/.test(value);}catch{return /^\.\/frames\/[a-z0-9.-]+$/.test(value);}
}
export function isPublicFrame(value:unknown):value is Frame {
  if(!value || typeof value!=='object') return false;
  const f=value as Frame;
  if(typeof f.id!=='string'||typeof f.name!=='string'||typeof f.shape!=='string'||typeof f.color!=='string'||typeof f.width!=='string'||!safeImageUrl(f.image)) return false;
  if(f.material!==undefined && typeof f.material!=='string') return false;
  if(f.sideImage!==undefined && !safeImageUrl(f.sideImage)) return false;
  if(validateFrame(f).length) return false;
  const t=f.templeTexture;
  if(t && (![t.x,t.y,t.width,t.height].every(n=>Number.isFinite(n)&&n>=0&&n<=1) || (t.quad && (t.quad.length!==4 || !t.quad.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1))))) return false;
  return true;
}
export function escapeHtml(value:string) {return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export function isDraft(value:unknown):value is Draft {
  if(!value||typeof value!=='object')return false;
  const d=value as Draft;
  return isPublicFrame(d.frame) && d.id===d.frame.id && ['draft','published'].includes(d.status)
    && typeof d.updatedAt==='string' && Number.isFinite(Date.parse(d.updatedAt))
    && (d.originalFront===undefined||safeImageUrl(d.originalFront))
    && (d.originalSide===undefined||safeImageUrl(d.originalSide))
    && (d.productUrl===undefined||typeof d.productUrl==='string');
}
