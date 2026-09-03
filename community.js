import { app, db } from "./firebase-config.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
  doc, setDoc, deleteDoc, getDoc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth=getAuth(app);

const cfg={
 episode:{comments:"communityEpisodeComments",count:"episodeCommentCount",reaction:"episodeReactionCount",list:"episodeComments"},
 campaign:{comments:"communityCampaignComments",count:"campaignCommentCount",reaction:"campaignReactionCount",list:"campaignComments"}
};

const COMMUNITY_RESET_VERSION="2026-09-03-v3";
const COMMUNITY_RESET_AT=new Date("2026-09-03T00:00:00+01:00").getTime();
const names=["Fan","Trendsetter","WE Fan","Community Member","Supporter"];

// Start this Community build clean without deleting historical Firestore records.
try{
  if(localStorage.getItem("wtCommunityResetVersion")!==COMMUNITY_RESET_VERSION){
    ["wtCommunityName","wtCommunityPollVote","wtRedFlagPlacements","wtCommunityTheme","wtCommunityThemeVersion"].forEach(k=>localStorage.removeItem(k));
    localStorage.setItem("wtCommunityResetVersion",COMMUNITY_RESET_VERSION);
  }
}catch{}
let user=null,authReady=false,authError=null,signInPromise=null;

function friendlyAuthError(error){
 const code=error?.code||"";
 if(code==="auth/operation-not-allowed")return"Anonymous sign-in is disabled in Firebase Authentication.";
 if(code==="auth/unauthorized-domain")return`This website (${location.hostname}) is not authorized in Firebase Authentication.`;
 if(code==="auth/network-request-failed")return"Firebase could not connect. Check your internet connection.";
 return error?.message||"Firebase authentication failed.";
}
function getSavedName(){return(localStorage.getItem("wtCommunityName")||"").trim();}
function makeFallbackName(uid){const n=[...uid].reduce((a,c)=>a+c.charCodeAt(0),0);return names[n%names.length];}
function nameFor(uid){const saved=getSavedName();if(saved)return saved;const generated=makeFallbackName(uid);localStorage.setItem("wtCommunityName",generated);return generated;}

function showNameGate(){
 return new Promise(resolve=>{
  document.getElementById("communityNameGate")?.remove();
  const overlay=document.createElement("div");
  overlay.id="communityNameGate";overlay.className="community-gate";
  overlay.innerHTML=`<div class="community-gate-card"><span class="tag">WESTIES COMMUNITY</span><h2>Join the conversation</h2><p>Choose a fan name or continue anonymously.</p><input id="communityNameInput" maxlength="30" placeholder="Your fan name (optional)" autocomplete="nickname"><div class="gate-actions"><button type="button" class="gate-skip">Continue as Fan</button><button type="button" class="gate-join">Join Community</button></div><small>Your fan name is stored only on this device.</small></div>`;
  document.body.appendChild(overlay);
  const input=overlay.querySelector("#communityNameInput"),saved=getSavedName();if(saved)input.value=saved;
  const finish=value=>{const cleaned=String(value||"").trim().slice(0,30);localStorage.setItem("wtCommunityName",cleaned||"Fan");overlay.remove();resolve(cleaned||"Fan");};
  overlay.querySelector(".gate-skip").onclick=()=>finish("Fan");
  overlay.querySelector(".gate-join").onclick=()=>finish(input.value);
  input.onkeydown=e=>{if(e.key==="Enter")finish(input.value)};setTimeout(()=>input.focus(),50);
 });
}

