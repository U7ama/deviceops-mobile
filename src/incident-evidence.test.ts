import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {photoBytes,photoPayload} from './incident-evidence';
test('photo checksum covers decoded JPEG bytes and payload is bound to an incident',async()=>{
 const image=Buffer.from([255,216,255,224,0,1,2,3,255,217]);
 const payload=await photoPayload('00000000-0000-4000-8000-000000000001',image.toString('base64'),async b=>createHash('sha256').update(b).digest('hex'));
 assert.equal(payload.sha256,createHash('sha256').update(image).digest('hex'));assert.equal(payload.contentType,'image/jpeg');assert.equal(payload.incidentId,'00000000-0000-4000-8000-000000000001');assert.equal('tenantId' in payload,false);
});
test('rejects oversized, invalid and non-JPEG images before upload',()=>{
 for(const value of ['', 'eA==','!!!!', '/9j/===','A'.repeat(14*1024*1024)]) assert.throws(()=>photoBytes(value));
});
