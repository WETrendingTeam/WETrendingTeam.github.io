import { app, db } from "./firebase-config.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
  doc, setDoc, deleteDoc, getDoc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(app);

const cfg = {
  episode: { comments:"communityEpisodeComments", count:"episodeCommentCount", reaction:"episodeReactionCount", list:"episodeComments" },
  campaign: { comments:"communityCampaignComments", count:"campaignCommentCount", reaction:"campaignReactionCount", list:"campaignComments" }
};

const names=["Fan","Trendsetter","WE Fan","Community Member","Supporter"];
let user=null, authReady=false, authError=null, signInPromise=null;

function friendlyAuthError(error){
  const code=error?.code||"";
  if(code==="auth/operation-not-allowed") return "Anonymous sign-in is disabled. In Firebase, enable Anonymous sign-in.";
  if(code==="auth/unauthorized-domain") return `This website (${location.hostname}) is not authorized in Firebase Authentication.`;
  if(code==="auth/network-request-failed") return "Firebase could not connect. Check your internet connection.";
  return error?.message||"Firebase authentication failed.";
}
function getSavedName(){return(localStorage.getItem("wtCommunityName")||"").trim();}
function makeFallbackName(uid){const n=[...uid].reduce((a,c)=>a+c.charCodeAt(0),0);return names[n%names.length];}
function nameFor(uid){const saved=getSavedName();if(saved)return saved;const generated=makeFallbackName(uid);localStorage.setItem("wtCommunityName",generated);return generated;}

function showNameGate(){
  return new Promise(resolve=>{
    document.getElementById("communityNameGate")?.remove();
    const overlay=document.createElement("div");
    overlay.id="communityNameGate"; overlay.className="community-gate";
    overlay.innerHTML=`<div class="community-gate-card"><div class="gate-icon">💬</div><h2>Join the conversation</h2><p>You don't need a real account. Choose a fan name and continue anonymously.</p><input id="communityNameInput" maxlength="30" placeholder="Your fan name (optional)" autocomplete="nickname"><div class="gate-actions"><button type="button" class="gate-skip">Continue as Fan</button><button type="button" class="gate-join">Join Community</button></div><small>Your fan name is only used to display your comments and replies.</small></div>`;
    document.body.appendChild(overlay);
    const input=overlay.querySelector("#communityNameInput"); const saved=getSavedName(); if(saved) input.value=saved;
    const finish=value=>{const cleaned=String(value||"").trim().slice(0,30);localStorage.setItem("wtCommunityName",cleaned||"Fan");overlay.remove();resolve(cleaned||"Fan");};
    overlay.querySelector(".gate-skip").onclick=()=>finish("Fan");
    overlay.querySelector(".gate-join").onclick=()=>finish(input.value);
    input.onkeydown=e=>{if(e.key==="Enter")finish(input.value);}; setTimeout(()=>input.focus(),50);
  });
}
async function ensureUser({askName=false}={}){
  if(user){if(askName&&!getSavedName())await showNameGate();return user;}
  if(authError)throw authError;
  if(!signInPromise){
    signInPromise=signInAnonymously(auth).then(r=>{user=r.user;authReady=true;updatePostButtons();return user;}).catch(e=>{authError=e;authReady=true;updatePostButtons();throw e;});
  }
  const u=await signInPromise; if(askName&&!getSavedName())await showNameGate(); return u;
}
function updatePostButtons(){
  document.querySelectorAll(".comment-form button[type=submit]").forEach(b=>{b.disabled=!authReady||!!authError;if(authError)b.title=friendlyAuthError(authError);});
}
function time(ts){
  if(!ts?.toDate)return"just now";
  const m=Math.max(0,Math.round((Date.now()-ts.toDate().getTime())/60000));
  if(m<1)return"just now"; if(m<60)return`${m}m ago`; const h=Math.round(m/60); if(h<24)return`${h}h ago`; return`${Math.round(h/24)}d ago`;
}
function esc(v){const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML;}

