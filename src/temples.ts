export interface Landmark { x: number; y: number; z: number }
export interface Rect { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }
export type Quad = [Point, Point, Point, Point];

/** Older uploads sometimes marked bottom hinge before bottom rear.
 * Keep the two explicitly marked top points; repair a crossed bottom edge. */
export function normalizeTempleQuad(quad:Quad):Quad {
  const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const intersects=(a:Point,b:Point,c:Point,d:Point)=>cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0;
  if(intersects(quad[1],quad[2],quad[3],quad[0]) || intersects(quad[0],quad[1],quad[2],quad[3]))
    return [quad[0],quad[1],quad[3],quad[2]];
  return quad;
}

/** Top hinge, top rear, bottom rear, bottom hinge, in source-photo pixels. */
export function stripSection(quad: Quad, fraction: number): Quad {
  const t=Math.max(0,Math.min(1,fraction));
  const lerp=(a: Point,b: Point): Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  return [quad[0],lerp(quad[0],quad[1]),lerp(quad[3],quad[2]),quad[3]];
}

/** Relative widths measured perpendicular to the photographed temple's axis.
 * Preserve its own taper instead of inventing one at render time. */
export function templeProfile(quad?:Quad):{start:number;end:number} {
  if(!quad)return {start:1,end:1};
  const startCenter={x:(quad[0].x+quad[3].x)/2,y:(quad[0].y+quad[3].y)/2};
  const endCenter={x:(quad[1].x+quad[2].x)/2,y:(quad[1].y+quad[2].y)/2};
  const dx=endCenter.x-startCenter.x,dy=endCenter.y-startCenter.y,length=Math.hypot(dx,dy);
  if(length<1e-6)return {start:1,end:1};
  const thickness=(a:Point,b:Point)=>Math.abs((b.x-a.x)*(-dy/length)+(b.y-a.y)*(dx/length));
  const first=thickness(quad[0],quad[3]),last=thickness(quad[1],quad[2]),mean=(first+last)/2;
  if(mean<1e-6)return {start:1,end:1};
  return {start:first/mean,end:last/mean};
}

/** Side-view vertical scale is approximately shared by the rim and hinge.
 * Use only a cleaned photo's product bounds, never the white photo padding. */
export function photoTempleHeight(quad:Quad,productHeight:number,frameHeightRatio:number):number|undefined {
  const q=normalizeTempleQuad(quad);
  const hingeHeight=Math.abs(q[3].y-q[0].y);
  const ratio=hingeHeight/productHeight*frameHeightRatio;
  return Number.isFinite(ratio)&&productHeight>0&&ratio>0&&ratio<frameHeightRatio ? ratio : undefined;
}

/** Aim at the upper side of the face, allowing pitch without following the cheek. */
export function templeEndY(hingeY:number,earY:number|undefined,height:number) {
  return earY===undefined ? hingeY : hingeY+Math.max(-height*.45,Math.min(height*.45,earY-hingeY));
}

/** Camera-space z grows away from the viewer. Input is unmirrored video. */
export function headYaw(left: Landmark, right: Landmark, width: number, height: number) {
  const horizontal = Math.hypot((right.x-left.x)*width,(right.y-left.y)*height);
  if (!Number.isFinite(horizontal) || horizontal < 1) return 0;
  const yaw = Math.atan2((right.z-left.z)*width,horizontal);
  return Number.isFinite(yaw) ? Math.max(-1.15,Math.min(1.15,yaw)) : 0;
}

export function unprojectWidth(projected: number, yaw: number) {
  return projected / Math.max(0.4,Math.cos(yaw));
}

export function nearTemple(yaw: number): -1 | 0 | 1 {
  return Math.abs(yaw) < 0.055 ? 0 : yaw > 0 ? -1 : 1;
}

/** Weak perspective for moderate turns. Front and temple share one coordinate system. */
export function project(x: number, y: number, z: number, yaw: number): Point {
  return {x:x*Math.cos(yaw)-z*Math.sin(yaw), y};
}

function triangle(ctx: CanvasRenderingContext2D, img: HTMLImageElement, source: Point[], target: Point[]) {
  const [a,b,c] = source, [p,q,r] = target;
  const determinant=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
  if (Math.abs(determinant)<1e-6) return;
  const m11=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/determinant;
  const m12=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/determinant;
  const m21=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/determinant;
  const m22=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/determinant;
  ctx.save(); ctx.beginPath(); ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.closePath();ctx.clip();
  ctx.transform(m11,m12,m21,m22,p.x-m11*a.x-m21*a.y,p.y-m12*a.x-m22*a.y);
  ctx.drawImage(img,0,0);ctx.restore();
}

