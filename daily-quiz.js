(()=>{
const TODAY=new Date().toLocaleDateString('fr-CA',{timeZone:'Europe/Paris'});
const NEWS=[
['Quel attaquant espagnol a rejoint le PSG mi-août 2026 ?',['Ferran Torres','Álvaro Morata','Dani Olmo'],0],
['De quel club Ferran Torres est-il arrivé au PSG ?',['Real Madrid','FC Barcelone','Valence'],1],
['Quel défenseur argentin a rejoint l’Atlético de Madrid en août 2026 ?',['Cristian Romero','Lisandro Martínez','Nicolás Otamendi'],0],
['Dans quel club Cristian Romero évoluait-il avant l’Atlético ?',['Arsenal','Tottenham','Chelsea'],1],
['Quel attaquant français du PSG est annoncé dans le viseur de Liverpool ?',['Bradley Barcola','Ousmane Dembélé','Randal Kolo Muani'],0],
['Quel jeune ailier du PSG est également suivi par Liverpool ?',['Ibrahim Mbaye','Warren Zaïre-Emery','Senny Mayulu'],0],
['Quel club anglais est annoncé intéressé par Folarin Balogun ?',['Tottenham','Everton','West Ham'],0],
['Dans quel club évolue Folarin Balogun ?',['Monaco','Lille','Lyon'],0],
['Quel club italien est annoncé intéressé par Gabriel Jesus ?',['Napoli','Inter','Roma'],0],
['Quel club anglais détient Gabriel Jesus ?',['Arsenal','Chelsea','Liverpool'],0],
['Quel latéral de Tottenham est annoncé dans le viseur de l’Inter ?',['Djed Spence','Pedro Porro','Ben Davies'],0],
['Quel club français a remporté la Ligue des champions en 1993 ?',['Marseille','PSG','Monaco'],0],
['Combien de clubs participent à la Ligue 1 2026-2027 ?',['16','18','20'],1],
['Quel club fait partie des promus en Ligue 1 2026-2027 ?',['Le Mans','Caen','Bastia'],0],
['Quel autre club est promu en Ligue 1 2026-2027 ?',['ESTAC Troyes','Grenoble','Guingamp'],0],
['Quel club joue au stade Anfield ?',['Liverpool','Arsenal','Chelsea'],0],
['Quel pays a remporté la Coupe du monde 2022 ?',['France','Argentine','Brésil'],1],
['Quel joueur a inscrit un triplé en finale du Mondial 2022 ?',['Mbappé','Messi','Griezmann'],0],
['Combien de points rapporte une victoire en championnat ?',['2','3','4'],1],
['À quelle distance du but se situe le point de penalty ?',['9 m','11 m','12 m'],1]
];
const DAILY=[
['Combien de joueurs une équipe aligne-t-elle au coup d’envoi ?',['10','11','12'],1],['Quel carton entraîne une exclusion ?',['Jaune','Rouge','Vert'],1],['Combien de minutes dure un match senior ?',['80','90','100'],1],['Une victoire rapporte combien de points ?',['1','2','3'],2],['Qui peut prendre le ballon à la main dans sa surface ?',['Le gardien','Le capitaine','Tout défenseur'],0],['Comment appelle-t-on trois buts du même joueur ?',['Triplé','Doublé','Clean sheet'],0],['Le point de penalty est à…',['9 m','11 m','13 m'],1],['Quel club joue à Anfield ?',['Liverpool','Arsenal','Chelsea'],0],['Qui a gagné le Mondial 2022 ?',['Argentine','France','Brésil'],0],['Qui a gagné le Mondial 2018 ?',['France','Croatie','Belgique'],0],['Quel club français a gagné la C1 en 1993 ?',['OM','PSG','Monaco'],0],['Que signifie clean sheet ?',['Aucun but encaissé','Aucun carton','Aucun tir'],0],['Une passe menant directement à un but est…',['Décisive','Indirecte','Neutre'],0],['Une sortie sur la ligne de touche donne…',['Une touche','Un corner','Un penalty'],0],['Quel joueur porte généralement une tenue différente ?',['Gardien','Capitaine','Buteur'],0],['Le coup d’envoi se joue depuis…',['Le rond central','Le corner','La surface'],0],['Deux cartons jaunes au même joueur donnent…',['Une exclusion','Un penalty','Rien'],0],['Peut-on marquer directement sur corner ?',['Oui','Non','Seulement de la tête'],0],['Qui décide du temps additionnel ?',['Arbitre','Capitaine','Entraîneur'],0],['Quel poste évolue le plus près du but adverse ?',['Avant-centre','Gardien','Défenseur central'],0]
];
let mode=null,i=0,score=0;
const uid=()=>window.user?.id||(typeof user!=='undefined'?user?.id:null);
function card(id,icon,title,sub){return `<button id="${id}" style="text-align:left;background:linear-gradient(145deg,#102419,#09130e);border:1px solid #31543d;color:#fff;border-radius:18px;padding:16px"><div style="font-size:32px">${icon}</div><b style="display:block;font-size:18px;margin:6px 0">${title}</b><span class="msg">${sub}</span></button>`}
function addCards(){const r=document.getElementById('quizContent');if(!r||r.dataset.dailyAdded)return;const grid=r.querySelector('div[style*="grid-template-columns"]');if(!grid)return;r.dataset.dailyAdded='1';grid.insertAdjacentHTML('afterbegin',card('dailyQuizBtn','📅','Quiz du jour','20 questions · 1 tentative par jour')+card('newsQuizBtn','🔥','Actualité du football','Mis à jour avec les dernières infos'));document.getElementById('dailyQuizBtn').onclick=()=>start('daily');document.getElementById('newsQuizBtn').onclick=()=>start('news')}
async function start(m){mode=m;i=0;score=0;if(m==='daily'){const key=`footshow_daily_${TODAY}_${uid()||'guest'}`;if(localStorage.getItem(key)){alert('Tu as déjà joué au Quiz du jour. Reviens demain !');return}}render()}
function render(){const q=(mode==='news'?NEWS:DAILY)[i],r=document.getElementById('quizContent');r.innerHTML=`<button id="dqBack" class="secondary">← Quiz</button><div style="margin:18px 0 8px;color:#4ade80;font-weight:900">${mode==='news'?'🔥 ACTUALITÉ FOOT':'📅 QUIZ DU JOUR'} · ${i+1}/20</div><h2>${q[0]}</h2><div style="display:grid;gap:10px;margin-top:18px">${q[1].map((a,n)=>`<button class="secondary dqAns" data-n="${n}" style="text-align:left;padding:14px">${String.fromCharCode(65+n)}. ${a}</button>`).join('')}</div><div class="msg">Score : ${score}</div>`;document.getElementById('dqBack').onclick=()=>location.reload();r.querySelectorAll('.dqAns').forEach(b=>b.onclick=()=>answer(+b.dataset.n))}
async function answer(n){const q=(mode==='news'?NEWS:DAILY)[i];if(n===q[2])score++;if(++i<20)return render();if(mode==='daily')localStorage.setItem(`footshow_daily_${TODAY}_${uid()||'guest'}`,String(score));try{if(uid())await sb.from('quiz_scores').upsert({user_id:uid(),theme:mode==='news'?'Actualité du football':`Quiz du jour ${TODAY}`,score},{onConflict:'user_id,theme'});}catch(e){}const r=document.getElementById('quizContent');r.innerHTML=`<div style="text-align:center;padding:22px"><div style="font-size:58px">${score>=16?'🏆':'⚽'}</div><h2>${mode==='news'?'Actualité du football':'Quiz du jour'}</h2><div style="font-size:48px;font-weight:900;color:#4ade80">${score}/20</div><p class="msg">${mode==='daily'?'Prochain Quiz du jour demain.':'Ton score a été enregistré.'}</p><button class="primary" onclick="location.reload()">Retour</button></div>`}
const obs=new MutationObserver(addCards);document.addEventListener('DOMContentLoaded',()=>{obs.observe(document.body,{childList:true,subtree:true});setInterval(addCards,700)});
})();