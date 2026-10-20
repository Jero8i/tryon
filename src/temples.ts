export interface Landmark { x: number; y: number; z: number }
export interface Rect { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }
export type Quad = [Point, Point, Point, Point];

/** Top hinge, top rear, bottom rear, bottom hinge, in source-photo pixels. */
export function stripSection(quad: Quad, fraction: number): Quad {
  const t=Math.max(0,Math.min(1,fraction));
  const lerp=(a: Point,b: Point): Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  return [quad[0],lerp(quad[0],quad[1]),lerp(quad[3],quad[2]),quad[3]];
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
  triangle(ctx,img,[source[0],source[1],source[2]],[points[0],points[1],points[2]]);
  triangle(ctx,img,[source[0],source[2],source[3]],[points[0],points[2],points[3]]);
}

export interface TempleOptions {
  width: number; height: number; anchorY: number; yaw: number;
  templeLengthRatio: number; source: Rect;
  photoQuad?: Quad;
  hingeHeightFraction?: number;
  /** Ear-area estimate in frame-local coordinates; rear hook is hidden at this point. */
  ear?: Point;
}

export function drawTemple(ctx: CanvasRenderingContext2D, img: HTMLImageElement, options: TempleOptions) {
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
  const thickness=height*.105;
  const endThickness=thickness*(1-.35*visibleFraction);
  const endY=ear ? hingeY+Math.max(-height*.13,Math.min(height*.16,ear.y-hingeY)) : hingeY;
  ctx.save();
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  // Soft transition near frontal pose avoids a side-switch pop.
  ctx.globalAlpha*=Math.min(1,(Math.abs(yaw)-.055)/.12);
  texturedQuad(ctx,img,{x:source.x,y:source.y,width:source.width*visibleFraction,height:source.height},[
    {x:hinge.x,y:hinge.y-thickness/2},{x:end.x,y:endY-endThickness/2},
    {x:end.x,y:endY+endThickness/2},{x:hinge.x,y:hinge.y+thickness/2}
  ],options.photoQuad ? stripSection(options.photoQuad,visibleFraction) : undefined);
  ctx.restore();
}
