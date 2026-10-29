import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProductUrl,productUrlCandidates,productLookupQuery} from './storefront-model.ts';

test('product mapping ignores tracking and fragments but keeps the product path',()=>{
  assert.equal(normalizeProductUrl('https://lafilleauxlunettes.com.ar/productos/bless/?utm_source=ig#fotos'),'https://lafilleauxlunettes.com.ar/productos/bless');
  assert.notEqual(normalizeProductUrl('https://shop.example/productos/a'),normalizeProductUrl('https://shop.example/productos/b'));
  for(const value of ['javascript:alert(1)','http://shop.example/a','not-a-url','https://user:pass@shop.example/a'])assert.equal(normalizeProductUrl(value),undefined);
});

test('automatic lookup matches www and trailing-slash versions without confusing other products',()=>{
  const variants=productUrlCandidates('https://shop.example/productos/bless/');
  assert.equal(variants.length,4);
  assert.ok(variants.includes('https://www.shop.example/productos/bless/'));
  assert.ok(variants.includes('https://shop.example/productos/bless'));
  assert.ok(!variants.includes('https://shop.example/productos/bless-otro'));
  const query=productLookupQuery('https://shop.example/productos/bless');
  assert.equal(query.get('status'),'eq.published');
  assert.equal(query.get('select'),'id');
  assert.equal(query.get('limit'),'2'); // Detect ambiguity rather than opening the first match.
  assert.ok(query.get('payload->>productUrl').startsWith('in.("https://'));
  assert.throws(()=>productLookupQuery('javascript:alert(1)'));
});

test('product URLs with filter punctuation remain quoted PostgREST values',()=>{
  const query=productLookupQuery('https://shop.example/productos/a,b(c)');
  const encoded=query.toString();
  assert.equal(new URLSearchParams(encoded).get('payload->>productUrl'),query.get('payload->>productUrl'));
  assert.ok(query.get('payload->>productUrl').includes('"https://shop.example/productos/a,b(c)"'));
});