function attachReplies(thread,commentId,wrap){
  const root=document.createElement("div");root.className="replies";root.innerHTML=`<div class="replies-loading">Loading replies…</div>`;wrap.appendChild(root);
  const q=query(collection(db,cfg[thread].comments,commentId,"replies"),orderBy("createdAt","asc"));
  onSnapshot(q,snap=>{
    root.innerHTML=""; const replies=[]; snap.forEach(x=>replies.push({id:x.id,...x.data()}));
    const byParent=new Map(); replies.forEach(r=>{const k=r.parentReplyId||"__root__";if(!byParent.has(k))byParent.set(k,[]);byParent.get(k).push(r);});
    const renderLevel=(parentId,parentEl,depth=0)=>{
      (byParent.get(parentId)||[]).forEach(d=>{
        const el=document.createElement("div");el.className="reply";el.style.marginLeft=`${Math.min(depth,4)*12}px`;
        el.innerHTML=`<div class="reply-avatar">${esc((d.displayName||"F")[0].toUpperCase())}</div><div class="reply-body"><strong class="reply-name">${esc(d.displayName||"Fan")}</strong><span class="reply-time">${time(d.createdAt)}</span><div class="reply-target">${d.replyToName?`Replying to ${esc(d.replyToName)}`:""}</div><div class="reply-text">${esc(d.text||"")}</div><button class="reply-to-btn" type="button">↩ Reply</button><div class="nested-reply-box" hidden><textarea maxlength="500" placeholder="Reply to this fan..."></textarea><button type="button">Post Reply</button></div></div>`;
        const box=el.querySelector(".nested-reply-box"), ta=box.querySelector("textarea"), btn=box.querySelector("button");
        el.querySelector(".reply-to-btn").onclick=async()=>{try{await ensureUser({askName:true});box.hidden=!box.hidden;if(!box.hidden)ta.focus();}catch(e){alert(friendlyAuthError(e));}};
        btn.onclick=async()=>{if(!ta.value.trim())return;btn.disabled=true;try{const u=await ensureUser({askName:true});await addDoc(collection(db,cfg[thread].comments,commentId,"replies"),{uid:u.uid,displayName:nameFor(u.uid),text:ta.value.trim(),parentReplyId:d.id,replyToName:d.displayName||"Fan",createdAt:serverTimestamp()});ta.value="";box.hidden=true;}catch(e){alert(`Could not post reply.\n\n${friendlyAuthError(e)}`);}finally{btn.disabled=false;}};
        parentEl.appendChild(el);renderLevel(d.id,parentEl,depth+1);
      });
    };
    renderLevel("__root__",root); if(!replies.length)root.innerHTML="";
  },()=>{root.innerHTML="";});
}

async function toggleReaction(thread,id,button){
  const u=await ensureUser({askName:true}); const ref=doc(db,cfg[thread].comments,id,"reactions",u.uid); const snap=await getDoc(ref);
  if(snap.exists()){await deleteDoc(ref);await updateDoc(doc(db,cfg[thread].comments,id),{reactionCount:increment(-1)});button.classList.remove("reacted");}
  else{await setDoc(ref,{uid:u.uid,createdAt:serverTimestamp()});await updateDoc(doc(db,cfg[thread].comments,id),{reactionCount:increment(1)});button.classList.add("reacted");}
}

