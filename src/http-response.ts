/** Writes with Prefer: return=minimal can succeed with 200/201/204 and no body.
 * Reads and authentication still require JSON, so broken responses aren't hidden. */
export async function readResponse<T>(response:Response,options:{allowEmpty?:boolean}={}):Promise<T> {
  const text=await response.text();
  let data:unknown;
  if(text.trim()) {
    try {data=JSON.parse(text);}catch {
      throw new Error(response.ok?'El servicio devolvió una respuesta JSON no válida.':`Error del servicio (${response.status}).`);
    }
  }
  if(!response.ok) {
    const error=data && typeof data==='object'?data as Record<string,unknown>:{};
    const message=[error.message,error.error_description,error.msg,error.error].find(value=>typeof value==='string'&&value.length>0);
    throw new Error(typeof message==='string'?message:`Error del servicio (${response.status}).`);
  }
  if(!text.trim()&&!options.allowEmpty)throw new Error('El servicio devolvió una respuesta vacía cuando se esperaban datos.');
  return data as T;
}
