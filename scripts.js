const video = document.getElementById('video');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const statusDiv = document.getElementById('status');
const resultsList = document.getElementById('results-list');

let stream = null;
let scanning = false;
let scanned = new Set();
let barcodeQuantities = {}; // { code: quantity }
let detector = null;

// Buffer pour lecture stable
let detectionBuffer = {};
const REQUIRED_DETECTIONS = 3; // nombre de détections consécutives pour valider

function updateStatus(msg,type='info'){
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = msg;
}

function playBeep(){
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.value = 900; osc.type='square';
  gain.gain.setValueAtTime(0.2,ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.1);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.1);
}

function addResult(code, format) {
  // Initialiser la quantité à 1 si nouveau
  if (!barcodeQuantities[code]) {
    barcodeQuantities[code] = 1;
  }
  const div = document.createElement('div');
  div.className = 'result-item';
  div.innerHTML = `
    <span class="result-code">${code}</span>
    <span class="result-type">${format}</span>
    <input type="number" min="1" value="${barcodeQuantities[code]}" class="result-qty" style="width:60px; margin-left:10px;" title="Quantité" />
  `;
  // Gérer le changement de quantité
  const qtyInput = div.querySelector('.result-qty');
  qtyInput.addEventListener('change', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    barcodeQuantities[code] = val;
    qtyInput.value = val;
  });
  resultsList.prepend(div);
}

async function startScanner(){
  if(!('BarcodeDetector' in window)){
    updateStatus("❌ Votre navigateur ne supporte pas BarcodeDetector", 'error');
    return;
  }
  try{
    detector = new BarcodeDetector({formats:['ean_13','upc_a']});
    stream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}
    });
    video.srcObject = stream;
    scanning=true;
    startBtn.disabled=true;
    stopBtn.disabled=false;
    updateStatus("Scanner actif - Placez le code dans le cadre",'success');
    scanLoop();
  }catch(err){
    console.error(err);
    updateStatus("Erreur d'accès à la caméra",'error');
  }
}

function stopScanner(){
  if(stream) stream.getTracks().forEach(t=>t.stop());
  scanning=false;
  startBtn.disabled=false;
  stopBtn.disabled=true;
  updateStatus("Scanner arrêté",'info');
}

function clearResults() {
  scanned.clear();
  detectionBuffer = {};
  barcodeQuantities = {};
  resultsList.innerHTML = `<div style="text-align:center; color:#6c757d; font-style:italic;">Aucun code scanné pour le moment</div>`;
  updateStatus("Résultats effacés", 'info');
}

async function scanLoop(){
  if(!scanning) return;

  try{
    const barcodes=await detector.detect(video);
    for(const barcode of barcodes){
      const code=barcode.rawValue;
      const format=barcode.format;

      // Lecture stable : on incrémente le compteur dans detectionBuffer
      detectionBuffer[code] = (detectionBuffer[code]||0)+1;

      if(detectionBuffer[code]>=REQUIRED_DETECTIONS && !scanned.has(code)){
        scanned.add(code);
        addResult(code,format);
        playBeep();
        updateStatus(`Code confirmé : ${code}`,'success');
        // Réinitialiser le compteur pour éviter plusieurs ajouts
        detectionBuffer[code]=0;
      }
    }
  }catch(e){ console.warn(e); }

  requestAnimationFrame(scanLoop);
}

startBtn.onclick=startScanner;
stopBtn.onclick=stopScanner;
clearBtn.onclick=clearResults;
window.addEventListener('beforeunload',stopScanner);
