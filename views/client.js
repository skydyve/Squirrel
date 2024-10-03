function initializeClientPage() {
    let currentClientId = null;  // Stocker l'ID du client en cours de modification

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
                            loadClientDetails(client.id);  // Masquer la liste et afficher le formulaire de modification
                        });
                        clientList.appendChild(button);
                    });
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des clients:', error);
            });
    }

    // Fonction pour charger les détails d'un client dans le formulaire de modification
    function loadClientDetails(clientId) {
        currentClientId = clientId;  // Stocker l'ID du client en cours
        fetch(`/get-client/${clientId}`)
            .then(response => response.json())
            .then(client => {
                const editForm = document.getElementById('edit-client-form');
                const clientList = document.getElementById('client-list');
                const createForm = document.getElementById('create-client-form');
    
                // Vérification si les éléments existent avant d'essayer de modifier leurs styles
                if (clientList) {
                    clientList.style.display = 'none';
                } else {
                    console.error("L'élément client-list est introuvable.");
                }
    
                if (createForm) {
                    createForm.style.display = 'none';
                } else {
                    console.error("L'élément create-client-form est introuvable.");
                }
    
                if (editForm) {
                    // Pré-remplissage des champs du formulaire de modification
                    document.getElementById('edit-civilite').value = client.civilite || '';
                    document.getElementById('edit-nom').value = client.nom || '';
                    document.getElementById('edit-prenom').value = client.prenom || '';
                    document.getElementById('edit-adresse_principale').value = client.adresse_principale || '';
                    document.getElementById('edit-code_postal').value = client.code_postal || '';
                    document.getElementById('edit-pays').value = client.pays || '';
                    document.getElementById('edit-tel_fixe').value = client.tel_fixe || '';
                    document.getElementById('edit-tel_portable').value = client.tel_portable || '';
                    document.getElementById('edit-email').value = client.email || '';
    
                    // Affichage du formulaire de modification uniquement si l'élément existe
                    editForm.style.display = 'block';
                } else {
                    console.error("L'élément edit-client-form est introuvable.");
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des détails du client:', error);
            });
    }

    // Vérifier que l'élément existe avant d'ajouter un événement
    const createClientBtn = document.getElementById('create-client-btn');
    if (createClientBtn) {
        createClientBtn.addEventListener('click', function () {
            const clientList = document.getElementById('client-list');
            const createForm = document.getElementById('create-client-form');
            const editForm = document.getElementById('edit-client-form');

            // Masquer la liste des clients et le formulaire de modification, afficher le formulaire de création
            if (clientList) {
                clientList.style.display = 'none';
            } else {
                console.error("L'élément client-list est introuvable.");
            }

            if (editForm) {
                editForm.style.display = 'none';
            } else {
                console.error("L'élément edit-client-form est introuvable.");
            }

            if (createForm) {
                createForm.style.display = 'block';
            } else {
                console.error("L'élément create-client-form est introuvable.");
            }
        });
    }

    // Soumission du formulaire de création
    const submitClientBtn = document.getElementById('submit-client-btn');
    if (submitClientBtn) {
        submitClientBtn.addEventListener('click', function (event) {
            event.preventDefault();

            const civilite = document.getElementById('civilite').value;
            const nom = document.getElementById('nom').value;
            const prenom = document.getElementById('prenom').value;
            const adresse_principale = document.getElementById('adresse_principale').value;
            const code_postal = document.getElementById('code_postal').value;
            const pays = document.getElementById('pays').value;
            const tel_fixe = document.getElementById('tel_fixe').value;
            const tel_portable = document.getElementById('tel_portable').value;
            const email = document.getElementById('email').value;

            fetch('/create-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    civilite, nom, prenom, adresse_principale, code_postal, pays, tel_fixe, tel_portable, email
                })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                const createForm = document.getElementById('create-client-form');
                if (createForm) {
                    createForm.style.display = 'none';
                }
                loadClients(); // Recharger la liste après création
                const clientList = document.getElementById('client-list');
                if (clientList) {
                    clientList.style.display = 'block';  // Réafficher la liste des clients
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
            });
        });
    }

    // Soumission du formulaire de modification
    const updateClientBtn = document.getElementById('update-client-btn');
    if (updateClientBtn) {
        updateClientBtn.addEventListener('click', function (event) {
            event.preventDefault();

            const civilite = document.getElementById('edit-civilite').value;
            const nom = document.getElementById('edit-nom').value;
            const prenom = document.getElementById('edit-prenom').value;
            const adresse_principale = document.getElementById('edit-adresse_principale').value;
            const code_postal = document.getElementById('edit-code_postal').value;
            const pays = document.getElementById('edit-pays').value;
            const tel_fixe = document.getElementById('edit-tel_fixe').value;
            const tel_portable = document.getElementById('edit-tel_portable').value;
            const email = document.getElementById('edit-email').value;

            // Mettre à jour les informations du client
            fetch(`/update-client/${currentClientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    civilite, nom, prenom, adresse_principale, code_postal, pays, tel_fixe, tel_portable, email
                })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                const editForm = document.getElementById('edit-client-form');
                if (editForm) {
                    editForm.style.display = 'none';
                }
                loadClients(); // Recharger la liste après modification
                const clientList = document.getElementById('client-list');
                if (clientList) {
                    clientList.style.display = 'block';  // Réafficher la liste des clients
                }
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour:', error);
            });
        });
    }

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

    // Événement pour le bouton "Retour" sur la page de création
    const backButton = document.getElementById('create-back-btn');
    if (backButton) {
        backButton.addEventListener('click', function () {
            const clientList = document.getElementById('client-list');
            const createForm = document.getElementById('create-client-form');
            const editForm = document.getElementById('edit-client-form');

            // Masquer le formulaire de création et afficher la liste des clients
            if (createForm) {
                createForm.style.display = 'none';
            }
            if (editForm) {
                editForm.style.display = 'none';
            }
            if (clientList) {
                clientList.style.display = 'block';
            }
        });
    }

    document.getElementById('openBiensForm').addEventListener('click', function() {
        const biensForm = document.getElementById('biensForm');
        biensForm.style.display = biensForm.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('saveBiensBtn').addEventListener('click', async function() {
        const clientId = currentClientId;  // Utiliser l'ID du client en cours
        const data = {
            client_id: clientId,
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
            const response = await fetch('/create-bien', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Bien enregistré avec succès');
            } else {
                alert('Erreur lors de l\'enregistrement du bien');
            }
        } catch (error) {
            console.error('Erreur :', error);
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
                    loadClients(); // Recharger la liste après suppression
                    const clientList = document.getElementById('client-list');
                    if (clientList) {
                        clientList.style.display = 'block';  // Réafficher la liste des clients
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la suppression du client:', error);
                });
            }
        });
    }

    loadClients(); // Charger la liste des clients lors de l'initialisation de la page
}