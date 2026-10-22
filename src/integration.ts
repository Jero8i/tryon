/** Only catalog IDs and preset IDs cross the integration boundary. */
export function tryonUrl(base: string, frame: string, lens: string, parentOrigin: string) {
  const url=new URL('./tryon.html',base);
  url.searchParams.set('frame',frame);
  url.searchParams.set('lens',lens);
  url.searchParams.set('embed','1');
  url.searchParams.set('parentOrigin',parentOrigin);
  return url;
}

/** Copyable storefront HTML. The same public script powers admin previews. */
export function integrationSnippet(base:string,frame:string) {
  const url=new URL('./tryon.html',base);
  url.searchParams.set('frame',frame);url.searchParams.set('lens','clear');
  const script=new URL('./tryon-embed.js',base);
  const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  return `<a href="${escape(url.href)}" data-tryon>Probalo online</a>\n<script defer src="${escape(script.href)}"></script>`;
}
