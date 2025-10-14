// Stockage des résultats
let results = [];

// Références aux éléments
const form = document.getElementById('scan-form');
const codeInput = document.getElementById('code-input');
const quantiteInput = document.getElementById('quantite');
const deleteInput = document.getElementById('delete');
const resultsList = document.getElementById('results-list');
const exportBtn = document.getElementById('export-btn');

// Charger les données au démarrage
window.addEventListener('DOMContentLoaded', function() {
  loadDataFromDatabase();
});

// Fonction pour charger les données depuis la base de données
function loadDataFromDatabase() {
  fetch('http://localhost:3000/get-barcodes')
    .then(res => {
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      // Convertir les données de la base en format local
      results = data.map(item => ({
        code: item.IdBarre,
        quantite: item.QTE,
        timestamp: item.date
      }));
      displayResults();
    })
    .catch(err => {
      console.error('Erreur lors du chargement des données:', err);
      displayResults(); // Afficher quand même l'interface vide
    });
}

// Empêche la soumission du formulaire par Enter dans codeInput
codeInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
});

// Gestion de la soumission du formulaire uniquement par le bouton
form.addEventListener('submit', function(e) {
  e.preventDefault();

  const code = codeInput.value.trim();
  const quantite = parseInt(quantiteInput.value) || 1;

  if (code) {
    addResult(code, quantite);
    codeInput.value = '';
    codeInput.focus();
    quantiteInput.value = 1;
  }
});

// Fonction pour ajouter un résultat
function addResult(code, quantite) {
  const timestamp = new Date().toLocaleString('fr-FR');

  // Vérifier si le code existe déjà dans le tableau local
  const existingIndex = results.findIndex(r => r.code === code);

  if (existingIndex >= 0) {
    // Ajouter à la quantité existante
    results[existingIndex].quantite += quantite;
    results[existingIndex].timestamp = timestamp;
    
    // Envoyer seulement la quantité ajoutée
    sendToDatabase({
      code: code,
      quantite: quantite,
      timestamp: timestamp
    });
  } else {
    // Ajouter un nouveau résultat
    const resultObj = {
      code: code,
      quantite: quantite,
      timestamp: timestamp
    };
    results.push(resultObj);
    sendToDatabase(resultObj);
  }

  displayResults();
}

// Fonction pour envoyer les données à l'API Node.js
function sendToDatabase(result) {
  fetch('http://localhost:3000/add-barcode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      IdBarre: result.code,
      QTE: result.quantite,
      date: result.timestamp
    })
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`Erreur HTTP: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log('Réponse serveur:', data);
    // Recharger les données pour être sûr d'avoir les bonnes quantités
    loadDataFromDatabase();
  })
  .catch(err => {
    console.error('Erreur API:', err);
    alert('Erreur lors de l\'envoi à la base de données');
  });
}

// Fonction pour afficher les résultats
function displayResults() {
  if (results.length === 0) {
    resultsList.innerHTML = '<div style="text-align:center; color:#6c757d; font-style:italic;">Aucun code scanné pour le moment</div>';
    return;
  }
  
  resultsList.innerHTML = '';
  
  // Afficher dans l'ordre inverse (plus récent en premier)
  [...results].forEach((result) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <div>
        <div class="result-code">${result.code}</div>
        <div style="font-size:0.9em; color:#6c757d;">${result.timestamp}</div>
      </div>
      <div class="result-quantity">Quantité : ${result.quantite}</div>
    `;
    resultsList.appendChild(div);
  });
}

// Fonction d'exportation
exportBtn.addEventListener('click', function() {
  if (results.length === 0) {
    alert('Aucun résultat à exporter');
    return;
  }
  
  // Créer le contenu CSV
  let csv = 'Code-Barres;Quantité;Date/Heure\n';
  results.forEach(result => {
    csv += `${result.code};${result.quantite};"${result.timestamp}"\n`;
  });

  // Créer et télécharger le fichier
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `scan_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});