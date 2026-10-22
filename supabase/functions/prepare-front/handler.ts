export const FRONT_PROMPT = `Edit the supplied FRONT eyeglasses product photograph into a faithful virtual try-on overlay.
Keep ONLY the complete front rim, bridge and front hinge ends. Remove ALL rear temples, including every segment protruding ABOVE or OUTSIDE the front and every folded temple tip visible INSIDE the lens openings. Both lens openings must be fully transparent. Remove background, floor shadows and unrelated objects.
Preserve EXACT original front silhouette, proportions, bridge, rim thickness, material texture, tiny details, photographed colors and subtle highlights. Do not boost saturation, contrast, gloss or sharpen artificially. Do not invent or redesign the product. Preserve pale/translucent acetate instead of erasing it.
Output genuine alpha-transparent PNG, antialiased edges without white fringe, no text or checkerboard. Preserve source canvas aspect, original product placement and orientation; entire front must be visible. This is product cleanup, not creative generation. Return one image.`;

interface Options {supabaseUrl:string;supabaseKey:string;openaiKey:string;allowedOrigins:string[];fetcher?:typeof fetch}
const LIMIT=7*1024*1024;
export function createHandler(options:Options) {
  const requestFetch=options.fetcher || fetch;
  return async function handle(request:Request):Promise<Response> {
    const origin=request.headers.get('Origin') || '';
    const allowed=options.allowedOrigins.includes(origin);
    const cors:Record<string,string>=allowed?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{};
    const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
    if(!allowed)return json(403,{message:'Origen del panel no autorizado para preparar fotos.'});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(request.method!=='POST')return json(405,{message:'Método no permitido.'});
    const authorization=request.headers.get('Authorization') || '';
    if(!authorization.startsWith('Bearer '))return json(401,{message:'Iniciá sesión para preparar la foto.'});
    if(!options.supabaseUrl||!options.supabaseKey||!options.openaiKey)return json(503,{message:'Falta activar la preparación con IA en el servidor. Consultá PREPARACION-IA.md.'});
    try {
      // Validate the user with Auth; never trust JWT claims supplied by the browser.
      const authHeaders={apikey:options.supabaseKey,Authorization:authorization};
      const userResponse=await requestFetch(`${options.supabaseUrl}/auth/v1/user`,{headers:authHeaders,signal:AbortSignal.timeout(10000)});
      if(!userResponse.ok)return json(401,{message:'La sesión venció. Volvé a ingresar.'});
      const user=await userResponse.json() as {id?:string};
      if(!user.id)return json(401,{message:'Sesión no válida.'});
      const memberResponse=await requestFetch(`${options.supabaseUrl}/rest/v1/catalog_editors?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`,{headers:authHeaders,signal:AbortSignal.timeout(10000)});
      if(!memberResponse.ok)return json(403,{message:'No se pudo verificar tu permiso de edición.'});
      const members=await memberResponse.json() as unknown[];
      if(!members.length)return json(403,{message:'Tu cuenta no tiene permiso para preparar fotos.'});
      if(Number(request.headers.get('Content-Length'))>LIMIT)return json(413,{message:'Usá una foto de hasta 6 MB para preparar con IA.'});
      if(!request.headers.get('Content-Type')?.startsWith('multipart/form-data'))return json(400,{message:'Se requiere una fotografía adjunta.'});
      // Bound streamed bodies too: Content-Length may be absent or untrustworthy.
      const reader=request.body?.getReader();if(!reader)return json(400,{message:'Falta la fotografía.'});
      const chunks:Uint8Array[]=[];let size=0;
      while(true){const result=await reader.read();if(result.done)break;size+=result.value.length;if(size>LIMIT){await reader.cancel();return json(413,{message:'La foto supera el tamaño permitido.'});}chunks.push(result.value);}
      const bytes=new Uint8Array(size);let cursor=0;for(const chunk of chunks){bytes.set(chunk,cursor);cursor+=chunk.length;}
      const form=await new Response(bytes,{headers:{'Content-Type':request.headers.get('Content-Type')!}}).formData();
      const file=form.get('image');
      if(!(file instanceof File)||file.size<12||file.size>6*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))return json(400,{message:'Elegí una foto PNG, JPEG o WebP de hasta 6 MB.'});
      const signature=new Uint8Array(await file.slice(0,12).arrayBuffer());
      const valid=file.type==='image/png'?signature[0]===137&&signature[1]===80&&signature[2]===78&&signature[3]===71:
        file.type==='image/jpeg'?signature[0]===255&&signature[1]===216&&signature[2]===255:
        String.fromCharCode(...signature.slice(0,4))==='RIFF'&&String.fromCharCode(...signature.slice(8,12))==='WEBP';
      if(!valid)return json(400,{message:'El archivo no coincide con un formato de foto permitido.'});
      const edit=new FormData();edit.append('image',file,'front.'+file.type.split('/')[1]);
      edit.append('model','gpt-image-2.5-sunburst');edit.append('prompt',FRONT_PROMPT);edit.append('background','transparent');edit.append('output_format','png');edit.append('quality','high');edit.append('size','auto');edit.append('n','1');
      const edited=await requestFetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${options.openaiKey}`},body:edit,signal:AbortSignal.timeout(120000)});
      if(!edited.ok)return json(502,{message:edited.status===429?'El servicio de imágenes alcanzó su límite de uso. Revisá los límites o el saldo de la API.':'No se pudo preparar la imagen. Revisá que la cuenta de API tenga acceso al modelo; la foto original sigue intacta.'});
      const output=await edited.json() as {data?:{b64_json?:string}[]};
      const image=output.data?.[0]?.b64_json;
      if(!image || image.length>24*1024*1024 || !/^[A-Za-z0-9+/=]+$/.test(image) || !image.startsWith('iVBORw0KGgo'))return json(502,{message:'El servicio no devolvió un PNG válido. La foto original no fue modificada.'});
      return json(200,{image:`data:image/png;base64,${image}`});
    }catch(error) {
      const timeout=error instanceof Error && ['AbortError','TimeoutError'].includes(error.name);
      return json(timeout?504:500,{message:timeout?'La preparación tardó demasiado. La foto original sigue intacta; no se reintenta automáticamente.':'No se pudo procesar la foto. La original sigue intacta.'});
    }
  };
}
