import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectedSize, frameRatio, estimatePd, AutoPd} from './fit.ts';

test('148 × 52 mm projects through known PD and follows distance to camera', () => {
  assert.deepEqual(projectedSize(128,64,148,52),{width:296,height:104});
  assert.deepEqual(projectedSize(64,64,148,52),{width:148,height:52});
  assert.deepEqual(projectedSize(128,64,140,50),{width:280,height:100});
});
test('no physical scale is inferred from missing or invalid reference', () => {
  assert.equal(projectedSize(0,64,148,52),null);
  assert.equal(projectedSize(128,NaN,148,52),null);
});

function face(multiplier=1) {
  const points=Array.from({length:478},()=>({x:0,y:0}));
  for(const [center,cx] of [[468,.4],[473,.528]]) {
    points[center]={x:cx,y:.4};
    for(const [index,dx,dy] of [[1,-.0117,0],[2,0,-.0117],[3,.0117,0],[4,0,.0117]]) points[center+index]={x:cx+dx*multiplier,y:.4+dy*multiplier};
  }
  points[159]={x:.4,y:.39};points[145]={x:.4,y:.41};
  points[386]={x:.528,y:.39};points[374]={x:.528,y:.41};
  return points;
}
test('automatic PD uses iris reference, rejects turns, low resolution and closed eyes',()=>{
  assert.ok(Math.abs(estimatePd(face(),1000,1000,0)-64)<1e-8);
  assert.ok(Math.abs(estimatePd(face(),500,500,0)-64)<1e-8);
  assert.equal(estimatePd(face(),1000,1000,.4),null);
  assert.equal(estimatePd(face(),100,100,0),null);
  assert.equal(estimatePd([],1000,1000,0),null);
  const closed=face();closed[145]=closed[159];assert.equal(estimatePd(closed,1000,1000,0),null);
});
test('calibration requires stable consecutive samples and clears for a new face',()=>{
  const pd=new AutoPd();
  for(let i=0;i<23;i++) assert.equal(pd.add(64),null);
  assert.equal(pd.add(64),64);
  assert.equal(pd.add(null),64);
  pd.reset();assert.equal(pd.value,null);
  for(let i=0;i<48;i++) pd.add(i%2 ? 50:75);
  assert.equal(pd.value,null);
});

test('Nika retains cropped photo proportions when only lens height is known',()=>{
  assert.equal(frameRatio(142,undefined,.37),.37);
  assert.equal(frameRatio(148,52,.37),52/148);
  assert.deepEqual(projectedSize(64,64,142,142*frameRatio(142,undefined,.37)),{width:142,height:142*.37});
});
