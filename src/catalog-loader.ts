import {frames} from './catalog';
import {cloud,cloudEnabled} from './cloud';
import {isPublicFrame} from './admin-model';
import {drafts} from './draft-store';

export async function loadCatalog() {
  const preview=new URLSearchParams(location.search).get('preview');
  if(preview) {
    try {const draft=await drafts.get(preview);if(draft && isPublicFrame(draft.frame)) {frames.splice(0,frames.length,draft.frame);return;}}
    catch { /* The caller shows an explicit error instead of a different product. */ }
    throw new Error('No se encontró el borrador local. Abrí la vista previa desde el mismo navegador del panel.');
  }
  if(!cloudEnabled)return;
  // A configured online catalog is authoritative: unpublished models must disappear.
  const published=await cloud.publicFrames();
  frames.splice(0,frames.length,...published.filter(isPublicFrame));
}
