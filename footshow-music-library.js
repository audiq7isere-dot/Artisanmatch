(()=>{
const $=id=>document.getElementById(id);
const PRESETS={
 stadium:{name:'🏟️ Stade',bpm:128,notes:[110,110,165,110,220,165,110,147]},
 urban:{name:'🔥 Urban',bpm:96,notes:[82,123,82,147,98,123,82,165]},
 energy:{name:'⚡ Énergie',bpm:142,notes:[147,196,220,196,247,220,196,294]},
 chill:{name:'🌙 Chill',bpm:82,notes:[110,147,165,147,123,147,196,165]}
};
function installUI(){
 const box=document.querySelector('.music-box');if(!box||$('musicPreset'))return;
 const row=document.createElement('div');
 row.innerHTML=`<label style="margin-top:0">Bibliothèque FootShow</label><select id="musicPreset" class="input"><option value="">Aucune musique FootShow</option>${Object.entries(PRESETS).map(([k,p])=>`<option value="${k}">${p.name} · Instrumental original</option>`).join('')}</select><div id="musicPresetHint" class="msg" style="margin:6px 0 8px">Musiques originales FootShow, utilisables dans l'application sans droits tiers.</div><div style="display:flex;gap:8px;margin-bottom:10px"><button type="button" id="previewMusicPreset" class="secondary" style="flex:1">▶ Écouter</button><button type="button" id="stopMusicPreset" class="secondary" style="flex:1">■ Stop</button></div><div class="msg" style="margin:8px 0">ou importe ton propre fichier audio :</div>`;
 box.insertBefore(row,box.querySelector('#actionMusic'));
 $('musicPreset').addEventListener('change',()=>{if($('musicPreset').value)$('actionMusic').value=''});
 $('actionMusic').addEventListener('change',()=>{if($('actionMusic').files[0])$('musicPreset').value=''});
 let preview=null;
 $('previewMusicPreset').onclick=()=>{stopPreview();const key=$('musicPreset').value;if(!key)return;preview=startPreset(null,key,Number($('musicVolume')?.value||65)/100,0)};
 $('stopMusicPreset').onclick=stopPreview;
 function stopPreview(){if(preview){preview.stop();preview=null}}
 installPublisher();setTimeout(enhanceVideos,300);
}
function currentUserId(){try{return user?.id||null}catch(_){return null}}
function installPublisher(){
 const btn=$('publishActionBtn');if(!btn||btn.dataset.musicLibraryInstalled)return;btn.dataset.musicLibraryInstalled='1';
 btn.onclick=async()=>{try{
   const f=$('actionFile').files[0],music=$('actionMusic').files[0],preset=$('musicPreset')?.value||null;
   if(!f)throw new Error('Choisis une vidéo');
   if(f.size>200*1024*1024)throw new Error('Vidéo : 200 Mo maximum');
   if(music&&music.size>25*1024*1024)throw new Error('Musique : 25 Mo maximum');
   const uid=currentUserId();if(!uid)throw new Error('Reconnecte-toi pour publier');
   $('profileMsg').textContent='Upload en cours…';
   const stamp=Date.now(),ext=f.name.split('.').pop()||'mp4';
   const path=await uploadFile('footshow-videos',f,`${uid}/actions/${stamp}.${ext}`);
   let musicPath=null;
   if(music){const mext=music.name.split('.').pop()||'mp3';musicPath=await uploadFile('footshow-videos',music,`${uid}/music/${stamp}.${mext}`)}
   const row={user_id:uid,storage_path:path,music_path:musicPath,music_preset:preset,original_volume:Number($('originalVolume')?.value||100)/100,music_volume:Number($('musicVolume')?.value||65)/100,action_type:$('actionType').value,opponent:$('actionOpponent').value.trim()||null,competition:$('actionCompetition').value.trim()||null,caption:$('actionCaption').value.trim()};
   const {error}=await sb.from('videos').insert(row);if(error)throw error;
   $('profileMsg').textContent=(preset||music)?'Action + musique ajoutées ✅':'Action ajoutée ✅';
   $('actionFile').value='';$('actionMusic').value='';if($('musicPreset'))$('musicPreset').value='';$('actionCaption').value='';$('actionOpponent').value='';$('actionCompetition').value='';
   await loadMyActions();try{if(selectedPlayer===uid)openPlayer(uid)}catch(_){ }setTimeout(enhanceVideos,400);
 }catch(e){$('profileMsg').textContent=e.message}}
}
function startPreset(video,key,volume=.65,startAt=0){
 const p=PRESETS[key];if(!p)return null;
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
 const ctx=new AC(),master=ctx.createGain();master.gain.value=Math.max(0,Math.min(1,volume));master.connect(ctx.destination);
 const stepDur=60/p.bpm/2;let lastStep=-1,stopped=false;
 function tick(){if(stopped)return;const t=video?video.currentTime:(ctx.currentTime+startAt);const step=Math.floor(t/stepDur);if(step===lastStep)return;lastStep=step;const freq=p.notes[step%p.notes.length];
   const o=ctx.createOscillator(),g=ctx.createGain();o.type=key==='urban'?'square':key==='chill'?'sine':'triangle';o.frequency.value=freq;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.22,ctx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+Math.min(.18,stepDur*.8));o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+.22);
   if(step%4===0){const k=ctx.createOscillator(),kg=ctx.createGain();k.type='sine';k.frequency.setValueAtTime(90,ctx.currentTime);k.frequency.exponentialRampToValueAtTime(45,ctx.currentTime+.12);kg.gain.setValueAtTime(.25,ctx.currentTime);kg.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.14);k.connect(kg);kg.connect(master);k.start();k.stop(ctx.currentTime+.15)}
 }
 const timer=setInterval(tick,60);tick();
 return {stop(){if(stopped)return;stopped=true;clearInterval(timer);try{ctx.close()}catch(_){}}};
}
async function enhanceVideos(){
 const vids=[...document.querySelectorAll('video')].filter(v=>!v.dataset.fsMusicLibrary);
 for(const video of vids){
  video.dataset.fsMusicLibrary='1';const src=decodeURIComponent(video.currentSrc||video.src||''),marker='/footshow-videos/',i=src.indexOf(marker);if(i<0)continue;const path=src.slice(i+marker.length).split('?')[0];
  const {data}=await sb.from('videos').select('music_path,music_preset,original_volume,music_volume').eq('storage_path',path).maybeSingle();if(!data)continue;
  video.volume=Number(data.original_volume??1);let customAudio=null,presetCtl=null;
  const stopAll=()=>{if(customAudio){customAudio.pause()}if(presetCtl){presetCtl.stop();presetCtl=null}};
  video.addEventListener('play',()=>{stopAll();if(data.music_path){customAudio=new Audio(media('footshow-videos',data.music_path));customAudio.volume=Number(data.music_volume??.65);customAudio.currentTime=video.currentTime;customAudio.play().catch(()=>{})}else if(data.music_preset){presetCtl=startPreset(video,data.music_preset,Number(data.music_volume??.65),video.currentTime)}});
  video.addEventListener('pause',stopAll);video.addEventListener('ended',stopAll);video.addEventListener('seeking',()=>{if(customAudio)customAudio.currentTime=video.currentTime;if(presetCtl){presetCtl.stop();presetCtl=null;if(!video.paused)presetCtl=startPreset(video,data.music_preset,Number(data.music_volume??.65),video.currentTime)}});
  if(data.music_path||data.music_preset){const label=document.createElement('div');label.className='msg';label.style.cssText='padding:5px 9px';label.textContent=data.music_preset?'🎵 '+(PRESETS[data.music_preset]?.name||'Musique FootShow'):'🎵 Musique ajoutée';video.parentElement?.appendChild(label)}
 }
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(installUI,500));setTimeout(installUI,1200);new MutationObserver(()=>{installUI();enhanceVideos()}).observe(document.documentElement,{childList:true,subtree:true});
})();