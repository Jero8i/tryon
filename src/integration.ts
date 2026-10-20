/** Only catalog IDs and preset IDs cross the integration boundary. */
export function tryonUrl(base: string, frame: string, lens: string, parentOrigin: string) {
  const url=new URL('./tryon.html',base);
  url.searchParams.set('frame',frame);
  url.searchParams.set('lens',lens);
  url.searchParams.set('embed','1');
  url.searchParams.set('parentOrigin',parentOrigin);
  return url;
}
