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
            pays TEXT,
            tel_fixe TEXT,
            tel_portable TEXT,
            email TEXT
        )
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
    const { civilite, nom, prenom, adresse_principale, code_postal, pays, tel_fixe, tel_portable, email } = req.body;

    // Validation des champs
    if (!nom || !prenom || !email) {
        return res.status(400).send("Veuillez remplir tous les champs obligatoires.");
    }

    // Insertion dans la base de données
    db.run(
        `INSERT INTO clients (civilite, nom, prenom, adresse_principale, code_postal, pays, tel_fixe, tel_portable, email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [civilite, nom, prenom, adresse_principale, code_postal, pays, tel_fixe, tel_portable, email],
        function (err) {
            if (err) {
                console.error('Erreur lors de l\'insertion dans la base de données:', err);
                return res.status(500).send("Erreur lors de la création du client.");
            }
            // Confirmation que le client a été créé
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
    const { sexe, nom, prenom, adresse_principale, code_postal, pays, tel_fixe, tel_portable, email } = req.body;

    const sql = `
        UPDATE clients
        SET sexe = ?, nom = ?, prenom = ?, adresse_principale = ?, code_postal = ?, pays = ?, tel_fixe = ?, tel_portable = ?, email = ?
        WHERE id = ?
    `;

    db.run(sql, [sexe, nom, prenom, adresse_principale, code_postal, pays, tel_fixe, tel_portable, email, clientId], function (err) {
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

// Route pour obtenir tous les clients
app.get('/get-clients', authenticateToken, (req, res) => {
    db.all('SELECT * FROM clients', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la récupération des clients.' });
        }
        res.json(rows); // Renvoie les clients sous forme de JSON
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
app.get('/get-bien/:id', authenticateToken, (req, res) => {
    const bienId = req.params.id;

    db.get('SELECT * FROM biens WHERE id = ?', [bienId], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erreur lors de la récupération du bien');
        } else if (!row) {
            res.status(404).send('Bien non trouvé');
        } else {
            res.json(row);  // Renvoie les informations du bien sous forme de JSON
        }
    });
});
app.post('/create-bien', authenticateToken, (req, res) => {
    const { 
        client_id, nom_bien, adresse, nom_proprietaire, saisonnier, annuel, 
        nbr_etage, surface_maison, nbr_chambres, nbr_salle_de_bain, 
        nbr_salle_eau, nbr_salon, code_alarme, cheminee, radiateur, fioul, 
        climatisation, surface_jardin, cloture, code_portail, 
        piscine_type, piscine_longueur, piscine_largeur, jacuzzi, surface_terrasse, 
        wifi, ssid, wifiPassword
    } = req.body;

    const sql = `
        INSERT INTO biens (
            client_id, nom_bien, adresse, nom_proprietaire, saisonnier, annuel, 
            nbr_etage, surface_maison, nbr_chambres, nbr_salle_de_bain, 
            nbr_salle_eau, nbr_salon, code_alarme, cheminee, radiateur, fioul, 
            climatisation, surface_jardin, cloture, code_portail, 
            piscine_type, piscine_longueur, piscine_largeur, jacuzzi, surface_terrasse,
            wifi, ssid, wifiPassword
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
        client_id, nom_bien, adresse, nom_proprietaire, saisonnier, annuel, 
        nbr_etage, surface_maison, nbr_chambres, nbr_salle_de_bain, 
        nbr_salle_eau, nbr_salon, code_alarme, cheminee, radiateur, fioul, 
        climatisation, surface_jardin, cloture, code_portail, 
        piscine_type, piscine_longueur, piscine_largeur, jacuzzi, surface_terrasse,
        wifi, ssid, wifiPassword
    ], function (err) {
        if (err) {
            res.status(500).json({ error: 'Erreur lors de la création du bien.' });
        } else {
            res.json({ message: 'Bien créé avec succès.', id: this.lastID });
        }
    });
});

app.put('/update-bien/:id', authenticateToken, (req, res) => {
    const bienId = req.params.id;
    const { 
        nom_bien, adresse, nom_proprietaire, saisonnier, annuel, 
        nbr_etage, surface_maison, nbr_chambres, nbr_salle_de_bain, 
        nbr_salle_eau, nbr_salon, code_alarme, cheminee, radiateur, fioul, 
        climatisation, surface_jardin, cloture, code_portail, 
        piscine_type, piscine_longueur, piscine_largeur, jacuzzi, surface_terrasse,
        wifi, ssid, wifiPassword
    } = req.body;

    const sql = `
        UPDATE biens 
        SET 
            nom_bien = ?, adresse = ?, nom_proprietaire = ?, saisonnier = ?, 
            annuel = ?, nbr_etage = ?, surface_maison = ?, nbr_chambres = ?, 
            nbr_salle_de_bain = ?, nbr_salle_eau = ?, nbr_salon = ?, 
            code_alarme = ?, cheminee = ?, radiateur = ?, fioul = ?, 
            climatisation = ?, surface_jardin = ?, cloture = ?, code_portail = ?, 
            piscine_type = ?, piscine_longueur = ?, piscine_largeur = ?, 
            jacuzzi = ?, surface_terrasse = ?, wifi = ?, ssid = ?, wifiPassword = ?
        WHERE id = ?
    `;

    db.run(sql, [
        nom_bien, adresse, nom_proprietaire, saisonnier, annuel, 
        nbr_etage, surface_maison, nbr_chambres, nbr_salle_de_bain, 
        nbr_salle_eau, nbr_salon, code_alarme, cheminee, radiateur, fioul, 
        climatisation, surface_jardin, cloture, code_portail, 
        piscine_type, piscine_longueur, piscine_largeur, jacuzzi, surface_terrasse,
        wifi, ssid, wifiPassword, bienId
    ], function (err) {
        if (err) {
            res.status(500).json({ error: 'Erreur lors de la mise à jour du bien.' });
        } else {
            res.json({ message: 'Bien mis à jour avec succès.' });
        }
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



// Lancement du serveur HTTPS
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://squirrel.dynv6.net:${PORT}`);
});