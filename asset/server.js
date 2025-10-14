const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Autorise les requêtes du navigateur

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ADM_Cbarre' // Remplace par le nom de ta base
});

connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('Connecté à la base de données MySQL.');
});

app.post('/add-barcode', async (req, res) => {
    const { IdBarre, QTE, date } = req.body;
    
    if (!IdBarre || QTE === undefined || !date) {
        return res.status(400).json({ error: 'Données manquantes' });
    }
    
    const qteNumber = Number(QTE);
    if (isNaN(qteNumber)) {
        return res.status(400).json({ error: 'Quantité invalide' });
    }
    
    try {
        const [rows] = await connection.promise().query(
            'SELECT QTE FROM cbarre WHERE IdBarre = ?', 
            [IdBarre]
        );
        
        if (rows.length > 0) {
            const newQte = Number(rows[0].QTE) + qteNumber;
            await connection.promise().query(
                'UPDATE cbarre SET QTE = ?, date = ? WHERE IdBarre = ?',
                [newQte, date, IdBarre]
            );
            res.json({ status: 'success', action: 'UPDATE', newQte });
        } else {
            await connection.promise().query(
                'INSERT INTO cbarre (IdBarre, QTE, date) VALUES (?, ?, ?)',
                [IdBarre, qteNumber, date]
            );
            res.json({ status: 'success', action: 'INSERT', QTE: qteNumber });
        }
    } catch (err) {
        console.error('Erreur SQL:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer tous les codes-barres
app.get('/get-barcodes', (req, res) => {
    const selectSql = 'SELECT IdBarre, QTE, date FROM cbarre ORDER BY date DESC';
    connection.query(selectSql, (err, results) => {
        if (err) {
            console.error('Erreur SQL SELECT:', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des données' });
        }
        res.json(results);
    });
});

app.listen(3000, () => {
    console.log('Serveur API démarré sur le port 3000');
});
