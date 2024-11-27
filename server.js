const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https'); // Ajouter https
const fs = require('fs'); // Ajouter fs pour lire les certificats

const app = express();
const PORT = 443; // Port HTTPS
const JWT_SECRET = 'ojnfsdjbvisfnviusnkfjsnfisjdqmxkwovbuiergyuerhdfjscnxqcdvcjxwmosijfsi';

// Charger les certificats (remplacez par vos fichiers de certificat)
const httpsOptions = {
    key: fs.readFileSync('key.pem'), // Chemin vers la clé privée
    cert: fs.readFileSync('cert.pem') // Chemin vers le certificat
};

// Middleware pour parser le body des requêtes et les cookies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


// Sert uniquement des fichiers statiques non sensibles
app.use(express.static(path.join(__dirname, 'public'), {
    index: false // Désactive la diffusion automatique des fichiers index
}));

// Initialisation de la base de données SQLite
const db = new sqlite3.Database('./db.sqlite');

// Création de la table des utilisateurs si elle n'existe pas
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);
});

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS biens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        adresse TEXT,
        nom_bien TEXT,
        nom_proprietaire TEXT,
        saisonnier BOOLEAN DEFAULT FALSE,
        annuel BOOLEAN DEFAULT FALSE,
        nbr_etage INTEGER,
        surface_maison REAL,
        nbr_chambres INTEGER,
        nbr_salle_de_bain INTEGER,
        nbr_salle_eau INTEGER,
        nbr_salon INTEGER,
        code_alarme TEXT,
        cheminee BOOLEAN DEFAULT FALSE,
        radiateur BOOLEAN DEFAULT FALSE,
        fioul BOOLEAN DEFAULT FALSE,
        poele BOOLEAN DEFAULT FALSE,
        chauffage_sol BOOLEAN DEFAULT FALSE,
        climatisation BOOLEAN DEFAULT FALSE,
        surface_jardin REAL,
        cloture BOOLEAN,
        code_portail TEXT,
        piscine_type TEXT,
        piscine_longueur REAL,
        piscine_largeur REAL,
        jacuzzi BOOLEAN,
        surface_terrasse REAL,
        wifi BOOLEAN DEFAULT FALSE,
        ssid TEXT,
        wifiPassword TEXT,
        mode_chauffage TEXT,
        cheminee_granule BOOLEAN DEFAULT FALSE,
        cheminee_bois BOOLEAN DEFAULT FALSE,
        chauffage_electrique BOOLEAN DEFAULT FALSE,
        chauffage_fioul BOOLEAN DEFAULT FALSE,
        chauffage_bois BOOLEAN DEFAULT FALSE,
        chauffage_pompe_chaleur BOOLEAN DEFAULT FALSE,
        chauffage_solaire BOOLEAN DEFAULT FALSE,
        poolhouse BOOLEAN DEFAULT FALSE,
        surface_poolhouse REAL,
        photo_url TEXT,
        nature_sol TEXT,                    -- Nouveau champ pour la nature du sol
        nature_sol_terrasse TEXT,           -- Nouveau champ pour la nature du sol de la terrasse
        chauffage_eau TEXT,                 -- Nouveau champ pour le type de chauffage de l'eau
        details TEXT,                       -- Nouveau champ pour les détails
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
    )
    `);
});

// Création de la table clients si elle n'existe pas déjà
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            civilite TEXT,
            nom TEXT,
            prenom TEXT,
            adresse_principale TEXT,
            code_postal TEXT,
            ville TEXT,
            pays TEXT,
            tel_fixe TEXT,
            tel_portable TEXT,
            email TEXT
        )
    `);
});
//creation table contact
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    nom TEXT,
    prenom TEXT,
    telephone TEXT,
    email TEXT
);
    `);
});
// Création de la table agenda si elle n'existe pas déjà
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS agenda (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            start TEXT NOT NULL,
            end TEXT,
            description TEXT,
            date TEXT,
            category TEXT,
            duration TEXT
        )
    `);
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS interventions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            bien_id INTEGER NOT NULL,
            duree TEXT NOT NULL,
            heure_debut TEXT NOT NULL,
            intervenant TEXT NOT NULL,
            details TEXT,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
            FOREIGN KEY (bien_id) REFERENCES biens(id) ON DELETE CASCADE
        )
    `);
});


// Middleware pour vérifier si un utilisateur est déjà enregistré
function checkIfUserExists(req, res, next) {
    db.get("SELECT * FROM users LIMIT 1", (err, row) => {
        if (err) {
            return res.status(500).send("Erreur lors de la vérification de la base de données.");
        }
        if (!row) {
            return res.redirect('/setup'); // Si aucun utilisateur n'est trouvé, redirige vers la page de création
        }
        next(); // Si un utilisateur existe, continue la requête
    });
}

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    console.log('Vérification du token:', token); // Ajoutez ceci pour voir si le token est bien transmis

    if (!token) {
        console.log('Token non trouvé, redirection vers /login');
        return res.redirect('/login');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Erreur lors de la vérification du token:', err);
            return res.redirect('/login'); // Rediriger si le token est invalide
        }
        req.user = user;  // Stocker l'utilisateur dans req
        console.log('Token vérifié, utilisateur:', user);
        next(); // Continuer si le token est valide
    });
}


// Route pour la page de configuration
app.get('/setup', (req, res) => {
    db.get("SELECT * FROM users LIMIT 1", (err, row) => {
        if (row) {
            return res.redirect('/login'); // Si un utilisateur existe déjà, redirige vers le login
        }
        res.sendFile(path.join(__dirname, 'public', 'setup.html')); // Sert setup.html depuis un dossier sécurisé
    });
});

// Route POST pour créer l'utilisateur admin
app.post('/setup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Veuillez fournir un nom d'utilisateur et un mot de passe.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], (err) => {
        if (err) {
            return res.status(500).send("Erreur lors de la création de l'utilisateur.");
        }
        res.redirect('/login'); // Redirige vers la page de login après la création
    });
});

// Route pour la page de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Sert login.html depuis 'views'
});

// Route POST pour authentification
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) {
            return res.status(500).send("Erreur lors de la vérification de l'utilisateur.");
        }

        if (!row || !(await bcrypt.compare(password, row.password))) {
            return res.status(401).send("Nom d'utilisateur ou mot de passe incorrect.");
        }

        // Générer le token JWT ici
        const token = jwt.sign({ username: row.username }, JWT_SECRET, { expiresIn: '1h' });

        // Utiliser le token pour définir le cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'Strict'
        });

        // Rediriger l'utilisateur vers l'index
        res.redirect('/index');
    });
});

app.post('/logout', (req, res) => {
    res.clearCookie('token', { path: '/' });  // Supprime le cookie JWT
    res.redirect('/login');  // Redirige vers la page de login
});

app.get('/get-all-biens', authenticateToken, (req, res) => {
    db.all('SELECT * FROM biens', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des biens.' });
        }
        res.json(rows);
    });
});

// Route pour la page index (protégée par le token JWT)
app.get('/index', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));  // On sert index.html uniquement via une route protégée
});

// Route protégée pour la page client.html
app.get('/client', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'client.html'));  // Sert client.html uniquement si authentifié
});

// Route protégée pour la page biens.html
app.get('/biens', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'biens.html'));  // Sert biens.html uniquement si authentifié
});

// Route protégée pour la page contrat.html
app.get('/contrat', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contrat.html'));  // Sert contrat.html uniquement si authentifié
});

// Route protégée pour la page agenda.html
app.get('/agenda', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'agenda.html'));  // Sert agenda.html uniquement si authentifié
});

// Route protégée pour la page paramètres.html
app.get('/parametres', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'parametres.html'));  // Sert parametres.html uniquement si authentifié
});

// Route protégée pour la page interventions.html
app.get('/interventions', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'interventions.html'));
});

// Route pour rechercher un client dans la base de données
app.get('/search', authenticateToken, (req, res) => {
    const searchTerm = `%${req.query.term}%`; // Pour la recherche partielle
    db.all("SELECT * FROM clients WHERE nom LIKE ? OR prenom LIKE ? OR email LIKE ?", [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            return res.status(500).send("Erreur lors de la recherche du client.");
        }
        res.json(rows);
    });
});

app.post('/create-client', authenticateToken, (req, res) => {
    const { civilite, nom, prenom, adresse_principale, code_postal, ville, pays, tel_fixe, tel_portable, email } = req.body;

    // Validation des champs
    if (!nom || !prenom || !email) {
        return res.status(400).send("Veuillez remplir tous les champs obligatoires.");
    }

    // Insertion dans la base de données avec ville inclus
    db.run(
        `INSERT INTO clients (civilite, nom, prenom, adresse_principale, code_postal, ville, pays, tel_fixe, tel_portable, email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [civilite, nom, prenom, adresse_principale, code_postal, ville, pays, tel_fixe, tel_portable, email],
        function (err) {
            if (err) {
                console.error('Erreur lors de l\'insertion dans la base de données:', err);
                return res.status(500).send("Erreur lors de la création du client.");
            }
            res.status(200).send({ message: "Client créé avec succès", clientId: this.lastID });
        }
    );
});

