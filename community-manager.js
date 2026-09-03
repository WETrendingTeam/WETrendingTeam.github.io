import { app, db } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(app);
const DEFAULTS = {
  label:"COMMUNITY HUB • YOU MANIAC",
  campaign:"YOU MANIAC",
  heading:"More than a chat.",
  intro:"Explore fan features, make choices, see campaign results, track where the fandom is trending and join the conversation.",
  releaseTime:"04:00 PM",
  quote:"“It was never just a game for me.”",
  quoteBy:"Lade",
  outfitTitle:"Fan Favourite",
  outfitImage:"images/heroes/hero2.jpg",
  viralTitle:"The Moment",
  viralImage:"images/heroes/hero1.jpg",
  trender:"",
  maniac:0,
  pollQuestion:"Fan Choice will open soon.",
  poll1:"Coming soon", poll1pct:0,
  poll2:"Coming soon", poll2pct:0,
  poll3:"Coming soon", poll3pct:0,
  pollVotes:0,
  dean:0, moth:0,
  rating:9.4, ratingsCount:5, posts:4120000, engagement:7500000, reach:1200000000, countriesCount:"50+",
  countryList:"",
  discussionPrompt:"What did you think of the YOU MANIAC trailer?",
  rules:"Keep discussions respectful or admin will remove you. You can join anonymously with a fan name. Let’s please be respectful to one another. We’re all here to support WilliamEst."
};

const ids = Object.keys(DEFAULTS);
const $ = id => document.getElementById(id);
const form = $("managerForm");
const status = $("status");
let current = {...DEFAULTS};

function setStatus(msg, good=false) {
  status.textContent = msg;
  status.className = `status ${good ? "ok" : ""}`;
}
function cleanNumber(v, min=0, max=1000000000) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
function collect() {
  const d = {};
  ids.forEach(id => {
    const el=$(id);
    if (!el) return;
    d[id] = el.type === "number" ? cleanNumber(el.value, 0, id.includes("pct")||["maniac","dean","moth"].includes(id) ? 100 : 1000000000) : el.value.trim();
  });
  return {...DEFAULTS, ...d, updatedAt: serverTimestamp()};
}
function fill(data) {
  current = {...DEFAULTS, ...(data||{})};
  ids.forEach(id => {
    const el=$(id);
    if (el && current[id] !== undefined) el.value = current[id];
  });
  refreshPreview();
}
function refreshPreview() {
  const d=collect();
  $("previewBox").innerHTML =
    `<b>${escapeHtml(d.label)}</b><br>${escapeHtml(d.heading)}<br>`+
    `<strong>${escapeHtml(d.campaign)}</strong> · Dean ${d.dean}% · Moth ${d.moth}%<br>`+
    `Quote: ${escapeHtml(d.quote)} — ${escapeHtml(d.quoteBy)}<br>`+
    `Poll: ${escapeHtml(d.pollQuestion)} · ${d.pollVotes} votes<br>`+
    `Discussion: ${escapeHtml(d.discussionPrompt)}`;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function loadDoc(path) {
  const snap=await getDoc(doc(db,"communityContent",path));
  return snap.exists() ? snap.data() : null;
}
async function ensureAuthorized(user) {
  const email=(user?.email||"").toLowerCase();
  return email === "lade.galleria@gmail.com" || email === "wetrendingteam@gmail.com";
}

onAuthStateChanged(auth, async user => {
  if (!user || !(await ensureAuthorized(user))) {
    window.location.replace("control-center.html");
    return;
  }
  try {
    const published = await loadDoc("published");
    const draft = await loadDoc("draft");
    fill(draft || published || DEFAULTS);
    setStatus(draft ? "Draft loaded." : "Ready.");
  } catch (e) {
    console.error(e);
    setStatus("Could not load Community content. Publish the Community Manager Firestore rule first.");
  }
});

$("refreshPreview").addEventListener("click", refreshPreview);

$("saveDraft").addEventListener("click", async () => {
  try {
    await setDoc(doc(db,"communityContent","draft"), collect(), {merge:false});
    setStatus("Draft saved.", true);
  } catch(e) {
    console.error(e);
    setStatus(`Draft could not be saved: ${e.message}`, false);
  }
});

$("publish").addEventListener("click", async () => {
  if (!confirm("Publish this Community content now?")) return;
  try {
    const data=collect();
    await setDoc(doc(db,"communityContent","published"), data, {merge:false});
    setStatus("Published. Fans will see the new Community content.", true);
  } catch(e) {
    console.error(e);
    setStatus(`Publish failed: ${e.message}`, false);
  }
});

$("logout").addEventListener("click", async () => {
  await signOut(auth);
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userUID");
  window.location.replace("control-center.html");
});

form.addEventListener("input", refreshPreview);