function render(thread,snap){
  const root=document.getElementById(cfg[thread].list); if(!root)return;
  root.innerHTML="";
  if(snap.empty){root.innerHTML=`<div class="empty">No comments yet. Be the first to join the conversation.</div>`;return;}
  snap.forEach(ds=>{
    const d=ds.data(), id=ds.id, card=document.createElement("article");card.className="comment";
    card.innerHTML=`<div class="comment-avatar">${esc((d.displayName||"F")[0].toUpperCase())}</div><div class="comment-body"><div class="comment-head"><strong>${esc(d.displayName||"Fan")}</strong><span>${time(d.createdAt)}</span></div><div class="comment-text">${esc(d.text||"")}</div><div class="comment-actions"><button type="button" class="reaction-btn">♥ <span>${Number(d.reactionCount||0)}</span></button><button type="button" class="reply-open-btn">↩ Reply</button></div><div class="reply-compose" hidden><textarea maxlength="500" placeholder="Reply to this fan..."></textarea><button type="button">Post Reply</button></div></div>`;
    const reaction=card.querySelector(".reaction-btn");reaction.onclick=async()=>{try{await toggleReaction(thread,id,reaction);}catch(e){alert(friendlyAuthError(e));}};
    const compose=card.querySelector(".reply-compose"), ta=compose.querySelector("textarea"), post=compose.querySelector("button");
    card.querySelector(".reply-open-btn").onclick=async()=>{try{await ensureUser({askName:true});compose.hidden=!compose.hidden;if(!compose.hidden)ta.focus();}catch(e){alert(friendlyAuthError(e));}};
    post.onclick=async()=>{if(!ta.value.trim())return;post.disabled=true;try{const u=await ensureUser({askName:true});await addDoc(collection(db,cfg[thread].comments,id,"replies"),{uid:u.uid,displayName:nameFor(u.uid),text:ta.value.trim(),parentReplyId:null,replyToName:d.displayName||"Fan",createdAt:serverTimestamp()});ta.value="";compose.hidden=true;}catch(e){alert(friendlyAuthError(e));}finally{post.disabled=false;}};
    root.appendChild(card);attachReplies(thread,id,card.querySelector(".comment-body"));
  });
}

function listen(thread){
  const c=cfg[thread],q=query(collection(db,c.comments),orderBy("createdAt","desc"));
  onSnapshot(q,snap=>{render(thread,snap);const count=document.getElementById(c.count);if(count)count.textContent=`${snap.size} comment${snap.size===1?"":"s"}`;let reactions=0;snap.forEach(d=>reactions+=Number(d.data().reactionCount||0));const r=document.getElementById(c.reaction);if(r)r.textContent=`${reactions} reaction${reactions===1?"":"s"}`;},e=>{const root=document.getElementById(c.list);if(root)root.innerHTML=`<div class="empty">Community could not load: ${esc(e.message||"Firestore permission error.")}</div>`;});
}

document.querySelectorAll(".comment-form").forEach(form=>form.addEventListener("submit",async e=>{
  e.preventDefault();const button=form.querySelector("button[type=submit]"),ta=form.querySelector("textarea"),text=ta.value.trim();if(!text)return;
  button.disabled=true;button.textContent="Posting…";
  try{const u=await ensureUser({askName:true});await addDoc(collection(db,cfg[form.dataset.thread].comments),{uid:u.uid,displayName:nameFor(u.uid),text,reactionCount:0,createdAt:serverTimestamp()});ta.value="";}
  catch(error){alert(`We couldn't post your comment yet.\n\n${friendlyAuthError(error)}`);}
  finally{button.textContent="Post Comment";updatePostButtons();}
}));

document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".thread-view").forEach(x=>x.classList.remove("active"));tab.classList.add("active");document.getElementById(`${tab.dataset.thread}Thread`)?.classList.add("active");}));

