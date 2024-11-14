function initializeClientPage() {
    let currentClientId = null;
    let currentBienId = null;
    
    const createClientBtn = document.getElementById('create-client-btn');
    const createClientForm = document.getElementById('create-client-form');
    const clientList = document.getElementById('client-list');
    
    // Afficher le formulaire de création lorsque le bouton "Créer un client" est cliqué
    if (createClientBtn) {
        createClientBtn.addEventListener('click', function () {
            if (clientList) clientList.style.display = 'none';
            if (createClientForm) createClientForm.style.display = 'block';
        });
    }

    // Gestion du bouton retour dans le formulaire de création
    const createBackBtn = document.getElementById('create-back-btn');
    if (createBackBtn) {
        createBackBtn.addEventListener('click', function () {
            if (clientList) clientList.style.display = 'block';
            if (createClientForm) createClientForm.style.display = 'none';
        });
    }

    // **Ajout du gestionnaire d'événements pour soumettre le formulaire de création de client**
    const submitClientBtn = document.getElementById('submit-client-btn'); // Ajoutez un id au bouton "Soumettre" dans votre formulaire HTML
    if (submitClientBtn) {
        submitClientBtn.addEventListener('click', function (event) {
            event.preventDefault();
            createClient();
        });
    }

    document.getElementById('cheminee').addEventListener('change', function () {
        const chemineeOptions = document.getElementById('cheminéeOptions');
        
        if (this.checked) {
            chemineeOptions.style.display = 'block';  // Afficher les options si "Cheminée" est cochée
        } else {
            chemineeOptions.style.display = 'none';  // Masquer les options si "Cheminée" est décochée
            document.getElementById('chemineeGranule').checked = false;
            document.getElementById('chemineeBois').checked = false;
        }
    });

    document.getElementById('poele').addEventListener('change', function () {
        const chemineeOptions = document.getElementById('cheminéeOptions');

        if (this.checked) {
            chemineeOptions.style.display = 'block';  // Afficher les options si "Poêle" est cochée
        } else {
            chemineeOptions.style.display = 'none';  // Masquer les options si "Poêle" est décochée
            document.getElementById('chemineeGranule').checked = false;
            document.getElementById('chemineeBois').checked = false;
        }
    });

    function createClient() {
        // Récupérer les données du formulaire de création de client
        const clientData = {
            civilite: document.getElementById('civilite').value,
            nom: document.getElementById('nom').value,
            prenom: document.getElementById('prenom').value,
            adresse_principale: document.getElementById('adresse_principale').value,
            code_postal: document.getElementById('code_postal').value,
            ville: document.getElementById('ville').value,
            pays: document.getElementById('pays').value,
            tel_fixe: document.getElementById('tel_fixe').value,
            tel_portable: document.getElementById('tel_portable').value,
            email: document.getElementById('email').value
        };

        // Validation des champs si nécessaire
        if (!clientData.nom || !clientData.prenom || !clientData.email) {
            alert('Veuillez remplir les champs obligatoires.');
            return;
        }

        // Envoyer les données au serveur pour créer le client
        fetch('/create-client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clientData)
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Erreur lors de la création du client');
            }
        })
        .then(data => {
            alert('Client créé avec succès');
            loadClients();  // Recharger la liste des clients
            document.getElementById('create-client-form').reset();  // Réinitialiser le formulaire
            document.getElementById('create-client-form').style.display = 'none';  // Cacher le formulaire de création
            clientList.style.display = 'block';  // Réafficher la liste des clients
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    }
    // Fonction pour charger la liste des clients
    function loadClients() {
        fetch('/get-clients')
            .then(response => response.json())
            .then(data => {
                const clientList = document.getElementById('client-list'); // Div qui contient la liste des clients
                if (!clientList) {
                    console.error("L'élément client-list est introuvable.");
                    return;
                }
                clientList.innerHTML = '';  // Vider l'élément avant d'ajouter les nouveaux clients
    
                if (data.length === 0) {
                    clientList.innerHTML = '<p>Aucun client trouvé.</p>';
                } else {
                    data.forEach(client => {
                        const button = document.createElement('button');
                        button.textContent = `${client.nom} ${client.prenom} - ${client.email}`;
                        button.className = 'client-btn';
                        button.addEventListener('click', function () {
                            loadClientDetails(client.id);  // Charger les détails du client sélectionné
                        });
                        clientList.appendChild(button);
                    });
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des clients:', error);
            });
    }

// Gestion de l'affichage du champ Surface PoolHouse
document.querySelectorAll('input[name="poolhouse"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
        const poolhouseSurface = document.getElementById('poolhouseSurface');
        if (document.getElementById('poolhouseOui').checked) {
            poolhouseSurface.style.display = 'table-row'; // Afficher la surface
        } else {
            poolhouseSurface.style.display = 'none'; // Masquer la surface
            document.getElementById('surfacePoolhouse').value = ''; // Réinitialiser la valeur si "Non" est sélectionné
        }
    });
});

    // Masquer la liste des biens lorsque le formulaire client est visible
