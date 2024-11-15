#!/bin/bash

# Variables
APP_DIR="/home/squirrel"
GIT_REPO="https://github.com/skydyve/Squirrel"
EXCLUDE_FILES=("db.sqlite" "cert.pem" "key.pem" "node_modules" "package.json")
USER="squirrel"
GROUP="squirrel"
BACKUP_DIR="$APP_DIR/backup_exclude_files"

# Se déplacer dans le répertoire de l'application
cd $APP_DIR || { echo "Erreur : le répertoire $APP_DIR n'existe pas."; exit 1; }

# Vérifier que le dépôt Git est configuré correctement
if [ ! -d ".git" ]; then
    echo "Erreur : Ce répertoire n'est pas un dépôt Git. Clonez d'abord le dépôt."
    exit 1
fi

# Créer un répertoire de sauvegarde temporaire
mkdir -p $BACKUP_DIR

# Sauvegarder les fichiers exclus
echo "Sauvegarde des fichiers sensibles..."
for file in "${EXCLUDE_FILES[@]}"; do
    if [ -e "$file" ]; then
        cp -r "$file" "$BACKUP_DIR/"
        echo "Fichier $file sauvegardé dans $BACKUP_DIR."
    fi
done

# Mettre à jour le code depuis le dépôt GitHub
echo "Récupération des dernières mises à jour depuis GitHub..."
sudo -u $USER git fetch --all
sudo -u $USER git reset --hard origin/main

# Restaurer les fichiers sensibles depuis la sauvegarde
echo "Restauration des fichiers sensibles..."
for file in "${EXCLUDE_FILES[@]}"; do
    if [ -e "$BACKUP_DIR/$file" ]; then
        mv "$BACKUP_DIR/$file" "$APP_DIR/$file"
        echo "Fichier $file restauré depuis la sauvegarde."
    fi
done

# Appliquer les permissions correctes
echo "Réapplication des permissions des fichiers sensibles..."
for file in "${EXCLUDE_FILES[@]}"; do
    if [ -e "$APP_DIR/$file" ]; then
        sudo chown $USER:$GROUP "$APP_DIR/$file"
        sudo chmod 660 "$APP_DIR/$file"  # Lecture/écriture pour le propriétaire et le groupe
        echo "Permissions réappliquées pour $file."
    fi
done

# Supprimer le répertoire de sauvegarde temporaire
rm -rf $BACKUP_DIR

# Réinstaller les dépendances si nécessaire
echo "Mise à jour des dépendances npm..."
if [[ ! " ${EXCLUDE_FILES[*]} " =~ "node_modules" ]]; then
    sudo -u $USER npm install
else
    echo "Le dossier node_modules est exclu des mises à jour, installation npm ignorée."
fi

# Redémarrer le service systemd pour appliquer les mises à jour
echo "Redémarrage du service Squirrel..."
sudo systemctl restart squirrel

echo "Mise à jour terminée avec succès ! Le service Squirrel a été redémarré."