// Route pour obtenir tous les clients
app.get('/get-clients', authenticateToken, (req, res) => {
    db.all('SELECT * FROM clients', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des clients.' });
        }
        res.json(rows);
    });
});

// Route pour obtenir les détails d'un client par ID
app.get('/get-client/:id', (req, res) => {
    const clientId = req.params.id;

    db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erreur lors de la récupération du client');
        } else if (!row) {
            res.status(404).send('Client non trouvé');
        } else {
            res.json(row);
        }
    });
});

// Route pour servir `client.js` uniquement si l'utilisateur est authentifié
app.get('/secure-client.js', authenticateToken, (req, res) => {
    // Servir le fichier client.js depuis le dossier views
    res.sendFile(path.join(__dirname, 'views', 'client.js'));
});
// Route pour servir `client.js` uniquement si l'utilisateur est authentifié
app.get('/secure-biens.js', authenticateToken, (req, res) => {
    // Servir le fichier client.js depuis le dossier views
    res.sendFile(path.join(__dirname, 'views', 'biens.js'));
});
// Route pour servir `agenda.js` uniquement si l'utilisateur est authentifié
app.get('/secure-agenda.js', authenticateToken, (req, res) => {
    // Servir le fichier agenda.js depuis le dossier views
    res.sendFile(path.join(__dirname, 'views', 'agenda.js'));
});
// Route protégée pour servir le script interventions.js
app.get('/secure-interventions.js', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'interventions.js'));
});

