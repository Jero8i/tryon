/** Product links identify a storefront page, independently of tracking/variants. */
export function normalizeProductUrl(value:string):string|undefined {
  try {
    const url=new URL(value);
    if(url.protocol!=='https:' || url.username || url.password)return;
    url.hash='';url.search='';
    url.pathname=url.pathname.replace(/\/+$/,'') || '/';
    return url.href;
  } catch {return;}
}

export function productUrlCandidates(value:string):string[] {
  const normalized=normalizeProductUrl(value);if(!normalized)return [];
  const url=new URL(normalized);
  const result=new Set<string>();
  for(const host of [url.hostname,url.hostname.startsWith('www.')?url.hostname.slice(4):'www.'+url.hostname]) {
    url.hostname=host;
    result.add(url.href);result.add(url.href.endsWith('/')?url.href.slice(0,-1):url.href+'/');
  }
  return [...result];
}

export function productLookupQuery(value:string) {
  const candidates=productUrlCandidates(value);
  if(!candidates.length)throw new Error('El enlace del producto debe ser una URL HTTPS válida.');
  return new URLSearchParams({select:'id',status:'eq.published',
    'payload->>productUrl':`in.(${candidates.map(url=>'"'+url.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"').join(',')})`,limit:'2'});
}
