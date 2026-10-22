import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validId,validateFrame,safeImageUrl,isPublicFrame,escapeHtml,isDraft} from './admin-model.ts';
import {removeWhite} from './photo-editor.ts';

const frame={id:'test-carey',name:'Test carey',shape:'Rectangular',color:'Carey',width:'131 mm',image:'./frames/test.png',dimensions:{widthMm:131,heightMm:33,templeMm:135}};
test('catalog IDs and physical measurements are validated independently',()=>{
  assert.ok(validId('bless-carey-black'));
  for(const id of ['','Aire','dos palabras','../test','<script>'])assert.equal(validId(id),false);
  assert.deepEqual(validateFrame(frame),[]);
  assert.ok(validateFrame({...frame,dimensions:{...frame.dimensions,widthMm:NaN}}).length);
  assert.ok(validateFrame({...frame,dimensions:{...frame.dimensions,lensHeightMm:500}}).length);
  assert.deepEqual(validateFrame({...frame,dimensions:{widthMm:142,templeMm:142,lensHeightMm:33}}),[]);
});
test('public/imported frames reject script URLs and malformed metadata',()=>{
  assert.ok(isPublicFrame(frame));
  for(const url of ['javascript:alert(1)','data:image/svg+xml,<svg/>','https-not-real','data:image/png;base64,abc" onerror="alert(1)'])assert.equal(safeImageUrl(url),false);
  assert.ok(safeImageUrl('https://example.com/image.png'));
  assert.ok(safeImageUrl('data:image/png;base64,YWJj'));
  assert.equal(isPublicFrame({...frame,width:123}),false);
  assert.equal(isPublicFrame({...frame,templeTexture:{x:0,y:0,width:1,height:1,quad:[{x:3,y:0}]}}),false);
  assert.equal(escapeHtml('<img src="x">'), '&lt;img src=&quot;x&quot;&gt;');
});
test('white removal changes alpha only and retains photographed RGB colors',()=>{
  const input=new Uint8ClampedArray([255,255,255,255, 140,90,60,255, 243,242,244,200, 200,230,240,255]);
  removeWhite(input,242);
  assert.deepEqual([...input],[255,255,255,0, 140,90,60,255, 243,242,244,0, 200,230,240,255]);
});

test('imported backup validates timestamp, ID and original photo URLs',()=>{
  const draft={id:frame.id,frame,status:'draft',updatedAt:'2026-10-22T15:00:00Z'};
  assert.ok(isDraft(draft));
  assert.equal(isDraft({...draft,id:'different'}),false);
  assert.equal(isDraft({...draft,updatedAt:'not a date'}),false);
  assert.equal(isDraft({...draft,originalFront:'javascript:alert(1)'}),false);
});
