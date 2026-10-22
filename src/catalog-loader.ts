import {frames} from './catalog';
import {cloud,cloudEnabled} from './cloud';
import {isPublicFrame,validId} from './admin-model';
import {drafts} from './draft-store';

export async function loadCatalog() {
  const preview=new URLSearchParams(location.search).get('preview');
  if(preview) {
    await cloud.verifyEditor();
    try {const draft=await drafts.get(preview);if(draft && isPublicFrame(draft.frame)) {frames.splice(0,frames.length,draft.frame);return;}}
    catch { /* The caller shows an explicit error instead of a different product. */ }
    throw new Error('No se encontró el borrador local. Abrí la vista previa desde el mismo navegador del panel.');
  }
  if(!cloudEnabled)throw new Error('Falta configurar Supabase. Completá VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local y reiniciá npm run dev.');
  // A configured online catalog is authoritative: unpublished models must disappear.
  const id=new URLSearchParams(location.search).get('frame');
  if(!id || !validId(id))throw new Error('Abrí el probador desde el botón de un producto de la tienda.');
  const published=await cloud.publicFrames(id);
  frames.splice(0,frames.length,...published.filter(isPublicFrame));
}
