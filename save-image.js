(()=>{
'use strict';
const dialog=$('export-preview'),status=$('image-save-status');
let prepared=null,busy=false,downloadOnly=false;
function message(text){status.textContent=text;$('export-status').textContent=text;}
function lock(value){
 busy=value;exportingImage=value;
 ['save-jpg-device','upload-google'].forEach(id=>$(id).disabled=value);
 $('export-image').disabled=value||!current;
 dialog.setAttribute('aria-busy',String(value));
}
const missing=[];
if(!GuanyaoCloud.configured.google)missing.push('Google Drive');
$('cloud-availability').textContent=missing.length?missing.join('、')+' 登入尚未啟用，需由網站管理者完成設定。本機 JPG 儲存可直接使用。':'';
async function preview(){
 if(busy)return;
 let snapshot;
 try{snapshot=captureImageSnapshot();}catch(error){$('export-status').textContent=error.message;return;}
 lock(true);message('正在製作含備註的 JPG…');
 try{
  const blob=await GuanyaoImage.createJPG(snapshot);
  if(blob.type!=='image/jpeg')throw Error('瀏覽器未能產生 JPG，請改用支援 JPEG 的瀏覽器。');
  if(previewImageUrl)URL.revokeObjectURL(previewImageUrl);
  previewImageUrl=URL.createObjectURL(blob);
  prepared={blob,name:`觀爻_${snapshot.when.replace(/[T:]/g,'-')}_${snapshot.p.hex.name}.jpg`};
  $('export-preview-image').src=previewImageUrl;
  $('uploaded-image-link').hidden=true;
  dialog.showModal();message('JPG 已產生，請確認圖片後選擇儲存位置。');
 }catch(error){message('無法製作圖片：'+error.message);}
 finally{lock(false);}
}
$('export-image').onclick=preview;
function downloadPrepared(){
 const link=document.createElement('a');link.href=previewImageUrl;link.download=prepared.name;document.body.append(link);link.click();link.remove();
 message('已送出 JPG 下載，請在裝置的下載項目確認檔案。');
}
$('save-jpg-device').onclick=async()=>{
 if(busy||!prepared)return;
 const image=prepared;
 if(downloadOnly||!window.isSecureContext||typeof window.showSaveFilePicker!=='function'){
  downloadPrepared();return;
 }
 lock(true);
 try{
  const handle=await window.showSaveFilePicker({suggestedName:image.name,types:[{description:'JPG 盤面與備註',accept:{'image/jpeg':['.jpg']}}]});
  const stream=await handle.createWritable();
  try{await stream.write(image.blob);await stream.close();}catch(error){try{await stream.abort();}catch(_){}throw error;}
  message('JPG 已儲存至本機。');
 }catch(error){
  if(error.name==='AbortError')message('已取消儲存。');
  else{downloadOnly=true;message('無法開啟或寫入選定位置。請再按一次「儲存 JPG 至本機」，改用下載方式。');}
 }
 finally{lock(false);}
};
async function upload(){
 if(busy||!prepared)return;
 const image=prepared,label='Google Drive';
 lock(true);$('uploaded-image-link').hidden=true;message(`請在登入視窗選擇 ${label} 帳號並授權。`);
 let token;
 try{
  // Start authorization on the click itself, before any awaited image encoding.
  token=await GuanyaoCloud.authorize();
  message(`正在上傳 JPG 至 ${label}…`);
  const result=await GuanyaoCloud.upload(token,image.blob,image.name);
  message(`JPG 已上傳至 ${label}：${result.name}`);
  if(result.url){$('uploaded-image-link').href=result.url;$('uploaded-image-link').hidden=false;}
 }catch(error){message(error.message);}
 finally{token=null;lock(false);}
}
$('upload-google').onclick=upload;
})();
