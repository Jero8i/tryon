import {test} from 'node:test';
import assert from 'node:assert/strict';
import {polygonError,contoursError,insidePolygon,applyCoverage} from './guided-cutout.ts';
const rect=(x,y,w,h)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
const outer=rect(.1,.2,.8,.6),left=rect(.17,.3,.25,.35),right=rect(.58,.3,.25,.35);

test('valid outer front and independent openings work in either drawing direction',()=>{
  assert.equal(contoursError([outer,left,right]),null);
  assert.equal(contoursError([[...outer].reverse(),[...left].reverse(),right]),null);
  assert.equal(insidePolygon({x:.5,y:.5},outer),true);
  assert.equal(insidePolygon({x:.01,y:.5},outer),false);
});
test('crossed, repeated, empty, out-of-range and degenerate contours are rejected',()=>{
  for(const points of [[],rect(0,0,0,0),[{x:0,y:0},{x:1,y:1},{x:1,y:0},{x:0,y:1}],rect(-.1,0,.5,.5),[{x:0,y:0},{x:.5,y:.5},{x:1,y:1}]])assert.ok(polygonError(points));
});
test('lens boundaries cannot escape, cross the outer rim or overlap each other',()=>{
  assert.ok(contoursError([outer,rect(.05,.3,.2,.2),right]));
  assert.ok(contoursError([outer,rect(.1,.3,.2,.2),right]));
  assert.ok(contoursError([outer,left,left]));
  assert.ok(contoursError([outer,rect(.2,.3,.4,.3),rect(.4,.4,.3,.2)]));
  assert.ok(contoursError([outer,rect(.2,.3,.4,.3),rect(.25,.35,.1,.1)]));
});
test('coverage keeps RGB exactly and multiplies existing alpha at smooth edges',()=>{
  const pixels=new Uint8ClampedArray([12,34,56,255, 70,80,90,180, 100,110,120,0, 130,140,150,255]);
  const mask=new Uint8ClampedArray([255,255,255,0, 255,255,255,128, 255,255,255,255, 255,255,255,255]);
  applyCoverage(pixels,mask);
  assert.deepEqual([...pixels],[12,34,56,0, 70,80,90,90, 100,110,120,0, 130,140,150,255]);
  assert.throws(()=>applyCoverage(pixels,new Uint8ClampedArray(4)));
});
test('retained rim and bridge are inside outer contour but outside both lens holes',()=>{
  const retained=p=>insidePolygon(p,outer)&&!insidePolygon(p,left)&&!insidePolygon(p,right);
  assert.equal(retained({x:.5,y:.5}),true);
  assert.equal(retained({x:.12,y:.4}),true);
  assert.equal(retained({x:.3,y:.4}),false);
  assert.equal(retained({x:.7,y:.4}),false);
  assert.equal(retained({x:.2,y:.1}),false);
});
