/** Project physical frame dimensions using a known binocular distance PD.
 * Valid for a frontal face, with frame and iris planes approximated as coplanar.
 * This does not measure the user's PD or guarantee a physical fit.
 */
export function projectedSize(irisDistancePx: number, pdMm: number, widthMm: number, heightMm: number) {
  if (![irisDistancePx, pdMm, widthMm, heightMm].every(value => Number.isFinite(value) && value > 0)) return null;
  const pixelsPerMm = irisDistancePx / pdMm;
  return {width: widthMm * pixelsPerMm, height: heightMm * pixelsPerMm};
}

type EyePoint = {x:number;y:number};
/** Population reference, not the individual's measured iris diameter.
 * https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/iris.md */
export function estimatePd(points: EyePoint[], width: number, height: number, yaw: number): number | null {
  if (Math.abs(yaw)>.18 || ![width,height,yaw].every(Number.isFinite) || width<=0 || height<=0) return null;
  const required=[468,469,470,471,472,473,474,475,476,477,159,145,386,374];
  if (required.some(i=>!points[i] || !Number.isFinite(points[i].x) || !Number.isFinite(points[i].y))) return null;
  const distance=(a:number,b:number)=>Math.hypot((points[a].x-points[b].x)*width,(points[a].y-points[b].y)*height);
  const left=Math.max(distance(469,471),distance(470,472));
  const right=Math.max(distance(474,476),distance(475,477));
  if (Math.min(left,right)<6 || Math.min(left,right)/Math.max(left,right)<.8) return null;
  if (distance(159,145)<left*.35 || distance(386,374)<right*.35) return null;
  const pd=distance(468,473)/Math.cos(yaw)*11.7/((left+right)/2);
  return Number.isFinite(pd) && pd>=40 && pd<=80 ? pd : null;
}

export class AutoPd {
  private samples: number[]=[];
  value: number | null=null;
  reset() {this.samples=[];this.value=null;}
  add(sample: number | null) {
    if(sample===null) {this.samples=[];return this.value;}
    this.samples.push(sample);
    if(this.samples.length>24) this.samples.shift();
    if(this.samples.length===24) {
      const sorted=[...this.samples].sort((a,b)=>a-b);
      const median=(sorted[11]+sorted[12])/2;
      if(sorted[22]-sorted[1]<median*.06) this.value=this.value===null ? median : this.value*.95+median*.05;
    }
    return this.value;
  }
}

/** Lens height is not frame height. When total height is unknown, preserve the
 * cropped frontal photo's proportions instead of using the lens measurement. */
export function frameRatio(widthMm: number, heightMm: number | undefined, imageRatio: number) {
  return heightMm !== undefined && heightMm > 0 ? heightMm/widthMm : imageRatio;
}
