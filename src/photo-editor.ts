export function removeWhite(data:Uint8ClampedArray,threshold:number) {
  for(let i=0;i<data.length;i+=4)if(Math.min(data[i],data[i+1],data[i+2])>=threshold)data[i+3]=0;
}

export class PhotoEditor {
  canvas:HTMLCanvasElement;
  private context:CanvasRenderingContext2D;
  private history:ImageData[]=[];
  private markers:HTMLDivElement;
  private surface:HTMLDivElement;
  private zoom:HTMLSelectElement;
  private erasing=false;
  private drawing=false;
  private last:{x:number;y:number}|undefined;
  data='';
  onChange=()=>{};
  onPoint:((x:number,y:number)=>void)|undefined;

  constructor(container:HTMLElement,label:string) {
    container.innerHTML=`<div class="photo-toolbar"><strong>${label}</strong><label class="photo-zoom">Zoom <select aria-label="Zoom de ${label}"><option value="100">100%</option><option value="150">150%</option><option value="200">200%</option><option value="300">300%</option></select></label><button type="button" data-action="undo">Deshacer</button><button type="button" data-action="white">Quitar blanco</button></div><div class="photo-canvas"><div class="photo-surface"><canvas aria-label="${label}" tabindex="0"></canvas><div class="photo-markers"></div></div></div><label class="brush"><input type="checkbox" data-action="erase"> Borrador manual <input type="range" min="3" max="70" value="20" aria-label="Diámetro del borrador"></label><p class="hint">Cargá el PNG preparado con tu prompt. Usá el zoom y el borrador para retoques; Deshacer revierte hasta cuatro operaciones. Quitar blanco puede borrar brillos claros.</p>`;
    this.canvas=container.querySelector('canvas')!;this.canvas.width=1000;this.canvas.height=500;
    this.surface=container.querySelector('.photo-surface')!;
    this.markers=container.querySelector('.photo-markers')!;
    this.zoom=container.querySelector('select')!;
    this.zoom.onchange=()=>{this.surface.style.width=this.zoom.value+'%';};
    this.context=this.canvas.getContext('2d',{willReadFrequently:true})!;
    container.querySelector<HTMLInputElement>('[data-action="erase"]')!.onchange=event=>{
      this.erasing=(event.target as HTMLInputElement).checked;
      if(this.erasing)this.onPoint=undefined;
      this.canvas.style.touchAction=this.erasing?'none':'auto';
      this.canvas.style.cursor=this.erasing?'crosshair':'default';
    };
    container.querySelector<HTMLButtonElement>('[data-action="undo"]')!.onclick=()=>{const old=this.history.pop();if(old){this.context.putImageData(old,0,0);this.changed();}};
    container.querySelector<HTMLButtonElement>('[data-action="white"]')!.onclick=()=>{
      if(!this.data)return;this.remember();const image=this.context.getImageData(0,0,this.canvas.width,this.canvas.height);removeWhite(image.data,242);this.context.putImageData(image,0,0);this.changed();
    };
    const point=(event:PointerEvent)=>{const rect=this.canvas.getBoundingClientRect();return {x:(event.clientX-rect.left)*this.canvas.width/rect.width,y:(event.clientY-rect.top)*this.canvas.height/rect.height};};
    this.canvas.onpointerdown=event=>{
      if(!this.data)return;
      const p=point(event);
      if(this.onPoint){event.preventDefault();this.onPoint(p.x/this.canvas.width,p.y/this.canvas.height);return;}
      if(!this.erasing)return;
      event.preventDefault();this.remember();this.drawing=true;this.last=p;this.canvas.setPointerCapture(event.pointerId);this.erase(p,Number(container.querySelector<HTMLInputElement>('input[type="range"]')!.value));
    };
    this.canvas.onpointermove=event=>{if(this.drawing){event.preventDefault();this.erase(point(event),Number(container.querySelector<HTMLInputElement>('input[type="range"]')!.value));}};
    const end=()=>{if(this.drawing){this.drawing=false;this.last=undefined;this.changed();}};
    this.canvas.onpointerup=end;this.canvas.onpointercancel=end;
  }
  private erase(p:{x:number;y:number},diameter:number) {
    const rect=this.canvas.getBoundingClientRect();const size=diameter*this.canvas.width/Math.max(1,rect.width);
    this.context.save();this.context.globalCompositeOperation='destination-out';this.context.lineCap='round';this.context.lineWidth=size;
    this.context.beginPath();this.context.moveTo(this.last?.x ?? p.x,this.last?.y ?? p.y);this.context.lineTo(p.x+.01,p.y);this.context.stroke();this.context.restore();this.last=p;
  }
  private remember() {this.history.push(this.context.getImageData(0,0,this.canvas.width,this.canvas.height));if(this.history.length>4)this.history.shift();}
  private changed() {this.data=this.canvas.toDataURL('image/png');this.onChange();}
  async load(url:string) {
    const image=new Image();image.crossOrigin='anonymous';image.src=url;await image.decode();
    if(image.naturalWidth*image.naturalHeight>16_000_000)throw new Error('La foto es demasiado grande. Usá hasta 16 megapíxeles.');
    this.canvas.width=image.naturalWidth;this.canvas.height=image.naturalHeight;this.context.drawImage(image,0,0);this.history=[];this.drawing=false;this.last=undefined;this.onPoint=undefined;this.setMarkers([]);this.changed();
  }
  clear() {this.context.clearRect(0,0,this.canvas.width,this.canvas.height);this.data='';this.history=[];this.drawing=false;this.last=undefined;this.onPoint=undefined;this.zoom.value='100';this.surface.style.width='100%';this.setMarkers([]);}
  setMarkers(points:{x:number;y:number}[]) {
    this.markers.replaceChildren();
    points.forEach((p,index)=>{const dot=document.createElement('span');dot.textContent=String(index+1);dot.style.left=`${p.x*100}%`;dot.style.top=`${p.y*100}%`;this.markers.append(dot);});
  }
}
