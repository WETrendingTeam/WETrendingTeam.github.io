const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");
const {
  getMessaging
} = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const YOUTUBE_API_KEY = defineSecret("YOUTUBE_API_KEY");


function chunks(list, size) {

  const out = [];

  for (
    let i = 0;
    i < list.length;
    i += size
  ) {
    out.push(
      list.slice(i, i + size)
    );
  }

  return out;
}


/* =========================================================
   SEND NOTIFICATION
========================================================= */

exports.sendNotification = onRequest(
  {
    region: "us-central1",
    cors: true
  },

  async (req, res) => {

    if (req.method !== "POST") {

      return res
        .status(405)
        .json({
          message: "POST required."
        });

    }


    try {

      /* -----------------------------------------------------
         AUTHENTICATE ADMIN
      ----------------------------------------------------- */

      const header =
        req.get("Authorization") || "";


      if (
        !header.startsWith(
          "Bearer "
        )
      ) {

        return res
          .status(401)
          .json({
            message:
              "Authentication required."
          });

      }


      const idToken =
        header.substring(7);


      const decoded =
        await getAuth()
          .verifyIdToken(
            idToken
          );


      const senderEmail =
        String(
          decoded.email || ""
        )
          .trim()
          .toLowerCase();


      if (
        senderEmail !==
        "wetrendingteam@gmail.com"
      ) {

        return res
          .status(403)
          .json({
            message:
              "Only the authorized Admin account can send notifications."
          });

      }


      /* -----------------------------------------------------
         READ REQUEST
      ----------------------------------------------------- */

      const title =
        String(
          req.body?.title || ""
        ).trim();


      const message =
        String(
          req.body?.message || ""
        ).trim();


      const audience =
        String(
          req.body?.audience ||
          "team"
        )
          .trim()
          .toLowerCase();


      const url =
        String(
          req.body?.url || ""
        ).trim();


      if (
        !title ||
        !message
      ) {

        return res
          .status(400)
          .json({
            message:
              "Title and message are required."
          });

      }


      if (
        ![
          "team",
          "space"
        ].includes(audience)
      ) {

        return res
          .status(400)
          .json({
            message:
              "Invalid notification audience."
          });

      }


      if (
        audience === "space" &&
        !url
      ) {

        return res
          .status(400)
          .json({
            message:
              "A destination URL is required for WETrending SPACE notifications."
          });

      }


      /* -----------------------------------------------------
         SAVE NOTIFICATION RECORD
      ----------------------------------------------------- */

      await db
        .collection(
          "notifications"
        )
        .add({

          title,

          message,

          audience,

          url:
            url || null,

          sender:
            decoded.email ||
            decoded.uid,

          deliveryMode:
            "http-v2",

          createdAt:
            FieldValue.serverTimestamp()

        });


      /* -----------------------------------------------------
         GET SUBSCRIBERS
      ----------------------------------------------------- */

      const tokenSnap =
        await db
          .collection(
            "fcmTokens"
          )
          .get();


      const tokens = [
        ...new Set(

          tokenSnap.docs

            .map(
              d => d.data()
            )

            .filter(
              data => {

                if (
                  audience ===
                  "space"
                ) {

                  return (
                    data?.subscriptions
                      ?.space === true
                  );

                }


                return (
                  data?.subscriptions
                    ?.team === true ||

                  !data?.subscriptions
                );

              }
            )

            .map(
              data => data.token
            )

            .filter(Boolean)

        )
      ];


      let sent = 0;
      let failed = 0;
      let removed = 0;


      const invalidTokens = [];


      /* -----------------------------------------------------
         SEND IN BATCHES
         FCM MULTICAST MAX = 500 TOKENS
      ----------------------------------------------------- */

      for (
        const batch of chunks(
          tokens,
          500
        )
      ) {

        const response =
          await getMessaging()
            .sendEachForMulticast({

              tokens: batch,

              notification: {

                title,

                body: message

              },

              webpush: {

                notification: {

                  title,

                  body: message,

                  icon:
                    "/images/logo.png",

                  badge:
                    "/images/logo.png"

                },

                data: {

                  title,

                  body: message,

                  url:
                    url || "/"

                },

                fcmOptions: {

                  link:
                    url ||
                    "https://wetrendingteam.github.io/"

                }

              }

            });


        sent +=
          response.successCount;


        failed +=
          response.failureCount;


        response.responses
          .forEach(
            (result, index) => {

              if (
                !result.success
              ) {

                const code =
                  result.error?.code ||
                  "";


                if (

                  code ===
                    "messaging/registration-token-not-registered" ||

                  code ===
                    "messaging/invalid-registration-token"

                ) {

                  invalidTokens.push(
                    batch[index]
                  );

                }

              }

            }
          );

      }


      /* -----------------------------------------------------
         REMOVE STALE TOKENS
      ----------------------------------------------------- */

      for (
        const token of invalidTokens
      ) {

        try {

          await db
            .collection(
              "fcmTokens"
            )
            .doc(token)
            .delete();


          removed++;

        } catch (
          cleanupError
        ) {

          console.warn(
            "Could not remove stale FCM token:",
            cleanupError.message
          );

        }

      }


      /* -----------------------------------------------------
         RESPONSE
      ----------------------------------------------------- */

      return res
        .status(200)
        .json({

          targeted:
            tokens.length,

          sent,

          failed,

          removed

        });


    } catch (error) {

      console.error(
        "sendNotification error:",
        error
      );


      return res
        .status(500)
        .json({

          message:
            error.message ||
            "Notification server error."

        });

    }

  }
);


