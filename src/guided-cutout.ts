export interface CutPoint {x:number;y:number}
export type FrontContours=[CutPoint[],CutPoint[],CutPoint[]];
const cross=(a:CutPoint,b:CutPoint,c:CutPoint)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function onSegment(a:CutPoint,b:CutPoint,p:CutPoint) {
  return Math.abs(cross(a,b,p))<1e-9&&p.x>=Math.min(a.x,b.x)-1e-9&&p.x<=Math.max(a.x,b.x)+1e-9&&p.y>=Math.min(a.y,b.y)-1e-9&&p.y<=Math.max(a.y,b.y)+1e-9;
}
function intersects(a:CutPoint,b:CutPoint,c:CutPoint,d:CutPoint) {
  return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0 || onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b);
}
export function insidePolygon(point:CutPoint,polygon:CutPoint[]) {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j];
    if(onSegment(a,b,point))return true;
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function polygonError(points:CutPoint[]):string|null {
  if(points.length<3)return 'Marcá al menos tres puntos para cerrar el contorno.';
  if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))return 'Los puntos deben estar dentro de la foto.';
  let area=0;
  for(let i=0;i<points.length;i++) {
    const next=(i+1)%points.length;
    if(Math.hypot(points[i].x-points[next].x,points[i].y-points[next].y)<1e-6)return 'Hay puntos repetidos. Quitá el último punto.';
    area+=points[i].x*points[next].y-points[next].x*points[i].y;
    for(let j=i+1;j<points.length;j++) {
      const after=(j+1)%points.length;
      if(next===j||after===i)continue;
      if(intersects(points[i],points[next],points[j],points[after]))return 'El contorno se cruza. Deshacé puntos y seguí el borde en orden.';
    }
  }
  return Math.abs(area)<.00001?'El contorno es demasiado pequeño.':null;
}
function polygonsTouch(a:CutPoint[],b:CutPoint[]) {
  return a.some((p,i)=>b.some((q,j)=>intersects(p,a[(i+1)%a.length],q,b[(j+1)%b.length])));
}
export function contoursError(contours:FrontContours):string|null {
  for(let i=0;i<3;i++){const error=polygonError(contours[i]);if(error)return `${['Frente','Cristal izquierdo','Cristal derecho'][i]}: ${error}`;}
  const [outer,left,right]=contours;
  for(const hole of [left,right])if(!hole.every(p=>insidePolygon(p,outer))||polygonsTouch(outer,hole))return 'Cada abertura debe estar completamente dentro del frente, sin tocar su borde exterior.';
  if(polygonsTouch(left,right)||insidePolygon(left[0],right)||insidePolygon(right[0],left))return 'Las dos aberturas no pueden superponerse ni tocarse.';
  return null;
}
/** Modify alpha only, including antialiased coverage; photographed RGB is untouched. */
export function applyCoverage(pixels:Uint8ClampedArray,mask:Uint8ClampedArray) {
  if(pixels.length!==mask.length)throw new Error('La máscara no coincide con el tamaño de la foto.');
  for(let i=3;i<pixels.length;i+=4)pixels[i]=Math.round(pixels[i]*mask[i]/255);
}