function loadClientDetails(clientId) {
    currentClientId = clientId;  // Stocker l'ID du client en cours
    fetch(`/get-client/${clientId}`)
        .then(response => response.json())
        .then(client => {
            const editForm = document.getElementById('edit-client-form');
            const clientList = document.getElementById('client-list');
            const createForm = document.getElementById('create-client-form');
            const biensList = document.getElementById('biens-list');  // Assurez-vous que la liste des biens soit masquée
            const updateClientBtn = document.getElementById('update-client-btn');
            const deleteClientBtn = document.getElementById('delete-client-btn');

            // Masquer la liste des clients et le formulaire de création
            if (clientList) clientList.style.display = 'none';
            if (createForm) createForm.style.display = 'none';
            if (editForm) editForm.style.display = 'block';  // Afficher le formulaire client
            if (updateClientBtn) updateClientBtn.style.display = 'block';
            if (deleteClientBtn) deleteClientBtn.style.display = 'block';

            // Masquer la liste des biens par défaut
            if (biensList) biensList.style.display = 'none';

            // Remplir le formulaire client avec les détails
            document.getElementById('edit-civilite').value = client.civilite || '';
            document.getElementById('edit-nom').value = client.nom || '';
            document.getElementById('edit-prenom').value = client.prenom || '';
            document.getElementById('edit-adresse_principale').value = client.adresse_principale || '';
            document.getElementById('edit-code_postal').value = client.code_postal || '';
            document.getElementById('edit-ville').value = client.ville || '';
            document.getElementById('edit-pays').value = client.pays || '';
            document.getElementById('edit-tel_fixe').value = client.tel_fixe || '';
            document.getElementById('edit-tel_portable').value = client.tel_portable || '';
            document.getElementById('edit-email').value = client.email || '';

            // Charger les biens du client (cette fonction peut rester si elle est utile pour d'autres actions)
            loadClientBiens(clientId);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des détails du client:', error);
        });
}

            // Gestion du bouton "Liste des biens"
            document.getElementById('showBiensList').addEventListener('click', function () {
                const clientForm = document.getElementById('edit-client-form');
                const biensList = document.getElementById('biens-list');
                const updateClientBtn = document.getElementById('update-client-btn');
                const deleteClientBtn = document.getElementById('delete-client-btn');
                
                // Masquer le formulaire client et les boutons "Mettre à jour" et "Supprimer"
                if (clientForm) clientForm.style.display = 'none';
                if (updateClientBtn) updateClientBtn.style.display = 'none';
                if (deleteClientBtn) deleteClientBtn.style.display = 'none';

                // Afficher la liste des biens
                if (biensList) biensList.style.display = 'block';
            });

            // Gestion de la suppression du bien
