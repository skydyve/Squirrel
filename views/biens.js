function initializeBiensPage() {
    let currentBienId = null;

    const createBienBtn = document.getElementById('create-bien-btn');
    const createBienForm = document.getElementById('create-bien-form');
    const bienList = document.getElementById('bien-list');
    const searchBar = document.getElementById('search-bar-biens');
    const deleteBienBtn = document.getElementById('delete-bien-btn');

    // Afficher le formulaire de création lorsque le bouton "Créer un bien" est cliqué
    if (createBienBtn) {
        createBienBtn.addEventListener('click', function () {
            if (bienList) bienList.style.display = 'none';
            if (createBienForm) {
                createBienForm.style.display = 'block';
                resetBienForm(); // Réinitialise les champs du formulaire lors de la création d'un nouveau bien
            }
        });
    }

    // Afficher ou masquer les détails du Wi-Fi en fonction de la case "Wi-Fi"
document.getElementById('wifi').addEventListener('change', function () {
    const wifiDetails = document.getElementById('wifi-details');
    if (this.checked) {
        wifiDetails.style.display = 'table-row';  // Afficher les champs SSID et mot de passe si "Wi-Fi" est cochée
    } else {
        wifiDetails.style.display = 'none';  // Masquer les champs SSID et mot de passe si "Wi-Fi" est décochée
        document.getElementById('ssid').value = '';  // Réinitialiser les valeurs
        document.getElementById('wifiPassword').value = '';  // Réinitialiser les valeurs
    }
});

    // Gestion du bouton retour dans le formulaire de création
    const createBackBtn = document.getElementById('create-back-btn');
    if (createBackBtn) {
        createBackBtn.addEventListener('click', function () {
            if (bienList) bienList.style.display = 'block';
            if (createBienForm) createBienForm.style.display = 'none';
        });
    }

    // Gestion de la soumission du formulaire pour créer ou modifier un bien
    const submitBienBtn = document.getElementById('submit-bien-btn');
    if (submitBienBtn) {
        submitBienBtn.addEventListener('click', function (event) {
            event.preventDefault();
            createOrUpdateBien();
        });
    }

    // Ajouter un écouteur d'événements pour la barre de recherche
    searchBar.addEventListener('input', function () {
        const searchTerm = searchBar.value.toLowerCase();
        filterBiens(searchTerm);
    });

    function filterBiens(searchTerm) {
        const biens = document.querySelectorAll('.bien-btn');
        biens.forEach(bien => {
            const bienName = bien.textContent.toLowerCase();
            if (bienName.includes(searchTerm)) {
                bien.style.display = '';
            } else {
                bien.style.display = 'none';
            }
        });
    }

    

    // Afficher ou masquer les types de cheminée en fonction de la case "Cheminée"
    document.getElementById('cheminee').addEventListener('change', function () {
        const chemineeOptions = document.getElementById('chemineeOptions');
        if (this.checked) {
            chemineeOptions.style.display = 'table-row';
        } else {
            chemineeOptions.style.display = 'none';
            document.getElementById('chemineeGranule').checked = false;
            document.getElementById('chemineeBois').checked = false;
        }
    });

    // Afficher ou masquer les détails du poolhouse en fonction de la case "Poolhouse"
    document.getElementById('poolhouse').addEventListener('change', function () {
        const poolhouseDetails = document.getElementById('poolhouseDetails');
        if (this.checked) {
            poolhouseDetails.style.display = 'table-row';
        } else {
            poolhouseDetails.style.display = 'none';
            document.getElementById('surface_poolhouse').value = '';
        }
    });

    // Fonction pour charger la liste des biens
    function loadBiens() {
        fetch('/get-all-biens')
            .then(response => response.json())
            .then(data => {
                if (!bienList) {
                    console.error("L'élément bien-list est introuvable.");
                    return;
                }
                bienList.innerHTML = '';

                if (data.length === 0) {
                    bienList.innerHTML = '<p>Aucun bien trouvé.</p>';
                } else {
                    data.forEach(bien => {
                        const button = document.createElement('button');
                        button.textContent = `${bien.nom_bien} - ${bien.surface_maison} m²`;
                        button.className = 'bien-btn';
                        button.addEventListener('click', function () {
                            loadBienDetails(bien.id);  // Charger les détails du bien pour modification
                        });
                        bienList.appendChild(button);
                    });
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des biens:', error);
            });
    }
    // Ajouter un écouteur sur le bouton de suppression de bien
    if (deleteBienBtn) {
        deleteBienBtn.addEventListener('click', function () {
            if (currentBienId) {
                deleteBien(currentBienId);
            } else {
                alert("Veuillez sélectionner un bien avant de le supprimer.");
            }
        });
    }
    // Fonction pour supprimer un bien
    function deleteBien(bienId) {
        // Vérifier avec une simple boîte de dialogue de confirmation
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bien ?')) {
            fetch(`/delete-bien/${bienId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    alert('Bien supprimé avec succès');
                    loadBiens();  // Recharger la liste des biens après suppression
    
                    // Simuler un clic sur le bouton retour : cacher le formulaire et afficher la liste des biens
                    document.getElementById('create-bien-form').style.display = 'none';  // Cacher le formulaire
                    document.getElementById('bien-list').style.display = 'block';  // Afficher la liste des biens
                } else {
                    alert('Erreur lors de la suppression du bien');
                }
            })
            .catch(error => {
                console.error('Erreur lors de la suppression du bien:', error);
            });
        }
    }

    // Fonction pour créer ou mettre à jour un bien
    function createOrUpdateBien() {
        const bienData = {
            nom_bien: document.getElementById('nom_bien').value,
            nom_proprietaire: document.getElementById('nom_proprietaire').value,
            adresse: document.getElementById('adresse').value,
            surface_maison: document.getElementById('surface_maison').value,
            nbr_etage: document.getElementById('nbr_etage').value,
            nbr_salle_eau: document.getElementById('nbr_salle_eau').value,
            nbr_chambres: document.getElementById('nbr_chambres').value,
            nbr_salle_bain: document.getElementById('nbr_salle_bain').value,
            nbr_salon: document.getElementById('nbr_salon').value,
            code_alarme: document.getElementById('code_alarme').value,
            cheminee: document.getElementById('cheminee').checked,
            chauffage_sol: document.getElementById('chauffageSol').checked,
            poele: document.getElementById('poele').checked,
            radiateur: document.getElementById('radiateur').checked,
            fioul: document.getElementById('fioul').checked,
            climatisation: document.getElementById('climatisation').checked,
            surface_jardin: document.getElementById('surface_jardin').value,
            cloture: document.querySelector('input[name="cloture"]:checked').value === 'oui',
            code_portail: document.getElementById('code_portail').value,
            piscine_type: document.getElementById('piscine_type').value,
            piscine_longueur: document.getElementById('piscine_longueur').value,
            piscine_largeur: document.getElementById('piscine_largeur').value,
            jacuzzi: document.querySelector('input[name="jacuzzi"]:checked').value === 'oui',
            surface_terrasse: document.getElementById('surface_terrasse').value,
            wifi: document.getElementById('wifi').checked,
            ssid: document.getElementById('ssid').value,
            wifiPassword: document.getElementById('wifiPassword').value,
            cheminee_granule: document.getElementById('chemineeGranule').checked,
            cheminee_bois: document.getElementById('chemineeBois').checked,
            poolhouse: document.getElementById('poolhouse').checked,  // Ajouté
            surface_poolhouse: document.getElementById('surface_poolhouse').value || null  // Ajouté
        };

        const method = currentBienId ? 'PUT' : 'POST';
        const url = currentBienId ? `/update-bien/${currentBienId}` : '/create-bien';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bienData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Bien enregistré avec succès');
            loadBiens();  // Recharger la liste des biens
            document.getElementById('create-bien-form').reset();
            document.getElementById('create-bien-form').style.display = 'none';
            bienList.style.display = 'block';
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
    }

    // Fonction pour charger les détails d'un bien pour modification
    function loadBienDetails(bienId) {
        currentBienId = bienId;
        fetch(`/get-bien/${bienId}`)
            .then(response => response.json())
            .then(bien => {
                // Remplissage des champs de texte et numériques
                document.getElementById('nom_bien').value = bien.nom_bien || '';
                document.getElementById('nom_proprietaire').value = bien.nom_proprietaire || '';
                document.getElementById('adresse').value = bien.adresse || '';
                document.getElementById('surface_maison').value = bien.surface_maison || '';
                document.getElementById('nbr_etage').value = bien.nbr_etage || '';
                document.getElementById('nbr_salle_eau').value = bien.nbr_salle_eau || '';
                document.getElementById('nbr_chambres').value = bien.nbr_chambres || '';
                document.getElementById('nbr_salle_bain').value = bien.nbr_salle_bain || '';
                document.getElementById('nbr_salon').value = bien.nbr_salon || '';
                document.getElementById('code_alarme').value = bien.code_alarme || '';
                document.getElementById('surface_jardin').value = bien.surface_jardin || '';
                document.getElementById('surface_terrasse').value = bien.surface_terrasse || '';
                document.getElementById('code_portail').value = bien.code_portail || '';

                // Gérer les cases à cocher
                document.getElementById('saisonnier').checked = bien.saisonnier || false;
                document.getElementById('annuel').checked = bien.annuel || false;
                document.getElementById('cheminee').checked = bien.cheminee || false;
                document.getElementById('chauffageSol').checked = bien.chauffage_sol || false;
                document.getElementById('poele').checked = bien.poele || false;
                document.getElementById('radiateur').checked = bien.radiateur || false;
                document.getElementById('fioul').checked = bien.fioul || false;
                document.getElementById('climatisation').checked = bien.climatisation || false;

                // Afficher les types de cheminée si "Cheminée" est cochée
                const chemineeOptions = document.getElementById('chemineeOptions');
                if (bien.cheminee) {
                    chemineeOptions.style.display = 'table-row';
                } else {
                    chemineeOptions.style.display = 'none';
                }

                // Gérer les types de cheminée
                document.getElementById('chemineeGranule').checked = bien.cheminee_granule || false;
                document.getElementById('chemineeBois').checked = bien.cheminee_bois || false;

                // Gérer les boutons radio
                document.querySelector(`input[name="cloture"][value="${bien.cloture ? 'oui' : 'non'}"]`).checked = true;
                document.querySelector(`input[name="jacuzzi"][value="${bien.jacuzzi ? 'oui' : 'non'}"]`).checked = true;

                // Gérer les sélecteurs
                document.getElementById('piscine_type').value = bien.piscine_type || 'creusee';
                document.getElementById('piscine_longueur').value = bien.piscine_longueur || '';
                document.getElementById('piscine_largeur').value = bien.piscine_largeur || '';

                // Gérer les détails Wi-Fi
                document.getElementById('wifi').checked = bien.wifi || false;
                document.getElementById('ssid').value = bien.ssid || '';
                document.getElementById('wifiPassword').value = bien.wifiPassword || '';
                document.getElementById('wifi-details').style.display = bien.wifi ? 'table-row' : 'none';

                // Gérer les champs du poolhouse
                document.getElementById('poolhouse').checked = bien.poolhouse || false;
                document.getElementById('surface_poolhouse').value = bien.surface_poolhouse || '';
                document.getElementById('poolhouseDetails').style.display = bien.poolhouse ? 'table-row' : 'none';

                // Afficher le formulaire pour modification
                createBienForm.style.display = 'block';
                bienList.style.display = 'none';
            })
            .catch(error => {
                console.error('Erreur lors du chargement des détails du bien:', error);
            });
    }

    // Fonction pour réinitialiser les champs du formulaire de bien
    function resetBienForm() {
        document.getElementById('nom_bien').value = '';
        document.getElementById('nom_proprietaire').value = '';
        document.getElementById('adresse').value = '';
        document.getElementById('surface_maison').value = '';
        document.getElementById('nbr_etage').value = '';
        document.getElementById('nbr_salle_eau').value = '';
        document.getElementById('nbr_chambres').value = '';
        document.getElementById('nbr_salle_bain').value = '';
        document.getElementById('nbr_salon').value = '';
        document.getElementById('code_alarme').value = '';
        document.getElementById('cheminee').checked = false;
        document.getElementById('chauffageSol').checked = false;
        document.getElementById('poele').checked = false;
        document.getElementById('radiateur').checked = false;
        document.getElementById('fioul').checked = false;
        document.getElementById('climatisation').checked = false;
        document.getElementById('surface_jardin').value = '';
        document.querySelector('input[name="cloture"][value="non"]').checked = true;
        document.getElementById('code_portail').value = '';
        document.getElementById('piscine_type').value = 'creusee';
        document.getElementById('piscine_longueur').value = '';
        document.getElementById('piscine_largeur').value = '';
        document.querySelector('input[name="jacuzzi"][value="non"]').checked = true;
        document.getElementById('surface_terrasse').value = '';
        document.getElementById('chemineeOptions').style.display = 'none';  // Masquer les options de cheminée au reset
        document.getElementById('poolhouse').checked = false;
        document.getElementById('surface_poolhouse').value = '';
        document.getElementById('poolhouseDetails').style.display = 'none';
    }

    loadBiens();  // Charger la liste des biens à l'initialisation de la page
}