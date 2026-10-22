import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tryonUrl,integrationSnippet} from './integration.ts';

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

test('admin integration code opens the requested published product, not the private landing',()=>{
  const snippet=integrationSnippet('https://jero8i.github.io/tryon/','bless-carey-black-1r23r');
  const href=snippet.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&');
  const url=new URL(href);
  assert.equal(url.pathname,'/tryon/tryon.html');
  assert.equal(url.searchParams.get('frame'),'bless-carey-black-1r23r');
  assert.equal(url.searchParams.get('lens'),'clear');
  assert.ok(snippet.includes('data-tryon'));
  assert.ok(snippet.includes('src="https://jero8i.github.io/tryon/tryon-embed.js"'));
});

test('integration HTML encodes product identifiers without injecting markup',()=>{
  const id='test"><script>alert(1)</script>';
  const snippet=integrationSnippet('https://example.com/tools/',id);
  assert.equal((snippet.match(/<script/g)||[]).length,1);
  const href=snippet.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&');
  assert.equal(new URL(href).searchParams.get('frame'),id);
});
