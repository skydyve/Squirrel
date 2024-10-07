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

    function createClient() {
        // Récupérer les données du formulaire de création de client
        const clientData = {
            civilite: document.getElementById('civilite').value,
            nom: document.getElementById('nom').value,
            prenom: document.getElementById('prenom').value,
            adresse_principale: document.getElementById('adresse_principale').value,
            code_postal: document.getElementById('code_postal').value,
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
                const clientList = document.getElementById('client-list');
                if (!clientList) {
                    console.error("L'élément client-list est introuvable.");
                    return;
                }
                clientList.innerHTML = '';

                if (data.length === 0) {
                    clientList.innerHTML = '<p>Aucun client trouvé.</p>';
                } else {
                    data.forEach(client => {
                        const button = document.createElement('button');
                        button.textContent = `${client.nom} ${client.prenom} - ${client.email}`;
                        button.className = 'client-btn';
                        button.addEventListener('click', function () {
                            loadClientDetails(client.id);  // Charger les détails du client et ses biens
                        });
                        clientList.appendChild(button);
                    });
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des clients:', error);
            });
    }

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


    // Fonction pour charger la liste des biens d'un client
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
                            loadBienDetails(bien.id);  // Charger les détails du bien dans le formulaire
                        });
                        biensList.appendChild(bienItem);
                    });
                }
            })
            .catch(error => console.error('Erreur lors du chargement des biens du client:', error));
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
    function loadBienDetails(bienId) {
        currentBienId = bienId;
        fetch(`/get-bien/${bienId}`)
            .then(response => response.json())
            .then(bien => {
                // Remplir le formulaire des biens avec les détails du bien sélectionné
                document.getElementById('nomBien').value = bien.nom_bien || '';
                document.getElementById('nomProprietaire').value = bien.nom_proprietaire || '';
                document.getElementById('saisonnier').checked = bien.saisonnier || false;
                document.getElementById('annuel').checked = bien.annuel || false;
                document.getElementById('adresseBien').value = bien.adresse || '';
                document.getElementById('nbrEtage').value = bien.nbr_etage || '';
                document.getElementById('surfaceMaison').value = bien.surface_maison || '';
                document.getElementById('nbrChambres').value = bien.nbr_chambres || '';
                document.getElementById('nbrSalleBain').value = bien.nbr_salle_de_bain || '';
                document.getElementById('nbrSalleEau').value = bien.nbr_salle_eau || '';
                document.getElementById('nbrSalon').value = bien.nbr_salon || '';
                document.getElementById('codeAlarme').value = bien.code_alarme || '';
                document.getElementById('cheminee').checked = bien.cheminee || false;
                document.getElementById('radiateur').checked = bien.radiateur || false;
                document.getElementById('fioul').checked = bien.fioul || false;
                document.getElementById('climatisation').checked = bien.climatisation || false;
                document.getElementById('surfaceJardin').value = bien.surface_jardin || '';
                document.querySelector(`input[name="cloture"][value="${bien.cloture ? 'oui' : 'non'}"]`).checked = true;
                document.getElementById('codePortail').value = bien.code_portail || '';
                document.getElementById('piscineType').value = bien.piscine_type || 'creusee';
                document.getElementById('piscineLongueur').value = bien.piscine_longueur || '';
                document.getElementById('piscineLargeur').value = bien.piscine_largeur || '';
                document.querySelector(`input[name="jacuzzi"][value="${bien.jacuzzi ? 'oui' : 'non'}"]`).checked = true;
                document.getElementById('surfaceTerrasse').value = bien.surface_terrasse || '';
    
                // Afficher le formulaire des biens
                document.getElementById('biensForm').style.display = 'block';
            })
            .catch(error => console.error('Erreur lors du chargement des détails du bien:', error));
    }
    
    // Gestion de la soumission du formulaire des biens
    document.getElementById('saveBiensBtn').addEventListener('click', async function () {
        const data = {
            client_id: currentClientId,
            nom_bien: document.getElementById('nomBien').value,
            nom_proprietaire: document.getElementById('nomProprietaire').value,
            saisonnier: document.getElementById('saisonnier').checked,
            annuel: document.getElementById('annuel').checked,
            adresse: document.getElementById('adresseBien').value,
            nbr_etage: document.getElementById('nbrEtage').value,
            surface_maison: document.getElementById('surfaceMaison').value,
            nbr_chambres: document.getElementById('nbrChambres').value,
            nbr_salle_de_bain: document.getElementById('nbrSalleBain').value,
            nbr_salle_eau: document.getElementById('nbrSalleEau').value,
            nbr_salon: document.getElementById('nbrSalon').value,
            code_alarme: document.getElementById('codeAlarme').value,
            cheminee: document.getElementById('cheminee').checked,
            radiateur: document.getElementById('radiateur').checked,
            fioul: document.getElementById('fioul').checked,
            climatisation: document.getElementById('climatisation').checked,
            surface_jardin: document.getElementById('surfaceJardin').value,
            cloture: document.querySelector('input[name="cloture"]:checked').value === 'oui',
            code_portail: document.getElementById('codePortail').value,
            piscine_type: document.getElementById('piscineType').value,
            piscine_longueur: document.getElementById('piscineLongueur').value,
            piscine_largeur: document.getElementById('piscineLargeur').value,
            jacuzzi: document.querySelector('input[name="jacuzzi"]:checked').value === 'oui',
            surface_terrasse: document.getElementById('surfaceTerrasse').value
        };
    
        try {
            const method = currentBienId ? 'PUT' : 'POST';
            const url = currentBienId ? `/update-bien/${currentBienId}` : '/create-bien';
    
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
    
            if (response.ok) {
                alert('Bien enregistré avec succès');
                loadClientBiens(currentClientId);  // Recharger la liste des biens
            } else {
                alert('Erreur lors de l\'enregistrement du bien');
            }
        } catch (error) {
            console.error('Erreur :', error);
        }
    });

    // Ajouter le comportement du bouton retour sur le formulaire de modification
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

    // Masquer le formulaire des biens et la liste des biens
    if (biensForm) biensForm.style.display = 'none';
    if (biensList) biensList.style.display = 'none';

    // Réafficher le formulaire client
    if (clientForm) clientForm.style.display = 'block';

    // Réafficher les boutons "Mettre à jour" et "Supprimer"
    if (updateClientBtn) updateClientBtn.style.display = 'block';
    if (deleteClientBtn) deleteClientBtn.style.display = 'block';
});
    // Événement pour le bouton "Retour" sur la page de création
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

