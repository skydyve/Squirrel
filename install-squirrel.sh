#!/bin/bash

# Variables
APP_DIR="/home/squirrel"
GIT_REPO="https://github.com/skydyve/Squirrel"
DOMAIN="squirrel.dynv6.net"
CERT_DIR="$APP_DIR/certs"
SERVICE_FILE="/etc/systemd/system/squirrel.service"
USER="squirrel"
GROUP="squirrel"
REQUIRED_NODE_VERSION="v20.18.0"
NODE_PATH="/home/ubuntu/.nvm/versions/node/v20.18.0/bin/node"  # Chemin vers Node.js installé via nvm

# Fonction pour comparer les versions de Node.js
version_gt() { 
  test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; 
}

# Vérifier la version actuelle de Node.js
if command -v node &> /dev/null
then
    CURRENT_NODE_VERSION=$(node -v)
    echo "Version actuelle de Node.js : $CURRENT_NODE_VERSION"

    if version_gt $REQUIRED_NODE_VERSION $CURRENT_NODE_VERSION; then
        echo "Node.js n'est pas à jour. Mise à jour vers $REQUIRED_NODE_VERSION..."
        
        # Supprimer l'ancienne version de Node.js
        sudo apt remove -y nodejs

        # Ajouter le dépôt Node.js pour la version 20.x et installer la version 20.18.0
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        echo "Node.js est déjà à jour."
    fi
else
    echo "Node.js n'est pas installé. Installation de Node.js $REQUIRED_NODE_VERSION..."

    # Ajouter le dépôt Node.js pour la version 20.x et installer la version 20.18.0
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Vérifier que la version de Node.js est correcte après l'installation/mise à jour
INSTALLED_NODE_VERSION=$(node -v)
if [ "$INSTALLED_NODE_VERSION" == "$REQUIRED_NODE_VERSION" ]; then
    echo "Node.js $REQUIRED_NODE_VERSION installé avec succès."
else
    echo "Erreur : la version installée de Node.js est $INSTALLED_NODE_VERSION, et non $REQUIRED_NODE_VERSION."
    exit 1
fi

# Mise à jour des paquets et installation des dépendances
echo "Mise à jour des paquets et installation de SQLite3, Git, et OpenSSL..."
sudo apt update
sudo apt install -y sqlite3 git openssl

# Créer l'utilisateur et le groupe squirrel
if id "$USER" &>/dev/null; then
    echo "L'utilisateur $USER existe déjà."
else
    echo "Création de l'utilisateur et du groupe $USER..."
    sudo useradd -m -s /bin/bash $USER
fi

# Cloner le dépôt Git dans /home/squirrel si le répertoire n'existe pas déjà
if [ ! -d "$APP_DIR" ]; then
    echo "Clonage du dépôt GitHub dans $APP_DIR..."
    sudo git clone $GIT_REPO $APP_DIR
else
    echo "Le répertoire $APP_DIR existe déjà. Aucun téléchargement du dépôt nécessaire."
fi

# Donner la propriété du dossier à l'utilisateur squirrel
sudo chown -R $USER:$GROUP $APP_DIR

# Aller dans le répertoire cloné et installer les dépendances Node.js nécessaires au backend
echo "Installation des dépendances Node.js nécessaires pour faire fonctionner le backend..."
cd $APP_DIR
sudo -u $USER npm install express bcrypt jsonwebtoken body-parser cookie-parser sqlite3

# Génération des certificats SSL auto-signés
if [ ! -d "$CERT_DIR" ]; then
  echo "Création du répertoire pour les certificats SSL dans $CERT_DIR..."
  sudo mkdir -p $CERT_DIR
fi

echo "Génération des clés et certificats SSL auto-signés..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $CERT_DIR/key.pem \
  -out $CERT_DIR/cert.pem \
  -subj "/C=FR/ST=France/L=Paris/O=Squirrel/OU=IT/CN=$DOMAIN"

# Donner la propriété des certificats à l'utilisateur squirrel
sudo chown -R $USER:$GROUP $CERT_DIR

# Créer un service systemd pour l'application
echo "Création du fichier de service systemd pour Squirrel..."
sudo bash -c "cat > $SERVICE_FILE" <<EOL
[Unit]
Description=Squirrel Application
After=network.target

[Service]
ExecStart=$NODE_PATH $APP_DIR/server.js
WorkingDirectory=$APP_DIR
Restart=always
User=$USER
Group=$GROUP
Environment=PATH=/usr/bin:/usr/local/bin:/home/ubuntu/.nvm/versions/node/v20.18.0/bin
Environment=NODE_ENV=production
RestartSec=10
StandardOutput=append:$APP_DIR/squirrel.log
StandardError=append:$APP_DIR/squirrel_error.log

[Install]
WantedBy=multi-user.target
EOL

# Recharger systemd, activer et démarrer le service
echo "Activation et démarrage du service squirrel..."
sudo systemctl daemon-reload
sudo systemctl enable squirrel
sudo systemctl start squirrel

# Vérifier le statut du service
sudo systemctl status squirrel

# Affichage des informations d'installation réussie
echo "Installation terminée !"
echo "Le service Squirrel est démarré et écoute sur HTTPS avec des certificats auto-signés."
