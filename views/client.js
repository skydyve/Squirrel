function initializeClientPage() {
    let currentClientId = null;  // Stocker l'ID du client en cours de modification
    let currentBienId = null;    // Stocker l'ID du bien en cours de modification

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
                document.getElementById('nbrEtage').value = bien.nbr_etage || '';
                document.getElementById('surfaceMaison').value = bien.surface_maison || '';
                document.getElementById('nbrChambres').value = bien.nbr_chambres || '';
                document.getElementById('nbrSalleBain').value = bien.nbr_salle_de_bain || '';
                document.getElementById('nbrSalleEau').value = bien.nbr_salle_eau || '';
                document.getElementById('nbrSalon').value = bien.nbr_salon || '';
                document.getElementById('codeAlarme').value = bien.code_alarme || '';
                document.getElementById('surfaceJardin').value = bien.surface_jardin || '';
                document.getElementById('cloture').value = bien.cloture ? 'oui' : 'non';
                document.getElementById('codePortail').value = bien.code_portail || '';
                document.getElementById('piscineType').value = bien.piscine_type || 'creusee';
                document.getElementById('piscineLongueur').value = bien.piscine_longueur || '';
                document.getElementById('piscineLargeur').value = bien.piscine_largeur || '';
                document.getElementById('jacuzzi').value = bien.jacuzzi ? 'oui' : 'non';
                document.getElementById('surfaceTerrasse').value = bien.surface_terrasse || '';

                // Afficher le formulaire des biens
                document.getElementById('biensForm').style.display = 'block';
            })
            .catch(error => console.error('Erreur lors du chargement des détails du bien:', error));
    }

    // Soumission du formulaire des biens pour mise à jour ou création
    document.getElementById('saveBiensBtn').addEventListener('click', async function () {
        const data = {
            client_id: currentClientId,
            nom_bien: document.getElementById('nomBien').value,  // Champ "Nom du bien"
            nbr_etage: document.getElementById('nbrEtage').value,
            surface_maison: document.getElementById('surfaceMaison').value,
            nbr_chambres: document.getElementById('nbrChambres').value,
            nbr_salle_de_bain: document.getElementById('nbrSalleBain').value,
            nbr_salle_eau: document.getElementById('nbrSalleEau').value,
            nbr_salon: document.getElementById('nbrSalon').value,
            code_alarme: document.getElementById('codeAlarme').value,
            surface_jardin: document.getElementById('surfaceJardin').value,
            cloture: document.getElementById('cloture').value === 'oui',
            code_portail: document.getElementById('codePortail').value,
            piscine_type: document.getElementById('piscineType').value,
            piscine_longueur: document.getElementById('piscineLongueur').value,
            piscine_largeur: document.getElementById('piscineLargeur').value,
            jacuzzi: document.getElementById('jacuzzi').value === 'oui',
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

    loadClients();  // Charger la liste des clients lors de l'initialisation de la page
}