async function ensureUser({askName=false}={}){
 if(user){if(askName&&!getSavedName())await showNameGate();return user;}
 if(authError)throw authError;
 if(!signInPromise){
  signInPromise=signInAnonymously(auth).then(r=>{user=r.user;authReady=true;updatePostButtons();return user})
   .catch(e=>{authError=e;authReady=true;updatePostButtons();throw e});
 }
 const u=await signInPromise;if(askName&&!getSavedName())await showNameGate();return u;
}
window.communityEnsureUser=ensureUser;
function updatePostButtons(){
 document.querySelectorAll(".comment-form button[type=submit]").forEach(b=>{b.disabled=!authReady||!!authError;if(authError)b.title=friendlyAuthError(authError)});
}
function time(ts){
 if(!ts?.toDate)return"just now";
 const m=Math.max(0,Math.round((Date.now()-ts.toDate().getTime())/60000));
 if(m<1)return"just now";if(m<60)return`${m}m ago`;
 const h=Math.round(m/60);if(h<24)return`${h}h ago`;return`${Math.round(h/24)}d ago`;
}
function esc(v){const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML;}

function attachReplies(thread,commentId,wrap){
 const root=document.createElement("div");root.className="replies";wrap.appendChild(root);
 const q=query(collection(db,cfg[thread].comments,commentId,"replies"),orderBy("createdAt","asc"));
 onSnapshot(q,snap=>{
  root.innerHTML="";const replies=[];snap.forEach(x=>replies.push({id:x.id,...x.data()}));
  const byParent=new Map();
  replies.forEach(r=>{const k=r.parentReplyId||"__root__";if(!byParent.has(k))byParent.set(k,[]);byParent.get(k).push(r)});
  const renderLevel=(parentId,parentEl,depth=0)=>{
   (byParent.get(parentId)||[]).forEach(d=>{
    const el=document.createElement("div");el.className="reply";el.style.marginLeft=`${Math.min(depth,4)*8}px`;
    el.innerHTML=`<div class="reply-avatar">${esc((d.displayName||"F")[0].toUpperCase())}</div><div class="reply-body"><strong class="reply-name">${esc(d.displayName||"Fan")}</strong><span class="reply-time">${time(d.createdAt)}</span><div class="reply-text">${esc(d.text||"")}</div><button class="reply-to-btn" type="button">Reply</button><div class="nested-reply-box" hidden><textarea maxlength="500" placeholder="Reply to this fan..."></textarea><button type="button">Post Reply</button></div></div>`;
    const box=el.querySelector(".nested-reply-box"),ta=box.querySelector("textarea"),btn=box.querySelector("button");
    el.querySelector(".reply-to-btn").onclick=async()=>{try{await ensureUser({askName:true});box.hidden=!box.hidden;if(!box.hidden)ta.focus()}catch(e){alert(friendlyAuthError(e))}};
    btn.onclick=async()=>{if(!ta.value.trim())return;btn.disabled=true;try{const u=await ensureUser({askName:true});await addDoc(collection(db,cfg[thread].comments,commentId,"replies"),{uid:u.uid,displayName:nameFor(u.uid),text:ta.value.trim(),parentReplyId:d.id,replyToName:d.displayName||"Fan",createdAt:serverTimestamp()});ta.value="";box.hidden=true}catch(e){alert(friendlyAuthError(e))}finally{btn.disabled=false}};
    parentEl.appendChild(el);renderLevel(d.id,parentEl,depth+1);
   });
  };
  renderLevel("__root__",root);
 },()=>{root.innerHTML=""});
}

async function toggleReaction(thread,id,button){
 const u=await ensureUser({askName:true});
 const ref=doc(db,cfg[thread].comments,id,"reactions",u.uid),snap=await getDoc(ref);
 if(snap.exists()){await deleteDoc(ref);await updateDoc(doc(db,cfg[thread].comments,id),{reactionCount:increment(-1)});button.classList.remove("reacted")}
 else{await setDoc(ref,{uid:u.uid,createdAt:serverTimestamp()});await updateDoc(doc(db,cfg[thread].comments,id),{reactionCount:increment(1)});button.classList.add("reacted")}
}