document.getElementById('deleteBienBtn').addEventListener('click', async function () {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bien ?')) {
        try {
            const response = await fetch(`/delete-bien/${currentBienId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Bien supprimé avec succès');
                loadClientBiens(currentClientId);  // Recharger la liste des biens
                document.getElementById('biensForm').style.display = 'none';  // Masquer le formulaire des biens
            } else {
                alert('Erreur lors de la suppression du bien');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du bien :', error);
        }
    }
});

    // Fonction pour charger les détails d'un bien pour l'afficher dans le formulaire
    function loadClientBiens(clientId) {
        fetch(`/get-biens/${clientId}`)
            .then(response => response.json())
            .then(biens => {
                const biensList = document.getElementById('biens-list');
                biensList.innerHTML = '';  // Vider la liste des biens
    
                if (biens.length === 0) {
                    biensList.innerHTML = '<p>Aucun bien trouvé pour ce client.</p>';
                } else {
                    biens.forEach(bien => {
                        const bienItem = document.createElement('button');
                        bienItem.textContent = `Bien #${bien.id} - ${bien.surface_maison} m²`;
                        bienItem.className = 'bien-btn';
                        bienItem.addEventListener('click', function () {
                            console.log('Bien sélectionné:', bien);  // Log pour vérifier quel bien est cliqué
                            loadBienDetails(bien.id);  // Charger les détails du bien dans le formulaire
                        });
                        biensList.appendChild(bienItem);
                    });
                }
    
                const listeBiensBackBtn = document.getElementById('liste-biens-back-btn');
                if (listeBiensBackBtn) {
                    listeBiensBackBtn.style.display = 'block';
                    listeBiensBackBtn.addEventListener('click', function () {
                        // Masquer la liste des biens et réafficher le formulaire client
                        biensList.style.display = 'none';
                        document.getElementById('edit-client-form').style.display = 'block';
                    });
                }
            })
            .catch(error => console.error('Erreur lors du chargement des biens du client:', error));
    }

    function loadBienDetails(bienId) {
        currentBienId = bienId;
        
        // Assurez-vous que le formulaire de biens est visible
        const biensForm = document.getElementById('biensForm');
        if (biensForm) {
            biensForm.style.display = 'block';
        } else {
            console.error("Le formulaire des biens (biensForm) est introuvable.");
            return;
        }
    
        fetch(`/get-bien/${bienId}`)
            .then(response => response.json())
            .then(bien => {
                // Remplir les champs du formulaire avec les données du bien
                document.getElementById('nomBien').value = bien.nom_bien || '';
                document.getElementById('nomProprietaire').value = bien.nom_proprietaire || '';
                document.getElementById('adresseBien').value = bien.adresse || '';
                document.getElementById('surfaceMaison').value = bien.surface_maison || '';
                document.getElementById('nbrEtage').value = bien.nbr_etage || '';
                document.getElementById('nbrSalleEau').value = bien.nbr_salle_eau || '';
                document.getElementById('nbrChambres').value = bien.nbr_chambres || '';
                document.getElementById('nbrSalleBain').value = bien.nbr_salle_de_bain || '';
                document.getElementById('nbrSalon').value = bien.nbr_salon || '';
                document.getElementById('codeAlarme').value = bien.code_alarme || '';
                document.getElementById('surfaceJardin').value = bien.surface_jardin || '';
                document.getElementById('surfaceTerrasse').value = bien.surface_terrasse || '';
                document.getElementById('codePortail').value = bien.code_portail || '';
    
                // Piscine
                document.getElementById('piscineType').value = bien.piscine_type || 'aucune';
                document.getElementById('piscineLongueur').value = bien.piscine_longueur || '';
                document.getElementById('piscineLargeur').value = bien.piscine_largeur || '';
    
                // Jacuzzi
                document.querySelector(`input[name="jacuzzi"][value="${bien.jacuzzi ? 'oui' : 'non'}"]`).checked = true;
    
                // Wi-Fi
                document.getElementById('wifiCheckbox').checked = bien.wifi || false;
                document.getElementById('ssid').value = bien.ssid || '';
                document.getElementById('wifiPassword').value = bien.wifiPassword || '';
                document.getElementById('wifiDetails').style.display = bien.wifi ? 'table-row' : 'none';
    
                // Poolhouse
                document.getElementById('poolhouseOui').checked = bien.poolhouse || false;
                document.getElementById('surfacePoolhouse').value = bien.surface_poolhouse || '';
                document.getElementById('poolhouseSurface').style.display = bien.poolhouse ? 'table-row' : 'none';
    
                // Aperçu de la photo
                const photoPreview = document.getElementById('photoPreview');
                if (bien.photo_url) {
                    const photoUrl = bien.photo_url.startsWith('/uploads/') ? bien.photo_url : `/uploads/${bien.photo_url}`;
                    photoPreview.src = photoUrl;
                    photoPreview.style.display = 'block';
                } else {
                    photoPreview.src = '';
                    photoPreview.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des détails du bien:', error);
            });
    }

    document.getElementById('photoBien').addEventListener('change', function (event) {
        const preview = document.getElementById('photoPreview');
        const file = event.target.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = 'block'; // Afficher l'aperçu de l'image
            }
            
            reader.readAsDataURL(file); // Lire le fichier image
        } else {
            preview.src = '';
            preview.style.display = 'none'; // Masquer l'aperçu si aucun fichier
        }
    });

    document.getElementById('saveBiensBtn').addEventListener('click', async function () {
        const nomBienElement = document.getElementById('nomBien');
        const nomProprietaireElement = document.getElementById('nomProprietaire');
        const adresseBienElement = document.getElementById('adresseBien');
        const formData = new FormData();
    
        // Vérifiez l'existence des éléments avant d'accéder à leurs valeurs
        if (!nomBienElement || !nomProprietaireElement || !adresseBienElement) {
            console.error("Un des éléments requis est introuvable dans le formulaire");
            return;
        }
    
        // Créez l'objet de données et ajoutez-les au formData
        formData.append('client_id', currentClientId);
        formData.append('nom_bien', nomBienElement.value || '');
        formData.append('nom_proprietaire', nomProprietaireElement.value || '');
        formData.append('saisonnier', document.getElementById('saisonnier').checked);
        formData.append('annuel', document.getElementById('annuel').checked);
        formData.append('adresse', adresseBienElement.value || '');
        formData.append('nbr_etage', document.getElementById('nbrEtage').value || '');
        formData.append('surface_maison', document.getElementById('surfaceMaison').value || '');
        formData.append('nbr_chambres', document.getElementById('nbrChambres').value || '');
        formData.append('nbr_salle_de_bain', document.getElementById('nbrSalleBain').value || '');
        formData.append('nbr_salle_eau', document.getElementById('nbrSalleEau').value || '');
        formData.append('nbr_salon', document.getElementById('nbrSalon').value || '');
        formData.append('code_alarme', document.getElementById('codeAlarme').value || '');
        formData.append('surface_jardin', document.getElementById('surfaceJardin').value || '');
        formData.append('cloture', document.querySelector('input[name="cloture"]:checked').value || '');
        formData.append('code_portail', document.getElementById('codePortail').value || '');
        formData.append('piscine_type', document.getElementById('piscineType').value || 'aucune');
        formData.append('piscine_longueur', document.getElementById('piscineLongueur').value || '');
        formData.append('piscine_largeur', document.getElementById('piscineLargeur').value || '');
        formData.append('jacuzzi', document.querySelector('input[name="jacuzzi"]:checked').value || 'non');
        formData.append('surface_terrasse', document.getElementById('surfaceTerrasse').value || '');
        formData.append('wifi', document.getElementById('wifiCheckbox').checked);
        formData.append('ssid', document.getElementById('ssid').value || '');
        formData.append('wifiPassword', document.getElementById('wifiPassword').value || '');
        formData.append('chauffage_sol', document.getElementById('chauffageSol').checked);
        formData.append('poele', document.getElementById('poele').checked);
        formData.append('poolhouse', document.querySelector('input[name="poolhouse"]:checked').value || 'non');
        formData.append('surface_poolhouse', document.getElementById('surfacePoolhouse').value || '');
    
        // Ajouter la photo sélectionnée
        const photoInput = document.getElementById('photoBien');
        if (photoInput.files.length > 0) {
            formData.append('photoBien', photoInput.files[0]);
        }
    
        try {
            const method = currentBienId ? 'PUT' : 'POST';
            const url = currentBienId ? `/update-bien/${currentBienId}` : '/create-bien';
            const response = await fetch(url, {
                method,
                body: formData
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert('Bien enregistré avec succès');
                if (!currentBienId) {
                    currentBienId = result.id;
                }
                loadClientBiens(currentClientId);  // Recharger les biens du client
            } else {
                alert('Erreur lors de l\'enregistrement du bien');
            }
        } catch (error) {
            console.error('Erreur :', error);
        }
    });



    const editBackBtn = document.getElementById('edit-back-btn');
    if (editBackBtn) {
        editBackBtn.addEventListener('click', function () {
            document.getElementById('edit-client-form').style.display = 'none';
            document.getElementById('client-list').style.display = 'block';
            const biensForm = document.getElementById('biensForm');
            if (biensForm) {
                biensForm.style.display = 'none';
            }
        });
    }

    document.getElementById('biens-back-btn').addEventListener('click', function () {
        const biensForm = document.getElementById('biensForm');
        const biensList = document.getElementById('biens-list');
        const clientForm = document.getElementById('edit-client-form');
        const updateClientBtn = document.getElementById('update-client-btn');
        const deleteClientBtn = document.getElementById('delete-client-btn');

        if (biensForm) biensForm.style.display = 'none';
        if (biensList) biensList.style.display = 'none';

        if (clientForm) clientForm.style.display = 'block';

        if (updateClientBtn) updateClientBtn.style.display = 'block';
        if (deleteClientBtn) deleteClientBtn.style.display = 'block';
    });

    const backButton = document.getElementById('create-back-btn');
    if (backButton) {
        backButton.addEventListener('click', function () {
            const clientList = document.getElementById('client-list');
            const createForm = document.getElementById('create-client-form');
            const editForm = document.getElementById('edit-client-form');

            if (createForm) createForm.style.display = 'none';
            if (editForm) editForm.style.display = 'none';
            if (clientList) clientList.style.display = 'block';
        });
    }

    document.getElementById('openBiensForm').addEventListener('click', function () {
        const biensForm = document.getElementById('biensForm');
        const editForm = document.getElementById('edit-client-form');

        document.getElementById('nomBien').value = '';
        document.getElementById('nomProprietaire').value = '';
        document.getElementById('adresseBien').value = '';
        document.getElementById('nbrEtage').value = '';
        document.getElementById('surfaceMaison').value = '';
        document.getElementById('nbrChambres').value = '';
        document.getElementById('nbrSalleBain').value = '';
        document.getElementById('nbrSalleEau').value = '';
        document.getElementById('nbrSalon').value = '';
        document.getElementById('codeAlarme').value = '';
        document.getElementById('surfaceJardin').value = '';
        document.querySelector('input[name="cloture"][value="non"]').checked = true;
        document.getElementById('codePortail').value = '';
        document.getElementById('piscineType').value = 'aucune';
        document.getElementById('piscineLongueur').value = '';
        document.getElementById('piscineLargeur').value = '';
        document.querySelector('input[name="jacuzzi"][value="non"]').checked = true;
        document.getElementById('surfaceTerrasse').value = '';

        document.getElementById('saisonnier').checked = false;
        document.getElementById('annuel').checked = false;

        document.getElementById('cheminee').checked = false;
        document.getElementById('climatisation').checked = false;
        document.getElementById('radiateur').checked = false;
        document.getElementById('fioul').checked = false;

        currentBienId = null;

        if (biensForm.style.display === 'none') {
            biensForm.style.display = 'block';
            editForm.style.display = 'none';
        } else {
            biensForm.style.display = 'none';
            editForm.style.display = 'block';
        }
    });
    // Soumission du formulaire pour mettre à jour le client
document.getElementById('update-client-btn').addEventListener('click', async function () {
    const updatedClient = {
        civilite: document.getElementById('edit-civilite').value,
        nom: document.getElementById('edit-nom').value,
        prenom: document.getElementById('edit-prenom').value,
        adresse_principale: document.getElementById('edit-adresse_principale').value,
        code_postal: document.getElementById('edit-code_postal').value,
        ville: document.getElementById('edit-ville').value,
        pays: document.getElementById('edit-pays').value,
        tel_fixe: document.getElementById('edit-tel_fixe').value,
        tel_portable: document.getElementById('edit-tel_portable').value,
        email: document.getElementById('edit-email').value
    };

    try {
        const response = await fetch(`/update-client/${currentClientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedClient)
        });

        if (response.ok) {
            alert('Client mis à jour avec succès');
            loadClients();  // Recharger la liste des clients après la mise à jour
        } else {
            alert('Erreur lors de la mise à jour du client');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du client:', error);
    }
});
    // Suppression du client
    const deleteClientBtn = document.getElementById('delete-client-btn');
    if (deleteClientBtn) {
        deleteClientBtn.addEventListener('click', function () {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
                fetch(`/delete-client/${currentClientId}`, {
                    method: 'DELETE',
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    const editForm = document.getElementById('edit-client-form');
                    if (editForm) {
                        editForm.style.display = 'none';
                    }
                    loadClients();  // Recharger la liste après suppression
                    const clientList = document.getElementById('client-list');
                    if (clientList) {
                        clientList.style.display = 'block';
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la suppression du client:', error);
                });
            }
        });
    }
    const searchBar = document.getElementById('search-bar'); // Barre de recherche
    searchBar.addEventListener('input', function () {
        searchClient();
    });
    
    // Fonction pour rechercher les clients
    function searchClient() {
        const searchTerm = searchBar.value.toLowerCase();
    
        fetch(`/search?term=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                const clientList = document.getElementById('client-list'); // L'élément qui contient la liste des clients
                clientList.innerHTML = '';  // Vider la liste avant d'afficher les résultats de recherche
    
                if (data.length === 0) {
                    clientList.innerHTML = '<p>Aucun client trouvé.</p>';
                } else {
                    data.forEach(client => {
                        const button = document.createElement('button');
                        button.textContent = `${client.nom} ${client.prenom} - ${client.email}`;
                        button.className = 'client-btn';
                        button.addEventListener('click', function () {
                            loadClientDetails(client.id);  // Charger les détails du client sélectionné
                        });
                        clientList.appendChild(button);
                    });
                }
            })
            .catch(error => {
                console.error('Erreur lors de la recherche du client:', error);
            });
    }
    // Gestion de l'affichage des champs SSID et mot de passe WiFi
document.getElementById('wifiCheckbox').addEventListener('change', function () {
    const wifiDetails = document.getElementById('wifiDetails');
    if (this.checked) {
        wifiDetails.style.display = 'table-row';  // Afficher les champs SSID et mot de passe
    } else {
        wifiDetails.style.display = 'none';  // Cacher les champs SSID et mot de passe
        // Réinitialiser les valeurs des champs
        document.getElementById('ssid').value = '';
        document.getElementById('wifiPassword').value = '';
    }
});

// Fonction pour ouvrir/fermer le popup de contact
function toggleContactPopup() {
    const popup = document.getElementById('contact-popup');
    const addContactForm = document.getElementById('add-contact-form');
    if (popup) {
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        if (popup.style.display === 'block') {
            loadContacts(); // Charger la liste des contacts
            addContactForm.style.display = 'none'; // Masque le formulaire lors de l'ouverture
        }
    }
}

// Fonction pour charger la liste des contacts pour un client spécifique
function loadContacts() {
    if (!currentClientId) {
        console.error("ID du client en cours non défini");
        return;
    }

    fetch(`/get-contacts/${currentClientId}`)
        .then(response => response.json())
        .then(contacts => {
            const contactList = document.getElementById('contact-list');
            contactList.innerHTML = '';

            contacts.forEach(contact => {
                const contactContainer = document.createElement('div');
                contactContainer.className = 'contact-item';

                const contactBtn = document.createElement('button');
                contactBtn.textContent = `${contact.nom} ${contact.prenom}`;
                contactBtn.className = 'contact-btn';
                contactBtn.onclick = () => loadContactDetails(contact.id);

                const deleteIcon = document.createElement('span');
                deleteIcon.innerHTML = '&times;';
                deleteIcon.className = 'delete-contact-icon';
                deleteIcon.onclick = (event) => {
                    event.stopPropagation(); // Empêche l'ouverture des détails du contact
                    deleteSpecificContact(contact.id);
                };

                contactContainer.appendChild(contactBtn);
                contactContainer.appendChild(deleteIcon);
                contactList.appendChild(contactContainer);
            });
        })
        .catch(error => console.error("Erreur lors du chargement des contacts:", error));
}

// Fonction pour afficher les détails d'un contact dans le formulaire de modification
function loadContactDetails(contactId) {
    currentContactId = contactId;

    fetch(`/get-contact/${contactId}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Contact non trouvé");
                } else {
                    throw new Error(`Erreur lors du chargement du contact : ${response.status}`);
                }
            }
            return response.json();
        })
        .then(contact => {
            // Remplissez le formulaire avec les informations du contact récupérées
            document.getElementById('contact-nom').value = contact.nom || '';
            document.getElementById('contact-prenom').value = contact.prenom || '';
            document.getElementById('contact-tel').value = contact.telephone || '';
            document.getElementById('contact-email').value = contact.email || '';

            // Affichez le formulaire d'édition de contact
            document.getElementById('add-contact-form').style.display = 'block';
        })
        .catch(error => {
            console.error("Erreur lors du chargement du contact:", error);
            alert(error.message);
        });
}

// Fonction pour sauvegarder le contact (ajouter ou mettre à jour)
function saveContact() {
    const contactData = {
        nom: document.getElementById('contact-nom').value,
        prenom: document.getElementById('contact-prenom').value,
        telephone: document.getElementById('contact-tel').value,
        email: document.getElementById('contact-email').value,
        client_id: currentClientId // ID du client associé
    };

    const url = currentContactId ? `/update-contact/${currentContactId}` : '/create-contact';
    const method = currentContactId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
        }
        return response.json(); // Transforme la réponse en JSON
    })
    .then(data => {
        currentContactId = data.contactId; // Mettez à jour l'ID du contact pour la sélection
        loadContacts(); // Recharger la liste des contacts après la sauvegarde
        toggleContactPopup(); // Fermer le popup
        alert("Contact sauvegardé avec succès");
    })
    .catch(error => console.error("Erreur lors de la sauvegarde du contact:", error));
}

// Fonction pour afficher le formulaire d'ajout de contact
function showAddContactForm() {
    const addContactForm = document.getElementById('add-contact-form');
    if (addContactForm) {
        // Réinitialiser les champs du formulaire de contact
        document.getElementById('contact-nom').value = '';
        document.getElementById('contact-prenom').value = '';
        document.getElementById('contact-tel').value = '';
        document.getElementById('contact-email').value = '';

        // Affiche le formulaire d'ajout de contact
        addContactForm.style.display = 'block';
        currentContactId = null;  // Réinitialise l'ID pour indiquer qu'il s'agit d'une nouvelle création
    } else {
        console.error("Le formulaire d'ajout de contact est introuvable.");
    }
}

// Fonction pour supprimer un contact spécifique en utilisant son ID
function deleteSpecificContact(contactId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
        fetch(`/delete-contact/${contactId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                loadContacts();  // Recharger la liste des contacts après la suppression
                alert("Contact supprimé avec succès");
            } else {
                alert("Erreur lors de la suppression du contact.");
            }
        })
        .catch(error => console.error("Erreur lors de la suppression du contact:", error));
    }
}

// Associer les événements aux boutons
document.getElementById('contact-btn').addEventListener('click', toggleContactPopup);
const saveContactBtn = document.getElementById('save-contact-btn');
if (saveContactBtn) {
    saveContactBtn.addEventListener('click', saveContact);
}
const addContactBtn = document.querySelector('button[onclick="showAddContactForm()"]');
if (addContactBtn) {
    addContactBtn.addEventListener('click', showAddContactForm);
}
const closePopupCross = document.querySelector('.close-popup-cross');
if (closePopupCross) {
    closePopupCross.addEventListener('click', toggleContactPopup);
}

    loadClients();  // Charger la liste des clients lors de l'initialisation de la page
}