// Stockage des résultats
let results = [];

// Références aux éléments
const form = document.getElementById('scan-form');
const codeInput = document.getElementById('code-input');
const quantiteInput = document.getElementById('quantite');
const resultsList = document.getElementById('results-list');
const exportBtn = document.getElementById('export-btn');

// Empêche la soumission du formulaire par Enter dans codeInput
codeInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    // Ne rien faire, l'ajout se fait uniquement par le bouton
  }
});

// Gestion de la soumission du formulaire uniquement par le bouton
form.addEventListener('submit', function(e) {
  e.preventDefault(); // Empêche le rechargement de la page

  const code = codeInput.value.trim();
  const quantite = parseInt(quantiteInput.value) || 1;

  if (code) {
    // Ajouter le résultat
    addResult(code, quantite);

    // Vider l'input du code-barres
    codeInput.value = '';

    // Remettre le focus sur l'input
    codeInput.focus();

    // Réinitialiser la quantité à 1
    quantiteInput.value = 1;
  }
});

// Fonction pour ajouter un résultat
function addResult(code, quantite) {
  const timestamp = new Date().toLocaleString('fr-FR');
  
  // Vérifier si le code existe déjà
  const existingIndex = results.findIndex(r => r.code === code);
  
  if (existingIndex >= 0) {
    // Ajouter à la quantité existante
    results[existingIndex].quantite += quantite;
  } else {
    // Ajouter un nouveau résultat
    results.push({
      code: code,
      quantite: quantite,
      timestamp: timestamp
    });
  }
  
  displayResults();
}

// Fonction pour afficher les résultats
function displayResults() {
  if (results.length === 0) {
    resultsList.innerHTML = '<div style="text-align:center; color:#6c757d; font-style:italic;">Aucun code scanné pour le moment</div>';
    return;
  }
  
  resultsList.innerHTML = '';
  
  results.forEach((result, index) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <div>
        <div class="result-code">${result.code}</div>
        <div style="font-size:0.9em; color:#6c757d;">${result.timestamp}</div>
      </div>
      <div class="result-quantity">Qté: ${result.quantite}</div>
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
  let csv = 'Code-Barres,Quantité,Date/Heure\n';
  results.forEach(result => {
    csv += `${result.code},${result.quantite},${result.timestamp}\n`;
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
});

// Garder le focus sur l'input du code-barres
document.addEventListener('click', function (e) {
  if (e.target.id !== 'quantite' && e.target.id !== 'submit' && e.target.id !== 'export-btn') {
    codeInput.focus();
  }
});