export function texturedQuad(ctx: CanvasRenderingContext2D,img: HTMLImageElement,rect: Rect,points: Point[],photoQuad?: Quad) {
  const source=photoQuad ?? [{x:rect.x,y:rect.y},{x:rect.x+rect.width,y:rect.y},{x:rect.x+rect.width,y:rect.y+rect.height},{x:rect.x,y:rect.y+rect.height}];
  // Rectify the photograph's perspective before projecting it onto the head.
  // A single diagonal stretches logos and grain differently on either side.
  const map=(quad:Point[],u:number,v:number):Point=>{
    const [a,b,c,d]=quad;
    const dx=a.x-b.x+c.x-d.x,dy=a.y-b.y+c.y-d.y;
    const bx=b.x-c.x,by=b.y-c.y,cx=d.x-c.x,cy=d.y-c.y;
    const determinant=bx*cy-cx*by;
    const g=Math.abs(determinant)>1e-8?(dx*cy-cx*dy)/determinant:0;
    const h=Math.abs(determinant)>1e-8?(bx*dy-dx*by)/determinant:0;
    const denominator=1+g*u+h*v;
    return {x:(a.x+(b.x-a.x+g*b.x)*u+(d.x-a.x+h*d.x)*v)/denominator,
      y:(a.y+(b.y-a.y+g*b.y)*u+(d.y-a.y+h*d.y)*v)/denominator};
  };
  const segments=12;
  for(let i=0;i<segments;i++) {
    const u=i/segments,next=(i+1)/segments;
    const s=[map(source,u,0),map(source,next,0),map(source,next,1),map(source,u,1)];
    const t=[map(points,u,0),map(points,next,0),map(points,next,1),map(points,u,1)];
    triangle(ctx,img,[s[0],s[1],s[2]],[t[0],t[1],t[2]]);
    triangle(ctx,img,[s[0],s[2],s[3]],[t[0],t[2],t[3]]);
  }
}

export interface TempleOptions {
  width: number; height: number; anchorY: number; yaw: number;
  templeLengthRatio: number; source: Rect;
  photoQuad?: Quad;
  hingeHeightFraction?: number;
  /** Measured vertical height at the hinge, divided by the front frame width. */
  templeHeightRatio?: number;
  /** Ear-area estimate in frame-local coordinates; rear hook is hidden at this point. */
  ear?: Point;
}

export function drawTemple(ctx: CanvasRenderingContext2D, img: HTMLImageElement, options: TempleOptions) {
  // Repair persisted source markers before measuring taper or rectifying the photo.
  if(options.photoQuad)options={...options,photoQuad:normalizeTempleQuad(options.photoQuad)};
  const side=nearTemple(options.yaw);
  if (!side) return;
  const {width,height,anchorY,yaw,templeLengthRatio,source,ear}=options;
  const length=width*templeLengthRatio;
  const hingeX=side*width*.485, hingeY=-height*anchorY+height*(options.hingeHeightFraction ?? .27);
  const hinge=project(hingeX,hingeY,0,yaw);
  // Only expose the segment before the estimated ear; never draw the far temple through the face.
  const fullEnd=project(hingeX,hingeY,length,yaw);
  const visibleFraction=ear && Math.abs(fullEnd.x-hinge.x)>1
    ? Math.max(0,Math.min(.92,(ear.x-hinge.x)/(fullEnd.x-hinge.x))) : .78;
  if (visibleFraction<.015) return;
  const endZ=length*visibleFraction;
  const end=project(hingeX,hingeY,endZ,yaw);
  // Straight acetate section. Hidden hook remains behind the head.
  const profile=templeProfile(options.photoQuad);
  const thickness=options.templeHeightRatio ? width*options.templeHeightRatio : height*.105*profile.start;
  const endThickness=profile.start>1e-6 ? thickness*(1+(profile.end/profile.start-1)*visibleFraction) : thickness;
  const endY=templeEndY(hingeY,ear?.y,height);
  ctx.save();
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  // Keep the photograph's own alpha, without mixing solid acetate into skin.
  // Visibility is controlled geometrically, rather than by recoloring via a fade.
  ctx.globalAlpha=1;
  texturedQuad(ctx,img,{x:source.x,y:source.y,width:source.width*visibleFraction,height:source.height},[
    {x:hinge.x,y:hinge.y-thickness/2},{x:end.x,y:endY-endThickness/2},
    {x:end.x,y:endY+endThickness/2},{x:hinge.x,y:hinge.y+thickness/2}
  ],options.photoQuad ? stripSection(options.photoQuad,visibleFraction) : undefined);
  ctx.restore();
}