/* =========================================================
   RED FLAG LIVE CHART TRACKER
   Apple/iTunes feeds + YouTube Data API
========================================================= */
const RED_FLAG_VIDEO_ID = "V58V1a-qiiw";
const RED_FLAG_TITLE = "Red Flag";
const RED_FLAG_ARTISTS = ["William", "Est"];
const RED_FLAG_COUNTRIES = [
  ["us","United States","🇺🇸"],["gb","United Kingdom","🇬🇧"],["th","Thailand","🇹🇭"],["ph","Philippines","🇵🇭"],
  ["id","Indonesia","🇮🇩"],["my","Malaysia","🇲🇾"],["sg","Singapore","🇸🇬"],["vn","Vietnam","🇻🇳"],
  ["kr","South Korea","🇰🇷"],["jp","Japan","🇯🇵"],["tw","Taiwan","🇹🇼"],["hk","Hong Kong","🇭🇰"],
  ["au","Australia","🇦🇺"],["nz","New Zealand","🇳🇿"],["ca","Canada","🇨🇦"],["de","Germany","🇩🇪"],
  ["fr","France","🇫🇷"],["it","Italy","🇮🇹"],["es","Spain","🇪🇸"],["br","Brazil","🇧🇷"],
  ["mx","Mexico","🇲🇽"],["nl","Netherlands","🇳🇱"],["se","Sweden","🇸🇪"],["no","Norway","🇳🇴"],
  ["dk","Denmark","🇩🇰"],["fi","Finland","🇫🇮"],["ch","Switzerland","🇨🇭"],["at","Austria","🇦🇹"],
  ["be","Belgium","🇧🇪"],["ie","Ireland","🇮🇪"],["za","South Africa","🇿🇦"],["ng","Nigeria","🇳🇬"],
  ["in","India","🇮🇳"]
];

async function jsonFetch(url){
  const response = await fetch(url, {headers:{"User-Agent":"WETrendingTeam-RedFlag-Tracker/1.0"}});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function normalize(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }
function isRedFlag(item){
  const name=normalize(item.name || item.trackName || item["im:name"]?.label || "");
  const artist=normalize(item.artistName || item["im:artist"]?.label || "");
  return name === normalize(RED_FLAG_TITLE) && RED_FLAG_ARTISTS.some(a=>artist.includes(normalize(a)));
}

async function findItunesLink(country){
  try{
    const url=`https://itunes.apple.com/search?term=${encodeURIComponent("Red Flag William Est")}&country=${country}&media=music&entity=song&limit=10`;
    const data=await jsonFetch(url);
    const hit=(data.results||[]).find(isRedFlag);
    return hit?.trackViewUrl || hit?.collectionViewUrl || null;
  }catch(e){ return null; }
}

async function collectRedFlagData(){
  const charts=[]; const buyLinks=[];
  const previousSnap=await db.collection("redFlagLive").doc("current").get();
  const previous=previousSnap.exists ? (previousSnap.data().charts||[]) : [];
  const previousMap=new Map(previous.map(x=>[x.countryCode,x.position]));

  await Promise.all(RED_FLAG_COUNTRIES.map(async ([code,country,flag])=>{
    try{
      const url=`https://itunes.apple.com/${code}/rss/topsongs/limit=200/explicit=true/json`;
      const data=await jsonFetch(url);
      const entries=data.feed?.entry||[];
      const index=entries.findIndex(isRedFlag);
      if(index>=0){
        const position=index+1; const old=previousMap.get(code);
        let movement="→ 0", movementClass="same";
        if(old && position<old){movement=`↑ ${old-position}`;movementClass="up";}
        if(old && position>old){movement=`↓ ${position-old}`;movementClass="down";}
        charts.push({countryCode:code,country,flag,position,movement,movementClass,link:entries[index].link?.attributes?.href||entries[index].link?.[1]?.attributes?.href||null});
      }
      const link=await findItunesLink(code);
      if(link) buyLinks.push({countryCode:code,country,flag,url:link});
    }catch(e){ console.warn(`Red Flag chart ${code} failed`,e.message); }
  }));

  let youtube=null;
  const key=YOUTUBE_API_KEY.value();
  if(key){
    try{
      const data=await jsonFetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${RED_FLAG_VIDEO_ID}&key=${encodeURIComponent(key)}`);
      const s=data.items?.[0]?.statistics;
      if(s) youtube={views:Number(s.viewCount||0),likes:Number(s.likeCount||0),comments:Number(s.commentCount||0)};
    }catch(e){ console.warn("Red Flag YouTube update failed",e.message); }
  }

  const payload={updatedAt:new Date().toISOString(),charts,buyLinks,youtube,source:{apple:"Apple/iTunes public chart feeds",youtube:"YouTube Data API"}};
  await db.collection("redFlagLive").doc("current").set(payload,{merge:false});
  return payload;
}

exports.refreshRedFlagCharts = onRequest({region:"us-central1",cors:true,secrets:[YOUTUBE_API_KEY]}, async (req,res)=>{
  try{return res.status(200).json(await collectRedFlagData());}
  catch(error){console.error("refreshRedFlagCharts error",error);return res.status(500).json({message:error.message||"Tracker update failed"});}
});

exports.redFlagLive = onRequest({region:"us-central1",cors:true}, async (req,res)=>{
  try{
    const snap=await db.collection("redFlagLive").doc("current").get();
    if(!snap.exists) return res.status(200).json({updatedAt:null,charts:[],buyLinks:[],youtube:null});
    return res.status(200).json(snap.data());
  }catch(error){console.error("redFlagLive error",error);return res.status(500).json({message:error.message||"Tracker read failed"});}
});

exports.redFlagScheduledUpdate = onSchedule({schedule:"every 1 hours",timeZone:"Africa/Lagos",region:"us-central1",secrets:[YOUTUBE_API_KEY]}, async ()=>{
  await collectRedFlagData();
});
