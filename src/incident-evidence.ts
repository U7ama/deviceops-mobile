export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export function photoBytes(base64: string): Uint8Array<ArrayBuffer> {
  if (!base64 || base64.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 || base64.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new Error('Invalid or oversized photo data');
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const padding=base64.endsWith('==')?2:base64.endsWith('=')?1:0;
  const bytes=new Uint8Array(base64.length/4*3-padding);
  if(bytes.length>MAX_PHOTO_BYTES)throw new Error('Photo exceeds 10 MB');
  let value=0,bits=0,offset=0;
  for(const char of base64){if(char==='=')break;value=(value<<6)|alphabet.indexOf(char);bits+=6;if(bits>=8){bits-=8;bytes[offset++]=(value>>bits)&255;value&=(1<<bits)-1;}}
  if(value!==0)throw new Error('Invalid photo padding');
  // Expo ImagePicker base64 contains JPEG bytes, regardless of the original library format.
  if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw new Error('Expected a JPEG photo');
  return bytes;
}
export async function photoPayload(incidentId:string,base64:string,digest:(bytes:Uint8Array<ArrayBuffer>)=>Promise<string>){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(incidentId))throw new Error('Select an operational incident');
  const bytes=photoBytes(base64);const sha256=await digest(bytes);
  return {incidentId,name:'rack-photo.jpg',contentType:'image/jpeg',sha256,data:base64};
}