const CONTENT_DEFAULTS={
  label:"COMMUNITY HUB • YOU MANIAC",campaign:"YOU MANIAC",heading:"More than a chat.",
  intro:"Explore fan features, make choices, see campaign results, track where the fandom is trending and join the conversation.",
  releaseTime:"04:00 PM",quote:"“It was never just a game for me.”",quoteBy:"Lade",
  outfitTitle:"Fan Favourite",outfitImage:"images/hero2.jpg",viralTitle:"The Moment",viralImage:"images/hero1.jpg",
  trender:"@Lade",maniac:0,pollQuestion:"What did you think of the YOU MANIAC trailer looks?",
  poll1:"Look 1",poll1pct:0,poll2:"Look 2",poll2pct:0,poll3:"Look 3",poll3pct:0,pollVotes:0,
  dean:0,moth:0,rating:0,ratingsCount:0,posts:0,engagement:0,reach:0,countriesCount:0,countryList:"",
  discussionPrompt:"What did you think of the YOU MANIAC trailer?",
  rules:"Keep discussions respectful or admin will remove you. You can join anonymously with a fan name. Let’s please be respectful to one another. We’re all here to support WilliamEst."
};
function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value??"";}
function setImage(id,url,alt){const e=document.getElementById(id);if(e&&url){e.src=url;e.alt=alt||"";}}
function applyCommunityContent(raw){
  const d={...CONTENT_DEFAULTS,...(raw||{})};
  setText("cmLabel",d.label);setText("cmCampaign",d.campaign);setText("cmHeading",d.heading);setText("cmIntro",d.intro);setText("communityCountdown",d.releaseTime);
  setText("cmQuote",d.quote);setText("cmQuoteBy",`— ${d.quoteBy}`);setText("cmOutfitTitle",d.outfitTitle);setImage("cmOutfitImage",d.outfitImage,"Fan favourite");
  setText("cmViralTitle",d.viralTitle);setImage("cmViralImage",d.viralImage,"Most viral moment");setText("cmTrender",d.trender);setText("cmManiac",d.maniac);
  const mb=document.getElementById("cmManiacBar");if(mb)mb.style.width=`${d.maniac}%`;setText("cmPollQuestion",d.pollQuestion);
  [["cmPoll1",d.poll1,"cmPoll1Pct","cmPoll1Bar",d.poll1pct],["cmPoll2",d.poll2,"cmPoll2Pct","cmPoll2Bar",d.poll2pct],["cmPoll3",d.poll3,"cmPoll3Pct","cmPoll3Bar",d.poll3pct]].forEach(([n,o,p,b,v])=>{setText(n,o);setText(p,`${v}%`);const e=document.getElementById(b);if(e)e.style.width=`${v}%`;});
  setText("cmPollVotes",d.pollVotes);const dean=document.getElementById("deanMeter"),moth=document.getElementById("mothMeter");if(dean)dean.value=d.dean;if(moth)moth.value=d.moth;dean?.dispatchEvent(new Event("input"));moth?.dispatchEvent(new Event("input"));
  setText("cmRating",d.rating);setText("cmRatingsCount",d.ratingsCount);setText("cmPosts",d.posts);setText("cmEngagement",d.engagement);setText("cmReach",d.reach);setText("cmCountries",d.countriesCount);
  const countryRoot=document.getElementById("cmCountryList");if(countryRoot){countryRoot.innerHTML="";String(d.countryList||"").split(",").map(x=>x.trim()).filter(Boolean).forEach(c=>{const b=document.createElement("b");b.textContent=c;countryRoot.appendChild(b);});}
  setText("cmDiscussionPrompt",d.discussionPrompt);const rules=document.getElementById("cmRules");if(rules)rules.textContent=d.rules;
}
async function loadPublishedCommunityContent(){
  try{const snap=await getDoc(doc(db,"communityContent","published"));applyCommunityContent(snap.exists()?snap.data():CONTENT_DEFAULTS);}
  catch(e){console.warn("Community content load failed; defaults used.",e);applyCommunityContent(CONTENT_DEFAULTS);}
}
async function startCommunity(){
  try{await ensureUser();await loadPublishedCommunityContent();listen("episode");if(document.getElementById("campaignThread"))listen("campaign");}
  catch(e){console.error("Community startup failed:",e);const msg=friendlyAuthError(e);["episode","campaign"].forEach(t=>{const r=document.getElementById(cfg[t].list);if(r)r.innerHTML=`<div class="empty">Community sign-in failed: ${esc(msg)}</div>`;});}
}
onAuthStateChanged(auth,u=>{if(u){user=u;authReady=true;authError=null;updatePostButtons();}});
startCommunity();
