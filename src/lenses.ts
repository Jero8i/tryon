export interface Bounds {x:number;y:number;width:number;height:number}
export const lensTypes = [
  {id:'clear',name:'Transparente',color:'#b8d7e6',opacity:.035},
  {id:'blue',name:'Reflejo azulado',color:'#a6bce8',opacity:.10},
  {id:'smoke',name:'Solar gris',color:'#20262c',opacity:.65},
  {id:'brown',name:'Solar marrón',color:'#67442d',opacity:.58},
  {id:'green',name:'Solar verde',color:'#294e40',opacity:.58},
  {id:'none',name:'Sin efecto de vidrio',color:'#ffffff',opacity:0}
];

/** Flood only the enclosed transparent openings; reject a leak to the exterior.
 * Coordinates and alpha are those of the original PNG, before any transforms. */
export function lensMask(rgba: Uint8ClampedArray, width:number,height:number,bounds:Bounds): Uint8ClampedArray | null {
  const size=width*height;
  if(width<1 || height<1 || rgba.length!==size*4) return null;
  const visited=new Uint8Array(size), mask=new Uint8ClampedArray(size);
  const queue=new Int32Array(size);
  let previousArea=0;
  for(const relativeX of [.25,.75]) {
    const sx=Math.round(bounds.x+bounds.width*relativeX),sy=Math.round(bounds.y+bounds.height*.5);
    if(sx<0||sx>=width||sy<0||sy>=height) return null;
    const seed=sy*width+sx;
    if(visited[seed] || rgba[seed*4+3]>96) return null;
    let head=0,tail=1,exterior=false;queue[0]=seed;visited[seed]=1;
    while(head<tail) {
      const index=queue[head++],x=index%width,y=Math.floor(index/width);
      if(x===0||y===0||x===width-1||y===height-1) exterior=true;
      mask[index]=255-rgba[index*4+3];
      for(const next of [x>0?index-1:-1,x<width-1?index+1:-1,y>0?index-width:-1,y<height-1?index+width:-1]) {
        if(next>=0 && !visited[next] && rgba[next*4+3]<=96) {visited[next]=1;queue[tail++]=next;}
      }
    }
    const area=tail;
    if(exterior || area<bounds.width*bounds.height*.025 || area>bounds.width*bounds.height*.48) return null;
    if(previousArea && Math.min(area,previousArea)/Math.max(area,previousArea)<.45) return null;
    previousArea=area;
  }
  return mask;
}

export function createLensMask(image:HTMLImageElement,bounds:Bounds) {
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  const alpha=lensMask(pixels.data,canvas.width,canvas.height,bounds);
  if(!alpha) return null;
  for(let i=0;i<alpha.length;i++) {pixels.data[i*4]=255;pixels.data[i*4+1]=255;pixels.data[i*4+2]=255;pixels.data[i*4+3]=alpha[i];}
  ctx.putImageData(pixels,0,0);
  return canvas;
}

/** Cached glass layer. It shares the frame's crop, yaw, roll and scale. */
export function glassLayer(mask:HTMLCanvasElement,bounds:Bounds,id:string) {
  const type=lensTypes.find(type=>type.id===id) ?? lensTypes[0];
  if(type.id==='none') return undefined;
  const canvas=document.createElement('canvas');canvas.width=mask.width;canvas.height=mask.height;
  const ctx=canvas.getContext('2d')!;
  ctx.globalAlpha=type.opacity;ctx.fillStyle=type.color;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
  // Low-contrast softbox reflection, not a painted opaque highlight.
  const reflection=ctx.createLinearGradient(bounds.x,bounds.y,bounds.x+bounds.width*.32,bounds.y+bounds.height);
  reflection.addColorStop(0,'rgba(255,255,255,.02)');
  reflection.addColorStop(.28,'rgba(255,255,255,.13)');
  reflection.addColorStop(.40,'rgba(255,255,255,.025)');
  reflection.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=reflection;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);
  return canvas;
}
