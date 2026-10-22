import {isDraft,type Draft} from './admin-model';
import {readResponse as response} from './http-response';
const base=(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/,'');
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const cloudEnabled=!!(base && key);
interface Session {access_token:string;refresh_token:string;expires_at:number;user:{id:string;email:string}}
let session:Session|null=null;
try {session=JSON.parse(sessionStorage.getItem('mirada-session') || 'null');}catch { /* Start signed out. */ }
function saveSession(value:Session|null) {session=value;if(value)sessionStorage.setItem('mirada-session',JSON.stringify(value));else sessionStorage.removeItem('mirada-session');}
function headers(token?:string) {return {apikey:key,...(token?{Authorization:`Bearer ${token}`}:{})};}
async function token() {
  if(!session) throw new Error('Iniciá sesión para guardar online.');
  if(session.expires_at<Date.now()/1000+60) {
    const data=await response<Session & {expires_in:number}>(await fetch(`${base}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})}));
    saveSession({...data,expires_at:Date.now()/1000+data.expires_in});
  }
  return session!.access_token;
}
export const cloud={
  signedIn:()=>!!session,
  email:()=>session?.user.email || '',
  async verifyEditor() {
    if(!cloudEnabled || !session)throw new Error('Ingresá con una cuenta autorizada.');
    const auth=await token();
    const rows=await response<{user_id:string}[]>(await fetch(`${base}/rest/v1/catalog_editors?select=user_id&user_id=eq.${session!.user.id}`,{headers:headers(auth)}));
    if(!rows.length)throw new Error('Tu cuenta no tiene permiso para administrar el catálogo.');
  },
  async login(email:string,password:string) {
    if(!cloudEnabled) throw new Error('Todavía falta configurar el almacenamiento online.');
    const data=await response<Session & {expires_in:number}>(await fetch(`${base}/auth/v1/token?grant_type=password`,{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({email,password})}));
    saveSession({...data,expires_at:Date.now()/1000+data.expires_in});
    try {const rows=await response<{user_id:string}[]>(await fetch(`${base}/rest/v1/catalog_editors?select=user_id&user_id=eq.${data.user.id}`,{headers:headers(data.access_token)}));if(!rows.length)throw new Error('Tu cuenta no tiene permiso para administrar el catálogo.');}
    catch(error) {saveSession(null);throw error;}
  },
  async logout() {const current=session;saveSession(null);if(current)try{await fetch(`${base}/auth/v1/logout`,{method:'POST',headers:headers(current.access_token)});}catch{}},
  async list() {
    const auth=await token();
    const results=await Promise.all(['tryon_frames','tryon_drafts'].map(async table=>response<{payload:Draft}[]>(await fetch(`${base}/rest/v1/${table}?select=payload&order=updated_at.desc`,{headers:headers(auth)}))));
    return results.flatMap(rows=>rows.map(row=>row.payload)).filter(isDraft);
  },
  async publicFrames(id:string) {if(!cloudEnabled)throw new Error('Falta configurar la conexión con Supabase.');const rows=await response<{payload:Draft}[]>(await fetch(`${base}/rest/v1/tryon_frames?select=payload&status=eq.published&id=eq.${encodeURIComponent(id)}`,{headers:headers(),signal:AbortSignal.timeout(8000)}));return rows.map(row=>row.payload.frame);},
  async prepareFront(photo:string) {
    if(!cloudEnabled)throw new Error('La preparación con IA requiere activar Supabase y su función prepare-front. Consultá PREPARACION-IA.md.');
    const auth=await token();
    // Download only the original chosen in the editor, not an arbitrary server URL.
    const r=await fetch(photo);if(!r.ok)throw new Error('No se pudo leer la foto original.');
    const blob=await r.blob();if(blob.size>6*1024*1024)throw new Error('Usá una foto de hasta 6 MB para preparar con IA.');
    const form=new FormData();form.append('image',blob,'front.'+blob.type.split('/')[1]);
    const result=await fetch(`${base}/functions/v1/prepare-front`,{method:'POST',headers:headers(auth),body:form,signal:AbortSignal.timeout(135000)});
    if(result.status===404)throw new Error('Todavía falta desplegar la función prepare-front en Supabase. Consultá PREPARACION-IA.md.');
    const data=await response<{image:string}>(result);
    if(!data.image?.startsWith('data:image/png;base64,'))throw new Error('No se recibió el PNG preparado.');
    return data.image;
  },
  async save(draft:Draft) {
    const auth=await token();
    const copy:Draft=structuredClone(draft);
    async function upload(value:string|undefined) {
      if(!value?.startsWith('data:')) return value;
      const blob=await (await fetch(value)).blob();
      if(!['image/png','image/jpeg','image/webp'].includes(blob.type)||blob.size>10*1024*1024)throw new Error('Las fotos deben ser PNG, JPEG o WebP de hasta 10 MB.');
      const path=`${session!.user.id}/${crypto.randomUUID()}.${blob.type.split('/')[1]}`;
      const r=await fetch(`${base}/storage/v1/object/tryon-assets/${path}`,{method:'POST',headers:{...headers(auth),'Content-Type':blob.type},body:blob});
      if(!r.ok)throw new Error('No se pudo subir una foto. Revisá la conexión y los permisos.');
      return `${base}/storage/v1/object/public/tryon-assets/${path}`;
    }
    copy.frame.image=(await upload(copy.frame.image))!;
    copy.frame.sideImage=await upload(copy.frame.sideImage);
    copy.originalFront=await upload(copy.originalFront);copy.originalSide=await upload(copy.originalSide);
    // Resolve bundled assets so published rows can be used from any store origin.
    if(copy.frame.image.startsWith('./'))copy.frame.image=new URL(copy.frame.image,location.href).href;
    if(copy.frame.sideImage?.startsWith('./'))copy.frame.sideImage=new URL(copy.frame.sideImage,location.href).href;
    const table=copy.status==='published'?'tryon_frames':'tryon_drafts';
    await response<void>(await fetch(`${base}/rest/v1/${table}?on_conflict=id`,{method:'POST',headers:{...headers(auth),'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:copy.id,status:copy.status,payload:copy,updated_at:copy.updatedAt})}),{allowEmpty:true});
    return copy;
  },
  async unpublish(id:string) {
    const auth=await token();
    const rows=await response<{payload:Draft}[]>(await fetch(`${base}/rest/v1/tryon_frames?select=payload&id=eq.${encodeURIComponent(id)}`,{headers:headers(auth)}));
    if(!rows.length)return;
    const draft=rows[0].payload;draft.status='draft';draft.updatedAt=new Date().toISOString();
    await response<void>(await fetch(`${base}/rest/v1/tryon_frames?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{...headers(auth),'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({status:'draft',payload:draft,updated_at:draft.updatedAt})}),{allowEmpty:true});
  }
};