app.delete('/delete-client/:id', authenticateToken, (req, res) => {
    const clientId = req.params.id;

    // Suppression du client dans la base de données
    db.run('DELETE FROM clients WHERE id = ?', [clientId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la suppression du client.' });
        }

        res.json({ message: 'Client supprimé avec succès.' });
    });
});

app.put('/update-client/:id', authenticateToken, (req, res) => {
    const clientId = req.params.id;
    const { civilite, nom, prenom, adresse_principale, code_postal, ville, pays, tel_fixe, tel_portable, email } = req.body;

    const sql = `
        UPDATE clients
        SET civilite = ?, nom = ?, prenom = ?, adresse_principale = ?, code_postal = ?, ville = ?, pays = ?, tel_fixe = ?, tel_portable = ?, email = ?
        WHERE id = ?
    `;

    db.run(sql, [civilite, nom, prenom, adresse_principale, code_postal, ville, pays, tel_fixe, tel_portable, email, clientId], function (err) {
        if (err) {
            res.status(500).json({ error: 'Erreur lors de la mise à jour du client.' });
        } else {
            res.json({ message: 'Client mis à jour avec succès.' });
        }
    });
});


// Route pour obtenir tous les rendez-vous
app.get('/get-appointments', authenticateToken, (req, res) => {
    db.all('SELECT * FROM agenda', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous.' });
        }
        res.json(rows);
    });
});