function freshCommentDocs(snap){
 const rows=[];
 snap.forEach(ds=>{
  const d=ds.data();
  const created=d.createdAt?.toDate?.()?.getTime?.()||0;
  if(created>=COMMUNITY_RESET_AT)rows.push(ds);
 });
 return rows;
}
function render(thread,snap){
 const root=document.getElementById(cfg[thread].list);if(!root)return;
 root.innerHTML="";
 const docs=freshCommentDocs(snap);
 if(!docs.length){root.innerHTML=`<div class="empty">No comments yet. Be the first to join the conversation.</div>`;return;}
 docs.forEach(ds=>{
  const d=ds.data(),id=ds.id,card=document.createElement("article");card.className="comment";
  card.innerHTML=`<div class="comment-avatar">${esc((d.displayName||"F")[0].toUpperCase())}</div><div class="comment-body"><div class="comment-head"><strong>${esc(d.displayName||"Fan")}</strong><span>${time(d.createdAt)}</span></div><div class="comment-text">${esc(d.text||"")}</div><div class="comment-actions"><button type="button" class="reaction-btn">Like <span>${Number(d.reactionCount||0)}</span></button><button type="button" class="reply-open-btn">Reply</button></div><div class="reply-compose" hidden><textarea maxlength="500" placeholder="Reply to this fan..."></textarea><button type="button">Post Reply</button></div></div>`;
  const reaction=card.querySelector(".reaction-btn");reaction.onclick=async()=>{try{await toggleReaction(thread,id,reaction)}catch(e){alert(friendlyAuthError(e))}};
  const compose=card.querySelector(".reply-compose"),ta=compose.querySelector("textarea"),post=compose.querySelector("button");
  card.querySelector(".reply-open-btn").onclick=async()=>{try{await ensureUser({askName:true});compose.hidden=!compose.hidden;if(!compose.hidden)ta.focus()}catch(e){alert(friendlyAuthError(e))}};
  post.onclick=async()=>{if(!ta.value.trim())return;post.disabled=true;try{const u=await ensureUser({askName:true});await addDoc(collection(db,cfg[thread].comments,id,"replies"),{uid:u.uid,displayName:nameFor(u.uid),text:ta.value.trim(),parentReplyId:null,replyToName:d.displayName||"Fan",createdAt:serverTimestamp()});ta.value="";compose.hidden=true}catch(e){alert(friendlyAuthError(e))}finally{post.disabled=false}};
  root.appendChild(card);attachReplies(thread,id,card.querySelector(".comment-body"));
 });
}

function listen(thread){
 const c=cfg[thread],q=query(collection(db,c.comments),orderBy("createdAt","desc"));
 onSnapshot(q,snap=>{
  render(thread,snap);
  const docs=freshCommentDocs(snap);
  const count=document.getElementById(c.count);if(count)count.textContent=`${docs.length} comment${docs.length===1?"":"s"}`;
  let reactions=0;docs.forEach(d=>reactions+=Number(d.data().reactionCount||0));
  const r=document.getElementById(c.reaction);if(r)r.textContent=`${reactions} reaction${reactions===1?"":"s"}`;
 },e=>{const root=document.getElementById(c.list);if(root)root.innerHTML=`<div class="empty">Community could not load: ${esc(e.message||"Firestore permission error.")}</div>`});
}

