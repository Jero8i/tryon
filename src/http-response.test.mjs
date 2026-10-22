import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readResponse} from './http-response.ts';

test('minimal writes succeed with empty 200, 201 and 204 responses',async()=>{
  for(const status of [200,201,204])assert.equal(await readResponse(new Response(null,{status}),{allowEmpty:true}),undefined);
  assert.equal(await readResponse(new Response(' \n',{status:201}),{allowEmpty:true}),undefined);
});
test('authentication and reads still require a JSON response',async()=>{
  await assert.rejects(()=>readResponse(new Response(null,{status:200})),/vacía/);
  assert.deepEqual(await readResponse(Response.json([{id:'published'}])),[{id:'published'}]);
  await assert.rejects(()=>readResponse(new Response('{broken',{status:200})),/JSON no válida/);
});
test('failed writes are never mistaken for successful empty responses',async()=>{
  await assert.rejects(()=>readResponse(new Response(null,{status:403}),{allowEmpty:true}),/403/);
  await assert.rejects(()=>readResponse(Response.json({message:'Permiso denegado'},{status:403}),{allowEmpty:true}),/Permiso denegado/);
  await assert.rejects(()=>readResponse(new Response('<html>Error</html>',{status:500}),{allowEmpty:true}),/500/);
});
