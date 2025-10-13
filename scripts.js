// Déclartion des éléments DOM

const video = document.getElementById('video');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const statusDiv = document.getElementById('status');
const resultsList = document.getElementById('results-list');

let stream = null;
let scanning = false;
let scanned = new Set();
let detector = null;

// Buffer pour lecture stable
let detectionBuffer = {};
const REQUIRED_DETECTIONS = 3; // nombre de détections consécutives pour valider

function updateStatus(msg,type='info'){
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = msg;
}

// addResult ajoute un code scanné à la liste des résultats

function addResult(code,format){
  const div=document.createElement('div');
  div.className='result-item';
  div.innerHTML=`<span class="result-code">${code}</span><span class="result-type">${format}</span>`;
  resultsList.prepend(div);
}

//Lance le scanner

async function startScanner(){
  if(!('BarcodeDetector' in window)){
    updateStatus("❌ Votre navigateur ne supporte pas BarcodeDetector", 'error');
    return;
  }
  try{
    detector = new BarcodeDetector({formats:['ean_13','upc_a']});
    stream = await navigator.mediaDevices.getUserMedia({
    video:{facingMode:'environment',width:{ideal:640},height:{ideal:480}}
    });

    video.srcObject = stream;
    scanning=true;
    startBtn.disabled=true;
    stopBtn.disabled=false;
    updateStatus("Scanner actif - Placez le code dans le cadre",'success');
    scanLoop();
  }
  catch (err) {
    console.error(err);
    updateStatus("Erreur d'accès à la caméra",'error');
  }
}

// Arrête le scanner

function stopScanner(){
  if(stream) stream.getTracks().forEach(t=>t.stop());
  scanning=false;
  startBtn.disabled=false;
  stopBtn.disabled=true;
  updateStatus("Scanner arrêté",'info');
}


// Permet d'effacer les résultats

function clearResults(){
  scanned.clear();
  detectionBuffer={};
  resultsList.innerHTML=`<div style="text-align:center; color:#6c757d; font-style:italic;">Aucun code scanné pour le moment</div>`;
  updateStatus("Résultats effacés",'info');
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