const CONTENT_DEFAULTS={
 label:"COMMUNITY HUB • YOU MANIAC",campaign:"YOU MANIAC",heading:"More than a chat.",
 intro:"Explore fan features, make choices, see campaign results, track where the fandom is trending and join the conversation.",
 releaseTime:"04:00 PM",quote:"“It was never just a game for me.”",quoteBy:"Lade",
 outfitTitle:"Fan Favourite",outfitImage:"images/characters/Both2.JPG",viralTitle:"The Moment",viralImage:"images/characters/Both3.JPG",
 trender:"",maniac:0,pollQuestion:"Who owned the YOU MANIAC trailer look?",
 poll1:"William",poll1pct:0,poll2:"Dean",poll2pct:0,poll3:"Both",poll3pct:0,pollVotes:0,
 dean:0,moth:0,rating:"9.4",ratingsCount:5,posts:"4.12M",engagement:"7.5M",reach:"1.2B",countriesCount:"50+",countryList:"50+ countries",
 discussionPrompt:"What did you think of the YOU MANIAC trailer?",
 rules:"Keep discussions respectful or admin will remove you. You can join anonymously with a fan name. Let’s please be respectful to one another. We’re all here to support WilliamEst."
};
function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value??""}
function setImage(id,url,alt){const e=document.getElementById(id);if(e&&url){e.src=url;e.alt=alt||""}}
function applyCommunityContent(raw){
 const d={...CONTENT_DEFAULTS,...(raw||{})};
 // Community reset: never resurrect old demo leaderboard/poll values from Manager data.
 if(d.trender==="@Lade"||d.trender==="@westieforce"||d.trender==="@maniacsquad")d.trender="";
 d.pollQuestion=CONTENT_DEFAULTS.pollQuestion;d.poll1=CONTENT_DEFAULTS.poll1;d.poll2=CONTENT_DEFAULTS.poll2;d.poll3=CONTENT_DEFAULTS.poll3;d.poll1pct=0;d.poll2pct=0;d.poll3pct=0;d.pollVotes=0;
 d.rating="9.4";d.ratingsCount=5;d.posts="4.12M";d.engagement="7.5M";d.reach="1.2B";d.countriesCount="50+";d.countryList="50+ countries";
 setText("cmCampaign",d.campaign);setText("communityCountdown",d.releaseTime);
 setText("cmQuote",d.quote);setText("cmQuoteBy",`— ${d.quoteBy}`);
 setText("cmOutfitTitle",d.outfitTitle);setImage("cmOutfitImage",d.outfitImage,"Outfit of the episode");
 setText("cmViralTitle",d.viralTitle);setImage("cmViralImage",d.viralImage,"Most viral moment");
 setText("cmTrender",d.trender||"No Top Trender yet");setText("cmManiac",d.maniac);
 const mb=document.getElementById("cmManiacBar");if(mb)mb.style.width=`${d.maniac}%`;
 setText("cmPollQuestion",d.pollQuestion);
 [["cmPoll1",d.poll1,"cmPoll1Pct","cmPoll1Bar",d.poll1pct],["cmPoll2",d.poll2,"cmPoll2Pct","cmPoll2Bar",d.poll2pct],["cmPoll3",d.poll3,"cmPoll3Pct","cmPoll3Bar",d.poll3pct]].forEach(([n,o,p,b,v])=>{setText(n,o);setText(p,`${v}%`);const e=document.getElementById(b);if(e)e.style.width=`${v}%`});
 let localVote=null;try{const raw=localStorage.getItem("wtCommunityPollVote");if(raw!==null)localVote=Number(raw)}catch{}
 if(Number.isInteger(localVote)&&localVote>=0&&localVote<3){
   [["cmPoll1Pct","cmPoll1Bar"],["cmPoll2Pct","cmPoll2Bar"],["cmPoll3Pct","cmPoll3Bar"]].forEach(([pct,bar],i)=>{const v=i===localVote?100:0;setText(pct,v+"%");const el=document.getElementById(bar);if(el)el.style.width=v+"%"});
   setText("cmPollVotes","1");
 }else setText("cmPollVotes",d.pollVotes);
 setText("cmRating",d.rating);setText("cmRatingsCount",d.ratingsCount);setText("cmPosts",d.posts);setText("cmEngagement",d.engagement);setText("cmReach",d.reach);setText("cmCountries",String(d.countriesCount)==="50"?"50+":d.countriesCount);
 const countryRoot=document.getElementById("cmCountryList");if(countryRoot){countryRoot.innerHTML="<b>50+ countries</b>"}
 setText("cmDiscussionPrompt",d.discussionPrompt);setText("cmRules",d.rules);
}

