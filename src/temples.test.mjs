import {test} from 'node:test';
import assert from 'node:assert/strict';
import {headYaw,unprojectWidth,nearTemple,project,drawTemple,stripSection,templeProfile,normalizeTempleQuad,photoTempleHeight,templeEndY} from './temples.ts';

test('yaw uses unmirrored camera depth and selects only the nearer temple',()=>{
  const left={x:.3,y:.4,z:0}, right={x:.7,y:.4,z:0};
  assert.equal(headYaw(left,right,1000,800),0);
  assert.equal(nearTemple(0),0);
  assert.equal(nearTemple(headYaw(left,{...right,z:.2},1000,800)),-1);
  assert.equal(nearTemple(headYaw(left,{...right,z:-.2},1000,800)),1);
  assert.equal(headYaw(left,left,1000,800),0);
});

test('width correction preserves scale and height during moderate head turns',()=>{
  for (const yaw of [-.7,-.3,0,.3,.7]) {
    const observed=148*Math.cos(yaw);
    assert.ok(Math.abs(unprojectWidth(observed,yaw)-148)<1e-9);
    const hinge=project(74,-10,0,yaw), end=project(74,-10,140,yaw);
    assert.equal(hinge.y,end.y);
    assert.ok(Math.abs((end.x-hinge.x)+140*Math.sin(yaw))<1e-9);
  }
});

function context() {
  const vertices=[]; let draws=0;
  return {vertices,get draws(){return draws;},globalAlpha:1,
    save(){},restore(){},beginPath(){},closePath(){},clip(){},transform(){},
    moveTo(x,y){vertices.push({x,y});},lineTo(x,y){vertices.push({x,y});},drawImage(){draws++;}};
}
const options={width:296,height:104,anchorY:.47,templeLengthRatio:140/148,source:{x:1185,y:437,width:308,height:53}};
test('front pose hides temples, moderate turns reveal one bounded segment on either side',()=>{
  const front=context();drawTemple(front,{}, {...options,yaw:0}); assert.equal(front.draws,0);
  for (const yaw of [-.5,.5]) {
    const side=nearTemple(yaw), hinge=project(side*296*.485,0,0,yaw);
    const ear={x:hinge.x-Math.sign(yaw)*45,y:0};
    const ctx=context();drawTemple(ctx,{}, {...options,yaw,ear});
    assert.equal(ctx.draws,24);
    for (const p of ctx.vertices) {
      assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
      assert.ok(p.x>=Math.min(hinge.x,ear.x)-1e-6&&p.x<=Math.max(hinge.x,ear.x)+1e-6);
    }
  }
});
test('temple beyond occlusion boundary is not drawn through face',()=>{
  const ctx=context();
  drawTemple(ctx,{}, {...options,yaw:.5,ear:{x:0,y:0}});
  assert.equal(ctx.draws,0);
});

test('diagonal photo strip preserves the hinge and crops both edges at the same physical fraction',()=>{
  const quad=[{x:100,y:50},{x:300,y:20},{x:300,y:40},{x:100,y:90}];
  assert.deepEqual(stripSection(quad,.5),[{x:100,y:50},{x:200,y:35},{x:200,y:65},{x:100,y:90}]);
  assert.deepEqual(stripSection(quad,2),quad);
  assert.deepEqual(stripSection(quad,-1),[quad[0],quad[0],quad[3],quad[3]]);
});

test('photo strip renderer enables smoothing and retains both head-turn directions',()=>{
  for(const yaw of [-.5,.5]) {
    const ctx=context();
    drawTemple(ctx,{}, {...options,yaw,photoQuad:[{x:1185,y:437},{x:1493,y:410},{x:1493,y:450},{x:1185,y:490}]});
    assert.equal(ctx.draws,24);
    assert.equal(ctx.imageSmoothingEnabled,true);
    assert.equal(ctx.imageSmoothingQuality,'high');
  }
});

test('solid photographic acetate is not faded into skin during head turns',()=>{
  for(const yaw of [-.1,.1,-.5,.5]) {
    const ctx=context();ctx.globalAlpha=.3;
    drawTemple(ctx,{}, {...options,yaw});
    assert.equal(ctx.globalAlpha,1);
  }
});
test('temple taper follows the photo, including straight or widening profiles',()=>{
  assert.deepEqual(templeProfile(),{start:1,end:1});
  assert.deepEqual(templeProfile([{x:0,y:0},{x:100,y:0},{x:100,y:10},{x:0,y:10}]),{start:1,end:1});
  const tapered=templeProfile([{x:0,y:-10},{x:100,y:-5},{x:100,y:5},{x:0,y:10}]);
  assert.ok(Math.abs(tapered.start/tapered.end-2)<1e-9);
  const widening=templeProfile([{x:0,y:-5},{x:100,y:-10},{x:100,y:10},{x:0,y:5}]);
  assert.ok(widening.end>widening.start);
});

 test('measured temple height sets thickness independently of frame height',()=>{
 const ctx=context();
 drawTemple(ctx,{}, {...options,yaw:.5,templeHeightRatio:8/148});
 const vertices=ctx.vertices.filter(p=>Math.abs(p.x-project(-296*.485,0,0,.5).x)<1e-6);
 assert.ok(vertices.length>=2);
 assert.ok(Math.abs(Math.max(...vertices.map(p=>p.y))-Math.min(...vertices.map(p=>p.y))-16)<1e-6);
 });


test('repairs crossed lower markers from published catalog without changing correct quads',()=>{
  const cases=[
    [{x:.6976,y:.3959},{x:.8601,y:.4364},{x:.6968,y:.5074},{x:.8447,y:.4719}],
    [{x:.6879,y:.4107},{x:.8853,y:.3579},{x:.6968,y:.5211},{x:.8829,y:.4119}]
  ];
  for(const quad of cases){
    const expected=[quad[0],quad[1],quad[3],quad[2]];
    assert.deepEqual(normalizeTempleQuad(quad),expected);
    assert.deepEqual(normalizeTempleQuad(expected),expected);
    for(const yaw of [-.5,.5]){
      const repaired=context(),correct=context();
      drawTemple(repaired,{}, {...options,yaw,photoQuad:quad});
      drawTemple(correct,{}, {...options,yaw,photoQuad:expected});
      assert.deepEqual(repaired.vertices,correct.vertices);
      assert.equal(repaired.draws,correct.draws);
    }
  }
});


test('photo height uses product scale and repairs crossed source markers',()=>{
 const q=[{x:100,y:50},{x:300,y:70},{x:300,y:90},{x:100,y:90}];
 assert.equal(photoTempleHeight(q,400,50/150),40/400*(50/150));
 assert.equal(photoTempleHeight([q[0],q[1],q[3],q[2]],400,50/150),photoTempleHeight(q,400,50/150));
 assert.equal(photoTempleHeight(q,0,50/150),undefined);
});
test('arm can follow upper side height in both directions while bounding outliers',()=>{
 assert.equal(templeEndY(-10,-40,100),-40);
 assert.equal(templeEndY(-10,20,100),20);
 assert.equal(templeEndY(-10,1000,100),35);
 assert.equal(templeEndY(-10,-1000,100),-55);
 assert.equal(templeEndY(-10,undefined,100),-10);
});
