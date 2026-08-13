import { app, db } from "./firebase-config.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(app);

const cfg = {
  episode: {
    comments: "communityEpisodeComments",
    count: "episodeCommentCount",
    reaction: "episodeReactionCount",
    list: "episodeComments"
  },
  campaign: {
    comments: "communityCampaignComments",
    count: "campaignCommentCount",
    reaction: "campaignReactionCount",
    list: "campaignComments"
  }
};

const names = ["Fan", "Trendsetter", "WE Fan", "Community Member", "Supporter"];
let user = null;
let authReady = false;
let authError = null;
let signInPromise = null;

function friendlyAuthError(error) {
  const code = error?.code || "";
  if (code === "auth/operation-not-allowed") {
    return "Anonymous sign-in is disabled. In Firebase, open Authentication → Sign-in method and enable Anonymous.";
  }
  if (code === "auth/unauthorized-domain") {
    return `This website (${location.hostname}) is not authorized in Firebase Authentication. Add ${location.hostname} under Authentication → Settings → Authorized domains.`;
  }
  if (code === "auth/network-request-failed") {
    return "Firebase could not connect. Check your internet connection and try again.";
  }
  return error?.message || "Firebase authentication failed.";
}

function getSavedName() {
  return (localStorage.getItem("wtCommunityName") || "").trim();
}

function makeFallbackName(uid) {
  const n = [...uid].reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${names[n % names.length]}`;
}

function nameFor(uid) {
  const saved = getSavedName();
  if (saved) return saved;
  const generated = makeFallbackName(uid);
  localStorage.setItem("wtCommunityName", generated);
  return generated;
}

function showNameGate() {
  return new Promise(resolve => {
    const existing = document.getElementById("communityNameGate");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "communityNameGate";
    overlay.className = "community-gate";
    overlay.innerHTML = `
      <div class="community-gate-card">
        <div class="gate-icon">💬</div>
        <h2>Join the conversation</h2>
        <p>You don't need a real account. Choose a fan name and continue anonymously.</p>
        <input id="communityNameInput" maxlength="30" placeholder="Your fan name (optional)" autocomplete="nickname">
        <div class="gate-actions">
          <button type="button" class="gate-skip">Continue as Fan</button>
          <button type="button" class="gate-join">Join Community</button>
        </div>
        <small>Your fan name is only used to display your comments and replies.</small>
      </div>`;

    document.body.appendChild(overlay);
    const input = overlay.querySelector("#communityNameInput");
    const saved = getSavedName();
    if (saved) input.value = saved;

    const finish = value => {
      const cleaned = value.trim().slice(0, 30);
      localStorage.setItem("wtCommunityName", cleaned || "Fan");
      overlay.remove();
      resolve(cleaned || "Fan");
    };

    overlay.querySelector(".gate-skip").addEventListener("click", () => finish("Fan"));
    overlay.querySelector(".gate-join").addEventListener("click", () => finish(input.value));
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") finish(input.value);
    });
    setTimeout(() => input.focus(), 50);
  });
}

async function ensureUser({askName = false} = {}) {
  if (user) {
    if (askName && !getSavedName()) await showNameGate();
    return user;
  }
  if (authError) throw authError;

  if (!signInPromise) {
    signInPromise = signInAnonymously(auth)
      .then(result => {
        user = result.user;
        authReady = true;
        updatePostButtons();
        return user;
      })
      .catch(error => {
        authError = error;
        authReady = true;
        updatePostButtons();
        console.error("Community authentication failed:", error);
        throw error;
      });
  }

  const u = await signInPromise;
  if (askName && !getSavedName()) await showNameGate();
  return u;
}

function updatePostButtons() {
  document.querySelectorAll(".comment-form button[type=submit]").forEach(button => {
    button.disabled = !authReady || !!authError;
    if (authError) button.title = friendlyAuthError(authError);
  });
}

function time(ts) {
  if (!ts?.toDate) return "just now";
  const m = Math.max(0, Math.round((Date.now() - ts.toDate().getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

async function addReply(thread, commentId, text, container, parentReplyId = null, replyToName = null) {
  const u = await ensureUser({askName: true});
  const replyText = text.trim();
  if (!replyText) return;

  await addDoc(collection(db, cfg[thread].comments, commentId, "replies"), {
    uid: u.uid,
    displayName: nameFor(u.uid),
    text: replyText,
    parentReplyId: parentReplyId || null,
    replyToName: replyToName || null,
    createdAt: serverTimestamp()
  });

  container.innerHTML = "";
  container.hidden = true;
}

function attachReplies(thread, commentId, wrap) {
  const repliesRoot = document.createElement("div");
  repliesRoot.className = "replies";
  repliesRoot.innerHTML = `<div class="replies-loading">Loading replies…</div>`;
  wrap.appendChild(repliesRoot);

  const q = query(
    collection(db, cfg[thread].comments, commentId, "replies"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snap => {
    repliesRoot.innerHTML = "";
    const replies = [];
    snap.forEach(item => replies.push({ id: item.id, ...item.data() }));
    const byParent = new Map();
    replies.forEach(r => {
      const key = r.parentReplyId || "__root__";
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(r);
    });

    const renderLevel = (parentId, parentEl, depth = 0) => {
      (byParent.get(parentId) || []).forEach(d => {
        const reply = document.createElement("div");
        reply.className = "reply";
        reply.style.marginLeft = `${Math.min(depth, 4) * 12}px`;
        reply.innerHTML = `
          <div class="reply-avatar">${(d.displayName || "F")[0].toUpperCase()}</div>
          <div class="reply-body">
            <strong class="reply-name"></strong>
            <span class="reply-time">${time(d.createdAt)}</span>
            <div class="reply-target"></div>
            <div class="reply-text"></div>
            <button class="reply-to-btn" type="button">↩ Reply</button>
            <div class="nested-reply-box" hidden>
              <textarea maxlength="500" placeholder="Reply to this fan..."></textarea>
              <button type="button">Post Reply</button>
            </div>
          </div>`;
        reply.querySelector(".reply-name").textContent = d.displayName || "Fan";
        reply.querySelector(".reply-text").textContent = d.text || "";
        const target = reply.querySelector(".reply-target");
        if (d.replyToName) {
          target.textContent = `Replying to ${d.replyToName}`;
          target.className = "reply-target visible";
        }

        const replyBox = reply.querySelector(".nested-reply-box");
        const replyToBtn = reply.querySelector(".reply-to-btn");
        const textarea = replyBox.querySelector("textarea");
        const submit = replyBox.querySelector("button");
        replyToBtn.addEventListener("click", async () => {
          try {
            await ensureUser({askName: true});
            replyBox.hidden = !replyBox.hidden;
            if (!replyBox.hidden) textarea.focus();
          } catch (error) {
            alert(`We couldn't open replies.\\n\\n${friendlyAuthError(error)}`);
          }
        });
        submit.addEventListener("click", async () => {
          if (!textarea.value.trim()) return;
          submit.disabled = true;
          submit.textContent = "Posting…";
          try {
            await addReply(thread, commentId, textarea.value, replyBox, d.id, d.displayName || "Fan");
          } catch (error) {
            console.error("Nested reply post failed:", error);
            alert(`We couldn't post your reply.\\n\\n${friendlyAuthError(error)}`);
          } finally {
            submit.disabled = false;
            submit.textContent = "Post Reply";
          }
        });

        parentEl.appendChild(reply);
        renderLevel(d.id, parentEl, depth + 1);
      });
    };

    renderLevel("__root__", repliesRoot, 0);
    if (!replies.length) repliesRoot.innerHTML = "";
  }, error => {
    console.error("Reply listener failed:", error);
    repliesRoot.innerHTML = "";
  });
}