async function loadPublishedCommunityContent(){
 try{const snap=await getDoc(doc(db,"communityContent","published"));applyCommunityContent(snap.exists()?snap.data():CONTENT_DEFAULTS)}
 catch(e){console.warn("Community content load failed; defaults used.",e);applyCommunityContent(CONTENT_DEFAULTS)}
}

const labels=[
 {m:14,t:"INNOCENT — FOR NOW"},{m:29,t:"LIED A LITTLE"},{m:49,t:"QUESTIONABLE CHOICES"},
 {m:64,t:"EMOTIONALLY CONFUSING"},{m:79,t:"MAJOR RED FLAG"},{m:91,t:"CALL YOUR THERAPIST"},{m:100,t:"YOU MANIAC"}
];
function meterText(v){return labels.find(x=>v<=x.m)?.t||labels[labels.length-1].t}
function bindMeter(id,valueId,labelId,fillId,thumbId){
 const input=document.getElementById(id),out=document.getElementById(valueId),text=document.getElementById(labelId);
 const col=input?.closest('.rf-slider-col'), line=col?.querySelector('.rf-slider-line'), thumb=col?.querySelector('.rf-slider-thumb');
 if(!input||!col||!line||!thumb)return;
 const update=()=>{
  const v=Math.max(0,Math.min(100,Number(input.value)||0));
  if(out)out.textContent=`${v}%`;
  if(text)text.textContent=meterText(v);
  thumb.style.bottom=`calc(${v}% - 12px)`;
 };
 const setFromPointer=(clientY)=>{
  const r=line.getBoundingClientRect();
  const ratio=Math.max(0,Math.min(1,(r.bottom-clientY)/r.height));
  input.value=Math.round(ratio*100);
  input.dispatchEvent(new Event('input',{bubbles:true}));
 };
 input.addEventListener('input',update);input.addEventListener('change',update);
 let dragging=false;
 const down=e=>{dragging=true;col.setPointerCapture?.(e.pointerId);setFromPointer(e.clientY);e.preventDefault()};
 const move=e=>{if(dragging){setFromPointer(e.clientY);e.preventDefault()}};
 const up=()=>{dragging=false};
 col.addEventListener('pointerdown',down);col.addEventListener('pointermove',move);col.addEventListener('pointerup',up);col.addEventListener('pointercancel',up);
 col.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowRight'){input.value=Math.min(100,Number(input.value)+1);update()}if(e.key==='ArrowDown'||e.key==='ArrowLeft'){input.value=Math.max(0,Number(input.value)-1);update()}});
 update();
}

// v12: reset only the Red Flag Meter UI once so old William/Dean values cannot mislabel Moth/Dean.
try{
 const RF_UI_VERSION='2026-09-03-v12';
 if(localStorage.getItem('wtRedFlagUIVersion')!==RF_UI_VERSION){localStorage.removeItem('wtRedFlagPlacements');localStorage.setItem('wtRedFlagUIVersion',RF_UI_VERSION)}
}catch{}
bindMeter('mothMeter','mothValue','mothLabel');bindMeter('deanMeter','deanValue','deanLabel');
function loadLocalMeters(){
 try{const v=JSON.parse(localStorage.getItem('wtRedFlagPlacements')||'null');if(!v)return;
  const moth=document.getElementById('mothMeter'),dean=document.getElementById('deanMeter');
  if(moth&&Number.isFinite(v.moth))moth.value=v.moth;if(dean&&Number.isFinite(v.dean))dean.value=v.dean;
  moth?.dispatchEvent(new Event('input'));dean?.dispatchEvent(new Event('input'));
 }catch{}
}
loadLocalMeters();

document.getElementById('saveMeters')?.addEventListener('click',()=>{
 const values={moth:Number(document.getElementById('mothMeter')?.value||0),dean:Number(document.getElementById('deanMeter')?.value||0)};
 localStorage.setItem('wtRedFlagPlacements',JSON.stringify(values));
 const note=document.getElementById('meterSaved');if(note)note.textContent='Saved on this device.';
});

