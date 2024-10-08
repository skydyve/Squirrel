function initializeBiensPage() {
    let currentBienId = null;

    const createBienBtn = document.getElementById('create-bien-btn');
    const createBienForm = document.getElementById('create-bien-form');
    const bienList = document.getElementById('bien-list');
    const searchBar = document.getElementById('search-bar-biens');

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
    document.getElementById('wifi').addEventListener('change', function() {
        const wifiDetails = document.getElementById('wifi-details');
        if (this.checked) {
            wifiDetails.style.display = 'table-row';
        } else {
            wifiDetails.style.display = 'none';
            document.getElementById('ssid').value = ''; 
            document.getElementById('wifiPassword').value = ''; 
        }
    });
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
            wifiPassword: document.getElementById('wifiPassword').value
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
                document.getElementById('radiateur').checked = bien.radiateur || false;
                document.getElementById('fioul').checked = bien.fioul || false;
                document.getElementById('climatisation').checked = bien.climatisation || false;
                
                // Gérer les boutons radio
                document.querySelector(`input[name="cloture"][value="${bien.cloture ? 'oui' : 'non'}"]`).checked = true;
                document.querySelector(`input[name="jacuzzi"][value="${bien.jacuzzi ? 'oui' : 'non'}"]`).checked = true;

                // Gérer les sélecteurs
                document.getElementById('piscine_type').value = bien.piscine_type || 'creusee';
                document.getElementById('piscine_longueur').value = bien.piscine_longueur || '';
                document.getElementById('piscine_largeur').value = bien.piscine_largeur || '';

                // Afficher le formulaire pour modifier le bien
                createBienForm.style.display = 'block';
                bienList.style.display = 'none';
                document.getElementById('wifi').checked = bien.wifi || false;
            document.getElementById('ssid').value = bien.ssid || '';
            document.getElementById('wifiPassword').value = bien.wifiPassword || '';
            
            // Show or hide Wi-Fi details based on the checkbox
            document.getElementById('wifi-details').style.display = bien.wifi ? 'table-row' : 'none';
            
            // Show form
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
    }

    loadBiens();  // Charger la liste des biens à l'initialisation de la page
}