// Comportement du bouton pour afficher le formulaire des biens
document.getElementById('openBiensForm').addEventListener('click', function() {
    const biensForm = document.getElementById('biensForm');
    const editForm = document.getElementById('edit-client-form');
    
    // Réinitialiser tous les champs du formulaire des biens
    document.getElementById('nomBien').value = '';
    document.getElementById('nomProprietaire').value = '';  // Réinitialiser Nom Propriétaire
    document.getElementById('adresseBien').value = '';  // Réinitialiser Adresse bien
    document.getElementById('nbrEtage').value = '';
    document.getElementById('surfaceMaison').value = '';
    document.getElementById('nbrChambres').value = '';
    document.getElementById('nbrSalleBain').value = '';
    document.getElementById('nbrSalleEau').value = '';
    document.getElementById('nbrSalon').value = '';
    document.getElementById('codeAlarme').value = '';
    document.getElementById('surfaceJardin').value = '';
    document.querySelector('input[name="cloture"][value="non"]').checked = true; // Décocher Clôture par défaut
    document.getElementById('codePortail').value = '';
    document.getElementById('piscineType').value = 'creusee';
    document.getElementById('piscineLongueur').value = '';
    document.getElementById('piscineLargeur').value = '';
    document.querySelector('input[name="jacuzzi"][value="non"]').checked = true; // Décocher Jacuzzi par défaut
    document.getElementById('surfaceTerrasse').value = '';
    
    // Saisonnier/Annuel (checkbox)
    document.getElementById('saisonnier').checked = false;
    document.getElementById('annuel').checked = false;

    // Cheminée, Climatisation, Radiateur (checkbox)
    document.getElementById('cheminee').checked = false;
    document.getElementById('climatisation').checked = false;
    document.getElementById('radiateur').checked = false;
    document.getElementById('fioul').checked = false;

    // Afficher le formulaire des biens et masquer le formulaire client
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

    function searchClient() {
        const searchTerm = document.getElementById('search-bar').value;
        fetch(`/search?term=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                const clientList = document.getElementById('client-list');
                clientList.innerHTML = '';  // Vider la liste des clients actuels
    
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

    loadClients();  // Charger la liste des clients lors de l'initialisation de la page
}