// Fan Choice interaction is handled by the DOM safety net in community.html.

const themeToggle=document.getElementById("themeToggle");
// Community theme is intentionally LIGHT on every fresh page load.
// Dark mode is opt-in only through the visible toggle; no old localStorage
// theme value is allowed to force the page back to dark mode.
function applyTheme(mode){
  mode=mode==="dark"?"dark":"light";
  document.body.classList.toggle("dark",mode==="dark");
  document.body.classList.remove("light");
  if(themeToggle){
    themeToggle.innerHTML=mode==="light"?'☾ <span>Dark</span>':'☼ <span>Light</span>';
    themeToggle.setAttribute("aria-label",mode==="light"?'Switch to dark mode':'Switch to light mode');
  }
}
let savedTheme="light";
try{savedTheme=localStorage.getItem("wtCommunityTheme")==="dark"?"dark":"light"}catch{}
applyTheme(savedTheme);
if(themeToggle&&!themeToggle.dataset.themeBound){themeToggle.dataset.themeBound="1";themeToggle.addEventListener("click",()=>{const next=document.body.classList.contains("dark")?"light":"dark";applyTheme(next);try{localStorage.setItem("wtCommunityTheme",next)}catch{}})}

const episodeStats={
  1:{posts:"4.12M",engagement:"7.5M",reach:"1.2B",countries:"50+",rating:"9.4",ratings:5,countryList:["50+ countries"],xPosts:"4.12M",uniqueAuthors:"31.8K",platformRatings:[{name:"IMDb",score:"9.2"},{name:"MyDramaList",score:"8.3"},{name:"TMDB",score:"10.0"},{name:"Viki",score:"9.8"},{name:"iQIYI",score:"9.9"}],campaign:[
    {name:"#YouManiacSeriesEP1",results:"2.42M",engagement:"7.5M",reach:"1.2B"},
    {name:"#WilliamEst",results:"592.3K",engagement:"1.9M",reach:"82.9M"},
    {name:"Maniac Opening Night",results:"1.7M",engagement:"5.1M",reach:"228M"}
  ]},
  2:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]},
  3:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]},
  4:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]},
  5:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]},
  6:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]},
  7:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]},
  8:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]},
  9:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]},
  10:{posts:"—",engagement:"—",reach:"—",countries:"—",rating:"—",ratings:0,countryList:[],xPosts:"—",uniqueAuthors:"—",campaign:[]}
};
const episodeModal=document.getElementById("episodeStatsModal"),episodePicker=document.getElementById("episodePicker");
for(let i=1;i<=10;i++){const o=document.createElement("option");o.value=i;o.textContent=`EP ${String(i).padStart(2,"0")}`;episodePicker?.appendChild(o)}
function showEpisodeStats(n){const d=episodeStats[n]||episodeStats[1];const poster=document.getElementById("modalEpisodePoster");if(poster){poster.src=n===1?"images/stats/EP01.JPG":"images/brand/you-maniac-community-logo.png";poster.alt=n===1?"Episode 01 poster statistics":"Episode statistics placeholder";poster.classList.toggle("placeholder",n!==1)}setText("modalEpisodeTitle",`Episode ${String(n).padStart(2,"0")}`);setText("modalPosts",d.posts);setText("modalEngagement",d.engagement);setText("modalReach",d.reach);setText("modalCountries",d.countries);setText("modalRating",d.rating);setText("modalRatingsCount",d.ratings);setText("modalXPosts",d.xPosts||d.posts);setText("modalAuthors",d.uniqueAuthors||"—");
 const pr=document.getElementById("modalPlatformRatings");if(pr){pr.innerHTML="";(d.platformRatings||[]).forEach(x=>{const el=document.createElement("div");el.className="platform-rating-chip";el.innerHTML=`<span>${esc(x.name)}</span><b>${esc(x.score)}/10</b>`;pr.appendChild(el)});if(!(d.platformRatings||[]).length)pr.innerHTML='<span class="empty-modal-note">Platform scores will appear when this episode is rated.</span>'}
 if(episodePicker)episodePicker.value=n;const root=document.getElementById("modalCountryList");if(root){root.innerHTML="";(d.countryList||[]).forEach(c=>{const b=document.createElement("b");b.textContent=c;root.appendChild(b)});if(!(d.countryList||[]).length){const b=document.createElement("span");b.className="empty-modal-note";b.textContent="Country ranking can be added for this episode.";root.appendChild(b)}}const breakdown=document.getElementById("modalCampaignBreakdown");if(breakdown){breakdown.innerHTML="";(d.campaign||[]).forEach(x=>{const row=document.createElement("div");row.className="campaign-row";row.innerHTML=`<strong>${esc(x.name)}</strong><span><b>${esc(x.results)}</b> results</span><span><b>${esc(x.engagement)}</b> engagement</span><span><b>${esc(x.reach)}</b> reach</span>`;breakdown.appendChild(row)});if(!(d.campaign||[]).length)breakdown.innerHTML='<span class="empty-modal-note">Episode data will appear here when the episode is updated.</span>'}}
