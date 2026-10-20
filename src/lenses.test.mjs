import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {lensMask} from './lenses.ts';

// Read-only decoder for our 8-bit RGBA PNG fixtures; no image mutation.
function readPng(file) {
  const bytes=readFileSync(new URL(file,import.meta.url));let offset=8,width,height;const chunks=[];
  while(offset<bytes.length) {
    const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8),data=bytes.subarray(offset+8,offset+8+length);
    if(type==='IHDR') {width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert.equal(data[9],6);assert.equal(data[12],0);}
    if(type==='IDAT') chunks.push(data);
    offset+=length+12;
  }
  const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,rgba=new Uint8ClampedArray(width*height*4);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++) {
    const filter=raw[y*(stride+1)];assert.ok(filter<=4);
    for(let x=0;x<stride;x++) {
      const index=y*stride+x,a=x>=4?rgba[index-4]:0,b=y?rgba[index-stride]:0,c=y&&x>=4?rgba[index-stride-4]:0;
      const correction=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
      rgba[index]=(raw[y*(stride+1)+1+x]+correction)&255;
    }
  }
  let x0=width,y0=height,x1=0,y1=0;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) if(rgba[(y*width+x)*4+3]>=128){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  return {rgba,width,height,bounds:{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1}};
}

for(const file of ['verdant-front-color-v2.png','nika-brown-front.png','bless-carey-black-front-color-v2.png']) {
  test(`lens mask fits both enclosed openings of ${file}`,()=>{
    const {rgba,width,height,bounds}=readPng('../public/frames/'+file);
    const mask=lensMask(rgba,width,height,bounds);assert.ok(mask,'both openings must be enclosed');
    let filled=0;
    for(let i=0;i<mask.length;i++) if(mask[i]) {
      filled++;assert.ok(rgba[i*4+3]<=96,'no opaque frame pixels may be tinted');
      assert.ok(i%width>0 && i%width<width-1 && i>=width && i<width*(height-1),'mask must not reach outside');
    }
    assert.ok(filled>bounds.width*bounds.height*.05);
    assert.equal(mask[0],0);
  });
}

test('open or opaque images disable glass instead of tinting the background',()=>{
  assert.equal(lensMask(new Uint8ClampedArray(40*20*4),40,20,{x:0,y:0,width:40,height:20}),null);
  assert.equal(lensMask(new Uint8ClampedArray(40*20*4).fill(255),40,20,{x:0,y:0,width:40,height:20}),null);
});
