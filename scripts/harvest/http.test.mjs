import test from 'node:test';
import assert from 'node:assert/strict';
import {readResponseBytes} from './http.mjs';

test('response limits apply while streaming even when Content-Length understates the body',async()=>{
 let cancelled=false;
 const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(8));c.enqueue(new Uint8Array(8));},cancel(){cancelled=true;}});
 await assert.rejects(readResponseBytes(new Response(body,{headers:{'Content-Length':'1'}}),10),/response_too_large/);
 assert.equal(cancelled,true);
 assert.equal((await readResponseBytes(new Response('1234567890'),10)).toString(),'1234567890');
});