app.post('/create-appointment', authenticateToken, (req, res) => {
    const { title, start, end, description, date, category, duration } = req.body;

    // Vérification des champs obligatoires
    if (!title || !start || !date) {
        return res.status(400).json({ message: 'Le titre, la date de début, et la date sont requis.' });
    }

    db.run(
        `INSERT INTO agenda (title, start, end, description, date, category, duration) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [title, start, end, description, date, category, duration], 
        function(err) {
            if (err) {
                console.error('Erreur lors de la création du rendez-vous :', err);
                return res.status(500).json({ message: 'Erreur lors de la création du rendez-vous.', error: err.message });
            }
            res.status(200).json({ id: this.lastID });
        }
    );
});

app.put('/update-appointment/:id', authenticateToken, (req, res) => {
    const { title, start, end, description, category, duration } = req.body;
    const appointmentId = req.params.id;

    db.run(
        `UPDATE agenda SET title = ?, start = ?, end = ?, description = ?, category = ?, duration = ? WHERE id = ?`, 
        [title, start, end, description, category, duration, appointmentId], 
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de la mise à jour du rendez-vous.' });
            }
            res.status(200).json({ message: 'Rendez-vous mis à jour avec succès.' });
        }
    );
});

// Route pour supprimer un rendez-vous
app.delete('/delete-appointment/:id', authenticateToken, (req, res) => {
    const appointmentId = req.params.id;
    db.run(`DELETE FROM agenda WHERE id = ?`, [appointmentId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la suppression du rendez-vous.' });
        }
        res.status(200).json({ message: 'Rendez-vous supprimé avec succès.' });
    });
});


app.get('/accueil', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'accueil.html'));
});

app.get('/secure-accueil.js', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'secure-accueil.js'));
});

app.get('/get-biens/:clientId', authenticateToken, (req, res) => {
    const clientId = req.params.clientId;
    db.all('SELECT * FROM biens WHERE client_id = ?', [clientId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des biens.' });
        }
        res.json(rows); // Renvoie les biens sous forme de JSON
    });
});
app.get('/get-bien/:id', (req, res) => {
    const bienId = req.params.id;

    db.get('SELECT * FROM biens WHERE id = ?', [bienId], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Erreur lors de la récupération du bien' });
        } else if (!row) {
            res.status(404).json({ error: 'Bien non trouvé' });
        } else {
            res.json(row);
        }
    });
});

const multer = require('multer');

// Configuration de l'emplacement de stockage et des noms de fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Dossier où les images seront sauvegardées
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Nom du fichier avec un timestamp
    }
});

// Initialisation de multer
const upload = multer({ storage: storage });

// Route pour l'upload d'une photo lors de la création du bien
app.post('/upload-photo', authenticateToken, upload.single('photoBien'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Aucune photo envoyée.');
    }
    // Retourner le chemin de l'image uploadée
    res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Route pour créer un bien avec une photo
app.post('/create-bien', authenticateToken, upload.single('photoBien'), (req, res) => {
    const { 
        client_id, nom_bien, adresse, nom_proprietaire, saisonnier, annuel, 
        nbr_etage, surface_maison, nbr_chambres, nbr_salle_de_bain, 
        nbr_salle_eau, nbr_salon, code_alarme, cheminee, radiateur, fioul,
        climatisation, surface_jardin, cloture, code_portail, 
        piscine_type, piscine_longueur, piscine_largeur, jacuzzi, surface_terrasse, 
        wifi, ssid, wifiPassword, mode_chauffage, cheminee_granule, cheminee_bois, chauffage_sol, poele,
        chauffage_electrique, chauffage_fioul, chauffage_bois, chauffage_pompe_chaleur, chauffage_solaire, 
        poolhouse, surface_poolhouse, 
        nature_sol, // Ajouté
        nature_sol_terrasse, // Ajouté
        chauffage_eau, // Ajouté
        details // Ajouté
    } = req.body;

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null; // Photo optionnelle

    if (!client_id || !nom_bien) {
        return res.status(400).json({ error: "Le client ID et le nom du bien sont obligatoires." });
    }

    const sql = `
    INSERT INTO biens (
        client_id, adresse, nom_proprietaire, nbr_etage, surface_maison, nbr_chambres, 
        nbr_salle_de_bain, nbr_salle_eau, nbr_salon, code_alarme, surface_jardin, cloture, 
        code_portail, piscine_type, piscine_longueur, piscine_largeur, jacuzzi, 
        surface_terrasse, nom_bien, saisonnier, annuel, cheminee, radiateur, fioul, 
        climatisation, wifi, ssid, wifiPassword, mode_chauffage, cheminee_granule, 
        cheminee_bois, chauffage_sol, poele, poolhouse, surface_poolhouse, photo_url,
        nature_sol, nature_sol_terrasse, chauffage_eau, details -- Ajout des nouveaux champs
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

    db.run(sql, [
        client_id, adresse, nom_proprietaire, nbr_etage || 0, surface_maison || null, nbr_chambres || 0,
        nbr_salle_de_bain || 0, nbr_salle_eau || 0, nbr_salon || 0, code_alarme || null, surface_jardin || null,
        cloture || false, code_portail || null, piscine_type || null, piscine_longueur || null,
        piscine_largeur || null, jacuzzi || false, surface_terrasse || null, nom_bien,
        saisonnier || false, annuel || false, cheminee || false, radiateur || false, fioul || false,
        climatisation || false, wifi || false, ssid || null, wifiPassword || null, mode_chauffage || null,
        cheminee_granule || false, cheminee_bois || false, chauffage_sol || false, poele || false,
        poolhouse || false, surface_poolhouse || null, photo_url || null,
        nature_sol || null, nature_sol_terrasse || null, chauffage_eau || null, details || null 
], function (err) {
    if (err) {
        console.error('Erreur lors de la création du bien :', err);
        return res.status(500).json({ error: 'Erreur lors de la création du bien.' });
    }
    const bienId = this.lastID;
    res.json({ message: 'Bien créé avec succès.', id: bienId });
});
});

// Route protégée pour accéder aux fichiers dans le dossier uploads
app.get('/uploads/:filename', authenticateToken, (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', filename);
    
    // Vérification que le fichier existe
    fs.access(filepath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`Fichier non trouvé : ${filepath}`);
            return res.status(404).send('Fichier non trouvé');
        }
        // Envoyer le fichier en réponse
        res.sendFile(filepath);
    });
});