async function toggleReaction(thread, id, button) {
  const u = await ensureUser({askName: true});
  const ref = doc(db, cfg[thread].comments, id, "reactions", u.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await deleteDoc(ref);
    await updateDoc(doc(db, cfg[thread].comments, id), { reactionCount: increment(-1) });
    button.classList.remove("reacted");
  } else {
    await setDoc(ref, { uid: u.uid, createdAt: serverTimestamp() });
    await updateDoc(doc(db, cfg[thread].comments, id), { reactionCount: increment(1) });
    button.classList.add("reacted");
  }
}

function listen(thread) {
  const c = cfg[thread];
  const q = query(collection(db, c.comments), orderBy("createdAt", "desc"));

  onSnapshot(q, snap => {
    render(thread, snap);
    document.getElementById(c.count).textContent = `${snap.size} comment${snap.size === 1 ? "" : "s"}`;

    let reactions = 0;
    snap.forEach(d => reactions += Number(d.data().reactionCount || 0));
    document.getElementById(c.reaction).textContent = `${reactions} reaction${reactions === 1 ? "" : "s"}`;
  }, error => {
    console.error(`Community ${thread} listener failed:`, error);
    const root = document.getElementById(c.list);
    root.innerHTML = `<div class="empty">Community could not load: ${error.message || "Firestore permission error."}</div>`;
  });
}

document.querySelectorAll(".comment-form").forEach(form => {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const textarea = form.querySelector("textarea");
    const text = textarea.value.trim();
    if (!text) return;

    button.disabled = true;
    button.textContent = "Posting…";

    try {
      const u = await ensureUser({askName: true});
      await addDoc(collection(db, cfg[form.dataset.thread].comments), {
        uid: u.uid,
        displayName: nameFor(u.uid),
        text,
        reactionCount: 0,
        createdAt: serverTimestamp()
      });
      textarea.value = "";
    } catch (error) {
      console.error("Comment post failed:", error);
      let message = friendlyAuthError(error);
      if (error?.code === "permission-denied") {
        message = "Firestore rejected the comment. Publish the Firestore rules included in this build.";
      }
      alert(`We couldn't post your comment yet.\n\n${message}`);
    } finally {
      button.textContent = "Post Comment";
      updatePostButtons();
    }
  });
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".thread-view").forEach(x => x.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.thread}Thread`).classList.add("active");
  });
});

// Start authentication BEFORE attaching Firestore listeners.
// This prevents the listeners from making an unauthenticated request first,
// which would otherwise fail permanently with "Missing or insufficient permissions".
async function startCommunity() {
  try {
    await ensureUser();
    listen("episode");
  } catch (error) {
    console.error("Community startup failed:", error);
    const message = friendlyAuthError(error);
    ["episode"].forEach(thread => {
      const root = document.getElementById(cfg[thread].list);
      if (root) root.innerHTML = `<div class="empty">Community sign-in failed: ${message}</div>`;
    });
  }
}

onAuthStateChanged(auth, currentUser => {
  if (currentUser) {
    user = currentUser;
    authReady = true;
    authError = null;
    updatePostButtons();
  }
});

startCommunity();