document.getElementById("openEpisodeStats")?.addEventListener("click",()=>{showEpisodeStats(1);episodeModal.hidden=false});document.getElementById("openEpisodeStats2")?.addEventListener("click",()=>{showEpisodeStats(1);episodeModal.hidden=false});document.getElementById("closeEpisodeStats")?.addEventListener("click",()=>episodeModal.hidden=true);episodeModal?.addEventListener("click",e=>{if(e.target===episodeModal)episodeModal.hidden=true});episodePicker?.addEventListener("change",e=>showEpisodeStats(Number(e.target.value)));document.getElementById("prevEpisode")?.addEventListener("click",()=>{let n=Math.max(1,Number(episodePicker.value)-1);showEpisodeStats(n)});document.getElementById("nextEpisode")?.addEventListener("click",()=>{let n=Math.min(10,Number(episodePicker.value)+1);showEpisodeStats(n)});

const video=document.getElementById("communityHeroVideo"),videoToggle=document.getElementById("videoToggle");
videoToggle?.addEventListener("click",()=>{
 if(video.paused){video.play();videoToggle.textContent="Pause";videoToggle.setAttribute("aria-label","Pause hero video")}
 else{video.pause();videoToggle.textContent="Play";videoToggle.setAttribute("aria-label","Play hero video")}
});

document.querySelectorAll(".community-nav a").forEach(a=>a.addEventListener("click",()=>{
 document.querySelectorAll(".community-nav a").forEach(x=>x.classList.remove("active"));a.classList.add("active");
}));

const behaviorModal=document.getElementById("behaviorModal");
document.getElementById("openRedFlagMeter")?.addEventListener("click",()=>{if(behaviorModal)behaviorModal.hidden=false;});
document.getElementById("openBehavior")?.addEventListener("click",()=>{ const m=Number(document.getElementById("mothMeter")?.value||0),d=Number(document.getElementById("deanMeter")?.value||0); setText("behaviorResult",`Moth: ${meterText(m)} · Dean: ${meterText(d)}`); });
document.getElementById("closeBehavior")?.addEventListener("click",()=>{if(behaviorModal)behaviorModal.hidden=true});
behaviorModal?.addEventListener("click",e=>{if(e.target===behaviorModal)behaviorModal.hidden=true});

async function startCommunity(){
 try{await ensureUser();await loadPublishedCommunityContent();if(document.getElementById("campaignThread"))listen("campaign")}
 catch(e){console.error("Community startup failed:",e);const msg=friendlyAuthError(e);}
}
onAuthStateChanged(auth,u=>{if(u){user=u;authReady=true;authError=null;updatePostButtons()}});
startCommunity();
