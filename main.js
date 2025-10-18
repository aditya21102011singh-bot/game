const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameRunning = false;
let player = { x: canvas.width/2-25, y: canvas.height-100, width:50, height:50, dy:0, canDoubleJump:true, shield:false };
let gravity=0.8, jumpStrength=-15;
let keys = {}, score=0, level=1, scrollSpeed=2;
let platforms=[], hazards=[], powerUps=[], particles=[];
let gameOver=false;
let highScores = JSON.parse(localStorage.getItem('highScores')||'[]');

// --- UI ---
const menu = document.getElementById('menu');
const playBtn = document.getElementById('playBtn');
const highBtn = document.getElementById('highBtn');
const scoreDiv = document.getElementById('score');
const levelDiv = document.getElementById('level');
const scoreBoard = document.getElementById('scoreBoard');
const pauseBtn = document.getElementById('pauseBtn');
const highDiv = document.getElementById('highScores');
const highList = document.getElementById('highList');

playBtn.onclick = ()=>{ menu.style.display='none'; scoreBoard.style.display='block'; gameRunning=true; };
highBtn.onclick = ()=>{ showHighScores(); };
pauseBtn.onclick = ()=>{ gameRunning=!gameRunning; if(gameRunning) update(); };
function showHighScores(){ highDiv.style.display='block'; highList.innerHTML=''; highScores.slice(0,5).forEach(s=>{ highList.innerHTML+=`<li>${s}</li>`; }); }
function closeHighScores(){ highDiv.style.display='none'; }

// --- Input ---
document.addEventListener('keydown', e=>keys[e.code]=true);
document.addEventListener('keyup', e=>keys[e.code]=false);
document.addEventListener('keydown', e=>{ if(e.code=='Space'){ jump(); }});
document.addEventListener('touchstart', e=>{ jump(); touchStartX = e.touches[0].clientX;});
document.addEventListener('touchmove', e=>{ let dx=e.touches[0].clientX-touchStartX; player.x+=dx*0.05; touchStartX=e.touches[0].clientX;});
let touchStartX=0;

// --- Jump Function ---
function jump(){ if(player.dy==0) player.dy=jumpStrength; else if(player.canDoubleJump){ player.dy=jumpStrength; player.canDoubleJump=false; }}

// --- Generators ---
function createPlatform(y){ let width=100+Math.random()*150; let x=Math.random()*(canvas.width-width); let colors=["green","blue","yellow","purple"]; let color=colors[Math.floor(Math.random()*colors.length)]; platforms.push({x,y,width,color});}
function createHazard(y){ let width=50+Math.random()*50; let x=Math.random()*(canvas.width-width); hazards.push({x,y,width});}
function createPowerUp(y){ let size=30; let x=Math.random()*(canvas.width-size); powerUps.push({x,y,size,type:"shield"}); }

// --- Particles ---
function createParticle(x,y,color){ particles.push({x,y,dx:(Math.random()-0.5)*4,dy:(Math.random()-1.5)*4,color,life:30}); }

// --- Initialize platforms ---
for(let i=0;i<8;i++) createPlatform(canvas.height - i*120);

// --- Update ---
function update(){
  if(!gameRunning) return;

  // Move player
  if(keys['ArrowLeft']&&player.x>0) player.x-=8;
  if(keys['ArrowRight']&&player.x+player.width<canvas.width) player.x+=8;

  player.dy+=gravity;
  player.y+=player.dy;

  // Platform collision
  platforms.forEach(p=>{
    if(player.y+player.height>p.y && player.y+player.height<p.y+10 &&
       player.x+player.width>p.x && player.x<p.x+p.width && player.dy>=0){
      player.y=p.y-player.height;
      player.dy=0;
      player.canDoubleJump=true;
      score++; if(score%20===0){ level++; scrollSpeed+=0.5; }
      scoreDiv.innerText='Score: '+score; levelDiv.innerText='Level: '+level;
      createParticle(player.x+player.width/2,player.y+player.height,"white");
    }
  });

  // Hazards collision
  hazards.forEach(h=>{
    if(player.y+player.height>h.y && player.y<h.y+20 && player.x+player.width>h.x && player.x<h.x+h.width){
      if(player.shield){ player.shield=false; hazards.splice(hazards.indexOf(h),1); } 
      else{ endGame(); }
    }
  });

  // PowerUps collision
  powerUps.forEach(pu=>{
    if(player.y+player.height>pu.y && player.y<pu.y+pu.size && player.x+player.width>pu.x && player.x<pu.x+pu.size){
      player.shield=true; powerUps.splice(powerUps.indexOf(pu),1);
    }
  });

  // Scroll platforms/hazards/powerups
  platforms.forEach(p=>{ p.y+=scrollSpeed; if(p.y>canvas.height){ platforms.splice(platforms.indexOf(p),1); createPlatform(-50); }});
  hazards.forEach(h=>{ h.y+=scrollSpeed; if(h.y>canvas.height) hazards.splice(hazards.indexOf(h),1); });
  powerUps.forEach(pu=>{ pu.y+=scrollSpeed; if(pu.y>canvas.height) powerUps.splice(powerUps.indexOf(pu),1); });

  // Random hazards/powerups
  if(Math.random()<0.01) createHazard(-50);
  if(Math.random()<0.005) createPowerUp(-50);

  // Particles
  particles.forEach(p=>{ p.x+=p.dx; p.y+=p.dy; p.life--; });
  particles = particles.filter(p=>p.life>0);

  // Game over if fall
  if(player.y>canvas.height) endGame();

  draw();
  requestAnimationFrame(update);
}

// --- End Game ---
function endGame(){ gameOver=true; gameRunning=false; alert('Game Over! Score: '+score); highScores.push(score); localStorage.setItem('highScores',JSON.stringify(highScores)); location.reload();}

// --- Draw ---
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Player
  ctx.fillStyle=player.shield?"cyan":"white";
  ctx.fillRect(player.x,player.y,player.width,player.height);
  // Platforms
  platforms.forEach(p=>{ ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,p.width,20); });
  // Hazards
  hazards.forEach(h=>{ ctx.fillStyle="red"; ctx.fillRect(h.x,h.y,h.width,20); });
  // PowerUps
  powerUps.forEach(pu=>{ ctx.fillStyle="gold"; ctx.fillRect(pu.x,pu.y,pu.size,pu.size); });
  // Particles
  particles.forEach(p=>{ ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,4,4); });
}
const jumpSound = new Audio('sounds/jump.wav');
const powerupSound = new Audio('sounds/powerup.wav');
const hitSound = new Audio('sounds/hit.wav');
const bgMusic = new Audio('sounds/background.mp3');
bgMusic.loop = true;   // Makes music loop
bgMusic.volume = 0.5;  // Adjust volume
bgMusic.play();

