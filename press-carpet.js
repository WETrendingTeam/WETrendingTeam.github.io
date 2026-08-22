const photoInput=document.getElementById("photoInput");
const previewImage=document.getElementById("previewImage");
const placeholder=document.getElementById("placeholder");
const zoom=document.getElementById("zoom");
const moveX=document.getElementById("moveX");
const moveY=document.getElementById("moveY");
const username=document.getElementById("username");
const stop=document.getElementById("stop");
const stopPreview=document.getElementById("stopPreview");
const usernamePreview=document.getElementById("usernamePreview");
const status=document.getElementById("status");
let sourceImage=null;
const communityLogo=new Image();
communityLogo.src="images/you-maniac-community-logo.png";

photoInput.addEventListener("change",()=>{
  const file=photoInput.files[0];
  if(!file) return;
  if(!file.type.startsWith("image/")){status.textContent="Please choose an image file.";return;}
  const reader=new FileReader();
  reader.onload=e=>{
    sourceImage=new Image();
    sourceImage.onload=()=>{
      previewImage.src=e.target.result;
      previewImage.style.display="block";
      placeholder.style.display="none";
      status.textContent="Photo loaded — adjust the controls if needed.";
      update();
    };
    sourceImage.src=e.target.result;
  };
  reader.readAsDataURL(file);
});

function userName(){
  const value=username.value.trim();
  return value ? (value.startsWith("@")?value:"@"+value) : "@yourusername";
}
function update(){
  previewImage.style.setProperty("--zoom",zoom.value);
  previewImage.style.setProperty("--x",moveX.value+"px");
  previewImage.style.setProperty("--y",moveY.value+"px");
  stopPreview.textContent=stop.value;
  usernamePreview.textContent=userName();
}
[zoom,moveX,moveY,username,stop].forEach(el=>el.addEventListener("input",update));

document.getElementById("resetBtn").addEventListener("click",()=>{
  photoInput.value=""; sourceImage=null; previewImage.removeAttribute("src");
  previewImage.style.display="none"; placeholder.style.display="grid";
  zoom.value=1;moveX.value=0;moveY.value=0;username.value="";stop.selectedIndex=0;
  update();status.textContent="Upload a photo to begin.";
});

function canvas(){
  const c=document.createElement("canvas"),ctx=c.getContext("2d"),W=1200,H=1500;
  c.width=W;c.height=H;

  const bg=ctx.createRadialGradient(W/2,0,20,W/2,0,700);
  bg.addColorStop(0,"#7A35D1");
  bg.addColorStop(.32,"#2B1454");
  bg.addColorStop(1,"#140A28");
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  ctx.globalAlpha=.055;ctx.strokeStyle="#fff";ctx.lineWidth=2;
  for(let i=-H;i<W+H;i+=30){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+H,H);ctx.stroke()}
  ctx.globalAlpha=1;

  ctx.strokeStyle="#F0EF5F";ctx.lineWidth=2;ctx.strokeRect(28,28,W-56,H-56);

  // YouManiac community logo
  if(communityLogo.complete && communityLogo.naturalWidth){
    ctx.save();
    ctx.beginPath();ctx.arc(W/2,112,58,0,Math.PI*2);ctx.clip();
    ctx.drawImage(communityLogo,W/2-58,54,116,116);
    ctx.restore();
    ctx.strokeStyle="#F0EF5F";ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(W/2,112,60,0,Math.PI*2);ctx.stroke();
  }

  ctx.fillStyle="#F0EF5F";ctx.font='italic 700 27px "Times New Roman"';ctx.fillText("WILLIAMEST",75,92);
  ctx.fillStyle="#D459DD";ctx.font='italic 10px "Times New Roman"';ctx.fillText("YOU MANIAC SERIES • COMMUNITY PRESS TOUR",75,112);
  ctx.textAlign="right";
  ctx.fillStyle="#F0EF5F";ctx.font='italic 11px "Times New Roman"';ctx.fillText("YOU MANIAC",W-75,82);
  ctx.fillStyle="#fff";ctx.font='italic 700 22px "Times New Roman"';ctx.fillText("PRESS TOUR",W-75,111);
  ctx.textAlign="left";

  const px=180,py=260,pw=840,ph=920;
  ctx.fillStyle="#10091D";ctx.fillRect(px,py,pw,ph);
  ctx.strokeStyle="#F0EF5F";ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);

  if(sourceImage){
    const iw=sourceImage.naturalWidth,ih=sourceImage.naturalHeight;
    const base=Math.max(pw/iw,ph/ih),scale=base*parseFloat(zoom.value);
    const dw=iw*scale,dh=ih*scale;
    const x=px+pw/2-dw/2+parseFloat(moveX.value);
    const y=py+ph/2-dh/2+parseFloat(moveY.value);
    ctx.save();ctx.beginPath();ctx.rect(px,py,pw,ph);ctx.clip();ctx.drawImage(sourceImage,x,y,dw,dh);
    const shade=ctx.createLinearGradient(0,py,0,py+ph);
    shade.addColorStop(0,"rgba(0,0,0,.05)");shade.addColorStop(1,"rgba(0,0,0,.3)");
    ctx.fillStyle=shade;ctx.fillRect(px,py,pw,ph);ctx.restore();
  }else{
    ctx.textAlign="center";ctx.fillStyle="#5F3E87";ctx.font='italic 130px "Times New Roman"';ctx.fillText("YM",W/2,700);
    ctx.font='italic 12px "Times New Roman"';ctx.fillStyle="#66517A";ctx.fillText("YOUR WILLIAMEST PHOTO",W/2,750);ctx.textAlign="left";
  }

  ctx.fillStyle="#fff";ctx.font='italic 700 14px "Times New Roman"';ctx.fillText(stop.value,75,1370);
  ctx.fillStyle="#F0EF5F";ctx.font='italic 10px "Times New Roman"';ctx.fillText("OFFICIAL FAN EDITION",75,1395);
  ctx.textAlign="right";ctx.fillStyle="#FFD7FF";ctx.font='italic 12px "Times New Roman"';ctx.fillText(userName(),W-75,1392);ctx.textAlign="left";
  return c;
}

function requirePhoto(){
  if(sourceImage)return true;
  status.textContent="Upload a WilliamEst photo first.";
  document.querySelector(".pc-upload").scrollIntoView({behavior:"smooth",block:"center"});
  return false;
}
document.getElementById("downloadBtn").addEventListener("click",()=>{
  if(!requirePhoto())return;
  const link=document.createElement("a");link.download="westie-press-tour.png";link.href=canvas().toDataURL("image/png");link.click();
  status.textContent="Downloaded! Attach the image to your X post.";
});
document.getElementById("shareBtn").addEventListener("click",()=>{
  if(!requirePhoto())return;
  const text=`Just stepped onto the Westie Press Carpet! 🎬📸\n\n${userName()}\n\n#YouManiacPressTour #YouManiacSeries #WilliamEst #WestiePressTour`;
  window.open("https://twitter.com/intent/post?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
  status.textContent="X opened — attach the downloaded press photo to your post.";
});
update();
