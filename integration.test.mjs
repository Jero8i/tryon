import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tryonUrl} from './integration.ts';

test('modal URL preserves GitHub Pages repository prefix and selected parameters',()=>{
  const url=tryonUrl('https://jero8i.github.io/tryon/?frame=old','nika-brown','brown','https://jero8i.github.io');
  assert.equal(url.pathname,'/tryon/tryon.html');
  assert.equal(url.searchParams.get('frame'),'nika-brown');
  assert.equal(url.searchParams.get('lens'),'brown');
  assert.equal(url.searchParams.get('embed'),'1');
  assert.equal(url.searchParams.get('parentOrigin'),'https://jero8i.github.io');
});
test('modal URL works from a root-domain store or index.html',()=>{
  assert.equal(tryonUrl('https://shop.example/index.html','verdant','clear','https://shop.example').pathname,'/tryon.html');
  assert.equal(tryonUrl('https://shop.example/demo/index.html','verdant','clear','https://shop.example').pathname,'/demo/tryon.html');
});
