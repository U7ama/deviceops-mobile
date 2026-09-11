import React, {useCallback,useState} from 'react';
import {ActivityIndicator,Image,ScrollView,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {useFocusEffect} from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import {apiFetch} from '../../src/api';
import {photoPayload} from '../../src/incident-evidence';
import {colors} from '../../src/theme';
type Incident={id:string;summary:string;status:string;deviceIds:string[]};
type Device={id:string;name:string};
type Artifact={id:string;incidentId:string;name:string;status:string;scan:string;confirmedDeviceId:string|null;error?:string};
export default function EvidenceScreen(){
 const [incidents,setIncidents]=useState<Incident[]>([]),[devices,setDevices]=useState<Device[]>([]),[artifacts,setArtifacts]=useState<Artifact[]>([]);
 const [selected,setSelected]=useState(''),[photo,setPhoto]=useState<string|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const refresh=useCallback(async()=>{try{
   const [stateResponse,evidenceResponse]=await Promise.all([apiFetch('/api/v2/state'),apiFetch('/api/v2/enterprise')]);
   if(!stateResponse.ok||!evidenceResponse.ok)throw new Error('Sign in to load operational incidents and evidence.');
   const state=await stateResponse.json(),evidence=await evidenceResponse.json();
   setIncidents(state.incidents);setDevices(state.devices);setArtifacts(evidence.artifacts);
   setSelected(current=>state.incidents.some((i:Incident)=>i.id===current)?current:state.incidents.find((i:Incident)=>!['cancelled','resolved'].includes(i.status))?.id??'');
 }catch(e){setError(e instanceof Error?e.message:'Unable to refresh evidence');}},[]);
 useFocusEffect(useCallback(()=>{void refresh();const timer=setInterval(()=>void refresh(),5000);return()=>clearInterval(timer);},[refresh]));
 async function send(path:string,body:unknown){
   const r=await apiFetch(path,{method:'POST',headers:{'idempotency-key':Crypto.randomUUID()},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
   const data=await r.json();if(!r.ok)throw new Error(data.detail??data.error??'Evidence request failed');return data;
 }
 async function capture(camera:boolean){
   if(!selected||busy)return;setBusy(true);setError('');setMessage('');
   try{
     if(camera){const permission=await ImagePicker.requestCameraPermissionsAsync();if(!permission.granted)throw new Error('Camera permission was denied. You can choose an existing photo instead.');}
     const options:ImagePicker.ImagePickerOptions={mediaTypes:['images'],base64:true,quality:0.7,exif:false,allowsMultipleSelection:false};
     const result=camera?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);
     if(result.canceled)return;const asset=result.assets[0];if(!asset?.base64)throw new Error('Photo bytes are unavailable. Please choose another image.');
     setPhoto(asset.uri);
     const payload=await photoPayload(selected,asset.base64,async bytes=>Array.from(new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256,bytes))).map(b=>b.toString(16).padStart(2,'0')).join(''));
     await send('/api/v2/artifacts',payload);setMessage('Photo uploaded to this incident. Awaiting scan and processing; association is not confirmed.');await refresh();
   }catch(e){setError(e instanceof Error?e.message:'Photo upload failed');}finally{setBusy(false);}
 }
 async function confirm(artifact:Artifact,deviceId:string){setBusy(true);setError('');try{await send(`/api/v2/artifacts/${artifact.id}/confirm`,{deviceId});setMessage('Device association confirmed. Existing approval policies still apply.');await refresh();}catch(e){setError(e instanceof Error?e.message:'Confirmation failed');}finally{setBusy(false);}}
 const incident=incidents.find(i=>i.id===selected);
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
  <Text style={styles.title}>Incident photos</Text><Text style={styles.note}>Attach rack evidence to an operational incident. Your local photo preview is unprocessed; models receive only approved, processed evidence.</Text>
  {error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}{message?<Text style={styles.note}>{message}</Text>:null}
  <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={()=>void refresh()}><Text style={styles.buttonText}>Refresh incidents</Text></TouchableOpacity>
  {!incidents.length&&<Text style={styles.note}>No operational incidents in this tenant.</Text>}
  {incidents.map(i=><TouchableOpacity accessibilityRole="button" accessibilityState={{selected:i.id===selected,disabled:busy}} disabled={busy} style={[styles.card,i.id===selected&&styles.selected]} key={i.id} onPress={()=>{setSelected(i.id);setPhoto(null);setMessage('');}}><Text style={styles.text}>{i.summary}</Text><Text style={styles.note}>{i.status}</Text></TouchableOpacity>)}
  <View style={styles.row}><TouchableOpacity accessibilityRole="button" disabled={busy||!selected} style={styles.button} onPress={()=>void capture(true)}><Text style={styles.buttonText}>Take rack photo</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" disabled={busy||!selected} style={styles.button} onPress={()=>void capture(false)}><Text style={styles.buttonText}>Choose photo</Text></TouchableOpacity></View>
  {busy&&<ActivityIndicator color={colors.accent}/>}{photo&&<><Image source={{uri:photo}} accessibilityLabel="Local unprocessed photo preview" style={styles.preview}/><Text style={styles.note}>Local preview — not proof of server processing.</Text></>}
  {artifacts.filter(a=>a.incidentId===selected).map(a=><View key={a.id} style={styles.card}><Text style={styles.text}>{a.name}</Text><Text style={styles.note}>{a.status} · scan: {a.scan}</Text>{a.error&&<Text style={styles.error}>{a.error}</Text>}{a.confirmedDeviceId?<Text style={styles.note}>Confirmed: {devices.find(d=>d.id===a.confirmedDeviceId)?.name??a.confirmedDeviceId}</Text>:a.status==='ready'&&a.scan==='clean'?<><Text style={styles.note}>Confirm the device shown:</Text>{devices.filter(d=>incident?.deviceIds.includes(d.id)).map(d=><TouchableOpacity key={d.id} accessibilityRole="button" disabled={busy} style={styles.button} onPress={()=>void confirm(a,d.id)}><Text style={styles.buttonText}>{d.name}</Text></TouchableOpacity>)}</>:<Text style={styles.note}>Confirmation is unavailable until processing succeeds.</Text>}</View>)}
 </ScrollView>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},content:{padding:16,gap:12,paddingBottom:40},title:{fontSize:25,fontWeight:'700',color:colors.textPrimary},text:{color:colors.textPrimary,fontSize:16},note:{color:colors.textSecondary,lineHeight:21},error:{color:colors.errorText},button:{backgroundColor:colors.buttonPrimary,borderRadius:8,padding:12,marginVertical:4},buttonText:{color:colors.white,fontWeight:'600'},card:{backgroundColor:colors.surface,padding:12,borderRadius:10,borderWidth:1,borderColor:colors.border,gap:6},selected:{borderColor:colors.accent,borderWidth:2},row:{flexDirection:'row',flexWrap:'wrap',gap:10},preview:{width:'100%',height:240,resizeMode:'contain'}});