// Route pour modifier un bien avec option de photo
app.put('/update-bien/:id', authenticateToken, upload.single('photoBien'), (req, res) => {
    console.log('Requête reçue pour la mise à jour du bien avec ID :', req.params.id);
    console.log('Données reçues :', req.body);
    console.log('Fichier reçu :', req.file);

    const bienId = req.params.id;
    const {
        nom_bien, adresse, nom_proprietaire, saisonnier, annuel,
        nbr_etage, surface_maison, nbr_chambres, nbr_salle_de_bain,
        nbr_salle_eau, nbr_salon, code_alarme, cheminee, radiateur, fioul,
        climatisation, surface_jardin, cloture, code_portail,
        piscine_type, piscine_longueur, piscine_largeur, jacuzzi, surface_terrasse,
        wifi, ssid, wifiPassword, mode_chauffage, cheminee_granule, cheminee_bois, chauffage_sol, poele,
        poolhouse, surface_poolhouse,
        nature_sol, nature_sol_terrasse, chauffage_eau, details,
    } = req.body;

    const photo_url = req.file ? `/uploads/${req.file.filename}` : req.body.photo_url; // Mise à jour ou conservation de l'ancienne URL

    const sql = `
    UPDATE biens 
    SET 
        nom_bien = ?, adresse = ?, nom_proprietaire = ?, saisonnier = ?, 
        annuel = ?, nbr_etage = ?, surface_maison = ?, nbr_chambres = ?, 
        nbr_salle_de_bain = ?, nbr_salle_eau = ?, nbr_salon = ?, 
        code_alarme = ?, cheminee = ?, radiateur = ?, fioul = ?, 
        climatisation = ?, surface_jardin = ?, cloture = ?, code_portail = ?, 
        piscine_type = ?, piscine_longueur = ?, piscine_largeur = ?, 
        jacuzzi = ?, surface_terrasse = ?, wifi = ?, ssid = ?, wifiPassword = ?, 
        mode_chauffage = ?, cheminee_granule = ?, cheminee_bois = ?, chauffage_sol = ?, poele = ?,
        poolhouse = ?, surface_poolhouse = ?, photo_url = ?, 
        nature_sol = ?, nature_sol_terrasse = ?, chauffage_eau = ?, details = ? 
    WHERE id = ?
    `;

    db.run(sql, [
        nom_bien, adresse, nom_proprietaire, saisonnier, annuel,
        nbr_etage, surface_maison, nbr_chambres, nbr_salle_de_bain,
        nbr_salle_eau, nbr_salon, code_alarme, cheminee, radiateur, fioul,
        climatisation, surface_jardin, cloture, code_portail,
        piscine_type, piscine_longueur, piscine_largeur, jacuzzi, surface_terrasse,
        wifi, ssid, wifiPassword, mode_chauffage, cheminee_granule, cheminee_bois, chauffage_sol, poele,
        poolhouse, surface_poolhouse, photo_url,
        nature_sol, nature_sol_terrasse, chauffage_eau, details,
        bienId
    ], function (err) {
        if (err) {
            console.error('Erreur lors de la mise à jour du bien :', err.message);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du bien.', details: err.message });
        }
        res.json({ message: 'Bien mis à jour avec succès.' });
    });
});

app.delete('/delete-bien/:id', authenticateToken, (req, res) => {
    const bienId = req.params.id;

    db.run('DELETE FROM biens WHERE id = ?', [bienId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la suppression du bien.' });
        }

        res.json({ message: 'Bien supprimé avec succès.' });
    });
});

