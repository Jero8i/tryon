import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/prepare-front/handler.ts';

const origin='https://jero8i.github.io';
const config={supabaseUrl:'https://example.supabase.co',supabaseKey:'public-key',openaiKey:'server-only-key',allowedOrigins:[origin]};
function request(file=true) {
  const form=new FormData();
  if(file)form.set('image',new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,0,0,0,0])],{type:'image/png'}),'front.png');
  return new Request('https://example.supabase.co/functions/v1/prepare-front',{method:'POST',headers:{Origin:origin,Authorization:'Bearer editor-session'},body:form});
}
test('unauthorized origins and missing login never invoke the paid service',async()=>{
  let calls=0;const handler=createHandler({...config,fetcher:async()=>{calls++;throw Error('must not call');}});
  assert.equal((await handler(new Request('https://example.com',{method:'POST',headers:{Origin:'https://other.example'}}))).status,403);
  assert.equal((await handler(new Request('https://example.com',{method:'POST',headers:{Origin:origin}}))).status,401);
  assert.equal(calls,0);
});
test('authenticated user without catalog membership cannot prepare photos',async()=>{
  const calls=[];const handler=createHandler({...config,fetcher:async(url)=>{calls.push(url);return Response.json(url.includes('/auth/')?{id:'test-user'}:[]);}});
  assert.equal((await handler(request())).status,403);
  assert.equal(calls.length,2);assert.ok(calls.every(url=>!url.includes('api.openai.com')));
});
test('editor receives a proposal while the server key stays at the provider boundary',async()=>{
  let providerCalls=0;
  const handler=createHandler({...config,fetcher:async(url,init)=>{
    if(url.includes('/auth/')) {assert.equal(init.headers.Authorization,'Bearer editor-session');return Response.json({id:'test-user'});}
    if(url.includes('/rest/'))return Response.json([{user_id:'test-user'}]);
    providerCalls++;
    assert.equal(url,'https://api.openai.com/v1/images/edits');assert.equal(init.headers.Authorization,'Bearer server-only-key');
    assert.equal(init.body.get('background'),'transparent');assert.equal(init.body.get('output_format'),'png');
    assert.ok(init.body.get('prompt').includes('ABOVE or OUTSIDE'));
    assert.ok(init.body.get('prompt').includes('INSIDE'));
    assert.ok(init.body.get('image') instanceof File);
    return Response.json({data:[{b64_json:'iVBORw0KGgoAAAA='}]});
  }});
  const result=await handler(request());assert.equal(result.status,200);
  assert.equal(result.headers.get('Access-Control-Allow-Origin'),origin);
  const body=await result.text();assert.ok(body.includes('data:image/png;base64,'));assert.ok(!body.includes('server-only-key'));assert.equal(providerCalls,1);
});
test('missing input and provider errors preserve a safe failure without retries',async()=>{
  let providerCalls=0;
  const handler=createHandler({...config,fetcher:async(url)=>{
    if(url.includes('/auth/'))return Response.json({id:'test-user'});
    if(url.includes('/rest/'))return Response.json([{user_id:'test-user'}]);
    providerCalls++;return Response.json({error:{message:'secret debug details'}},{status:429});
  }});
  assert.equal((await handler(request(false))).status,400);assert.equal(providerCalls,0);
  const failure=await handler(request());assert.equal(failure.status,502);assert.equal(providerCalls,1);
  assert.ok(!(await failure.text()).includes('secret debug'));
});
test('missing server configuration reports setup instead of calling an external API',async()=>{
  const handler=createHandler({...config,openaiKey:'',fetcher:async()=>{throw Error('must not call');}});
  assert.equal((await handler(request())).status,503);
});
