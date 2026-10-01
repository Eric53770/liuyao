const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
function setup(config={googleClientId:'test.apps.googleusercontent.com'}){
 const events=new Map(),requests=[],scripts=[];
 let googleOptions,popup;
 const root={isSecureContext:true,GuanyaoCloudConfig:config,
  google:{accounts:{oauth2:{initTokenClient(options){googleOptions=options;return {requestAccessToken(){}};},hasGrantedAllScopes:r=>r.scope==='https://www.googleapis.com/auth/drive.file'}}},
  open(){popup={closed:false,location:{},close(){this.closed=true;}};return popup;},
  addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
 const ctx={window:root,crypto:webcrypto,btoa:v=>Buffer.from(v,'binary').toString('base64'),location:{protocol:'https:',origin:'https://example.test',href:'https://example.test/chart/index.html'},
  URL,URLSearchParams,Uint8Array,TextEncoder,Blob,AbortController,setTimeout,clearTimeout,setInterval,clearInterval,
  document:{createElement:()=>({remove(){}}),head:{append:s=>{scripts.push(s);s.onload();}}},
  fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>url.includes('oauth2/token')?{access_token:'short-lived-token'}:{id:'file-123',name:'觀爻.jpg'}};}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../cloud-upload.js'),'utf8'),ctx);
 return {root,ctx,requests,events,get popup(){return popup;},get googleOptions(){return googleOptions;}};
}
(async()=>{
 const empty=setup({});assert.throws(()=>empty.root.GuanyaoCloud.authorize(),/尚未啟用/);
 const env=setup();env.root.isSecureContext=false;assert.throws(()=>env.root.GuanyaoCloud.authorize(),/HTTPS/);
 const s=setup(),cloud=s.root.GuanyaoCloud;
 const auth=cloud.authorize();s.googleOptions.callback({access_token:'google-token',scope:'https://www.googleapis.com/auth/drive.file'});assert.equal(await auth,'google-token');
 const cancelled=cloud.authorize();s.googleOptions.error_callback({type:'popup_closed'});await assert.rejects(cancelled,/取消/);
 const denied=cloud.authorize();s.googleOptions.callback({access_token:'token',scope:''});await assert.rejects(denied,/未取得/);
 const blob=new Blob(['JPEG bytes'],{type:'image/jpeg'});
 assert.match((await cloud.upload('token',blob,'觀爻.jpg')).url,/file-123/);
 const multipart=s.requests.at(-1);assert.match(multipart.options.headers['Content-Type'],/^multipart\/related/);assert.match(await multipart.options.body.text(),/觀爻.jpg/);assert.ok((await multipart.options.body.text()).startsWith('--'+multipart.options.headers['Content-Type'].split('boundary=')[1]+'\r\n'));
 s.ctx.fetch=async()=>({ok:false,status:401});await assert.rejects(cloud.upload('expired',blob,'a.jpg'),/登入已失效/);
 await assert.rejects(cloud.upload('token',new Blob(['PNG'],{type:'image/png'}),'a.jpg'),/只能上傳 JPG/);
 console.log('通過：模擬 Google 授權／取消／拒絕、中文檔名、multipart JPG、401 錯誤處理。');
})().catch(error=>{console.error(error);process.exitCode=1;});