app.post('/create-contact', authenticateToken, (req, res) => {
    const { client_id, nom, prenom, telephone, email } = req.body;

    if (!client_id || !nom || !prenom) {
        return res.status(400).json({ error: "ID du client, nom, et prénom sont requis." });
    }

    db.run(
        `INSERT INTO contacts (client_id, nom, prenom, telephone, email) VALUES (?, ?, ?, ?, ?)`,
        [client_id, nom, prenom, telephone, email],
        function (err) {
            if (err) {
                console.error('Erreur lors de la création du contact:', err);
                return res.status(500).json({ error: "Erreur lors de la création du contact." });
            }
            res.status(200).json({ message: "Contact ajouté avec succès", contactId: this.lastID });
        }
    );
});

app.get('/get-contacts/:clientId', authenticateToken, (req, res) => {
    const clientId = req.params.clientId;

    db.all('SELECT * FROM contacts WHERE client_id = ?', [clientId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Erreur lors de la récupération des contacts' });
        }
        res.json(rows); // Retourne un tableau d'objets
    });
});

app.get('/get-contact/:id', authenticateToken, (req, res) => {
    const contactId = req.params.id;

    db.get('SELECT * FROM contacts WHERE id = ?', [contactId], (err, row) => {
        if (err) {
            console.error('Erreur lors de la récupération du contact :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération du contact.' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Contact non trouvé.' });
        }
        res.json(row); // Renvoie les détails du contact sous forme d'objet JSON
    });
});

app.delete('/delete-contact/:id', authenticateToken, (req, res) => {
    const contactId = req.params.id;

    db.run('DELETE FROM contacts WHERE id = ?', [contactId], function (err) {
        if (err) {
            console.error('Erreur lors de la suppression du contact :', err);
            return res.status(500).json({ message: 'Erreur lors de la suppression du contact.' });
        }
        res.json({ message: 'Contact supprimé avec succès.' });
    });
});

app.put('/update-contact/:id', authenticateToken, (req, res) => {
    const contactId = req.params.id;
    const { nom, prenom, telephone, email } = req.body;

    db.run(
        `UPDATE contacts SET nom = ?, prenom = ?, telephone = ?, email = ? WHERE id = ?`,
        [nom, prenom, telephone, email, contactId],
        function (err) {
            if (err) {
                console.error('Erreur lors de la mise à jour du contact :', err);
                return res.status(500).json({ message: 'Erreur lors de la mise à jour du contact.' });
            }
            res.status(200).json({ message: 'Contact mis à jour avec succès.' });
        }
    );
});

app.get('/get-interventions', authenticateToken, (req, res) => {
    const sql = `
        SELECT 
            interventions.id,
            clients.nom AS client_nom,
            clients.prenom AS client_prenom,
            biens.nom_bien AS bien_nom,
            interventions.duree,
            interventions.heure_debut,
            interventions.intervenant,
            interventions.details
        FROM interventions
        JOIN clients ON interventions.client_id = clients.id
        JOIN biens ON interventions.bien_id = biens.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la récupération des interventions.' });
        }
        res.json(rows);
    });
});

app.get('/get-biens-by-client/:clientId', authenticateToken, (req, res) => {
    const clientId = req.params.clientId;
    db.all('SELECT id, nom_bien FROM biens WHERE client_id = ?', [clientId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la récupération des biens.' });
        }
        res.json(rows);
    });
});

app.post('/create-intervention', authenticateToken, (req, res) => {
    const { client_id, bien_id, duree, heure_debut, intervenant, details } = req.body;

    if (!client_id || !bien_id || !duree || !heure_debut || !intervenant) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
    }

    db.run(
        `INSERT INTO interventions (client_id, bien_id, duree, heure_debut, intervenant, details) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [client_id, bien_id, duree, heure_debut, intervenant, details],
        function (err) {
            if (err) {
                console.error('Erreur lors de la création de l\'intervention:', err);
                return res.status(500).json({ error: 'Erreur lors de la création de l\'intervention.' });
            }
            res.status(200).json({ message: 'Intervention ajoutée avec succès.', interventionId: this.lastID });
        }
    );
});

app.delete('/delete-intervention/:id', authenticateToken, (req, res) => {
    const interventionId = req.params.id;

    db.run('DELETE FROM interventions WHERE id = ?', [interventionId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la suppression de l\'intervention.' });
        }
        res.status(200).json({ message: 'Intervention supprimée avec succès.' });
    });
});

// Lancement du serveur HTTPS
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://squirrel.dynv6.net:${PORT}`);
});
