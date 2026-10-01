(function(root){
'use strict';
const config=root.GuanyaoCloudConfig||{},DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const nonce=()=>base64url(crypto.getRandomValues(new Uint8Array(32)));
let googleReady=false,googleLoading=false;
function environment(){
 if(!root.isSecureContext||!/^https?:$/.test(location.protocol))throw Error('雲端登入需從 HTTPS 網站或 localhost 開啟，不能直接開啟本機 HTML。');
}
function loadGoogle(){
 if(!config.googleClientId||googleLoading||googleReady)return;
 googleLoading=true;
 const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
 script.onload=()=>{googleLoading=false;googleReady=Boolean(root.google?.accounts?.oauth2);};
 script.onerror=()=>{googleLoading=false;script.remove();};document.head.append(script);
}
function googleToken(){
 environment();
 if(!config.googleClientId)throw Error('網站尚未啟用 Google Drive 登入，請由網站管理者完成設定。');
 if(!googleReady){loadGoogle();throw Error('Google 登入元件尚未就緒，請稍後再點一次；若持續失敗，請檢查網路或內容阻擋設定。');}
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error,token)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(token);};
  const timer=setTimeout(()=>finish(Error('Google 登入逾時，請重試。')),180000);
  try{
   const client=root.google.accounts.oauth2.initTokenClient({client_id:config.googleClientId,scope:DRIVE_SCOPE,include_granted_scopes:false,
    callback:response=>{
     if(response.error||!response.access_token)return finish(Error('Google 授權未完成，請重試並允許儲存檔案。'));
     if(!root.google.accounts.oauth2.hasGrantedAllScopes(response,DRIVE_SCOPE))return finish(Error('未取得儲存 Google Drive 檔案的授權。'));
     finish(null,response.access_token);
    },error_callback:error=>finish(Error(error.type==='popup_closed'?'已取消 Google 登入。':'無法開啟 Google 登入視窗，請允許彈出視窗後重試。'))});
   client.requestAccessToken({prompt:'select_account'});
  }catch(error){finish(error);}
 });
}
async function request(url,options){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
 try{return await fetch(url,{...options,signal:controller.signal});}
 catch(error){throw Error(error.name==='AbortError'?'連線逾時。請先確認雲端是否已有檔案，再重試。':'網路連線失敗。若正在上傳，請先確認雲端是否已有檔案，再重試。');}
 finally{clearTimeout(timer);}
}
async function upload(token,blob,name){
 if(blob.type!=='image/jpeg')throw Error('只能上傳 JPG 圖片。');
 if(blob.size>5*1024*1024)throw Error('JPG 超過 5 MB，請縮短備註後重新產生圖片。');

  const boundary='guanyao_'+nonce().toLowerCase();
  const body=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,JSON.stringify({name,mimeType:'image/jpeg'}),`\r\n--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`,blob,`\r\n--${boundary}--\r\n`],{type:'multipart/related; boundary='+boundary});
  const response=await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':body.type},body});
 if(!response.ok){
  if(response.status===401)throw Error('登入已失效，請重新點選登入並上傳。');
  if(response.status===403)throw Error('沒有上傳權限或雲端空間不足，請檢查帳號與應用程式設定。');
  if(response.status===429)throw Error('服務暫時限制上傳，請稍後重試。');
  throw Error(`上傳未完成（HTTP ${response.status}）。請確認雲端空間與權限後重試。`);
 }
 const result=await response.json();
 if(!result.id)throw Error('服務未回傳檔案確認，請先到雲端檢查後再重試。');
 return {name:result.name||name,url:'https://drive.google.com/file/d/'+encodeURIComponent(result.id)+'/view'};
}
loadGoogle();
root.GuanyaoCloud={authorize:googleToken,upload,configured:{google:Boolean(config.googleClientId)}};
})(window);
