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
        const formData = new FormData();
        
        // Ajout des données texte dans formData
        formData.append('nom_bien', document.getElementById('nom_bien').value);
        formData.append('nom_proprietaire', document.getElementById('nom_proprietaire').value);
        formData.append('adresse', document.getElementById('adresse').value);
        formData.append('surface_maison', document.getElementById('surface_maison').value);
        formData.append('nbr_etage', document.getElementById('nbr_etage').value);
        formData.append('nbr_salle_eau', document.getElementById('nbr_salle_eau').value);
        formData.append('nbr_chambres', document.getElementById('nbr_chambres').value);
        formData.append('nbr_salle_bain', document.getElementById('nbr_salle_bain').value);
        formData.append('nbr_salon', document.getElementById('nbr_salon').value);
        formData.append('code_alarme', document.getElementById('code_alarme').value);
        formData.append('cheminee', document.getElementById('cheminee').checked);
        formData.append('chauffage_sol', document.getElementById('chauffageSol').checked);
        formData.append('poele', document.getElementById('poele').checked);
        formData.append('radiateur', document.getElementById('radiateur').checked);
        formData.append('fioul', document.getElementById('fioul').checked);
        formData.append('climatisation', document.getElementById('climatisation').checked);
        formData.append('surface_jardin', document.getElementById('surface_jardin').value);
        formData.append('cloture', document.querySelector('input[name="cloture"]:checked').value === 'oui');
        formData.append('code_portail', document.getElementById('code_portail').value);
        formData.append('piscine_type', document.getElementById('piscine_type').value);
        formData.append('piscine_longueur', document.getElementById('piscine_longueur').value);
        formData.append('piscine_largeur', document.getElementById('piscine_largeur').value);
        formData.append('jacuzzi', document.querySelector('input[name="jacuzzi"]:checked').value === 'oui');
        formData.append('surface_terrasse', document.getElementById('surface_terrasse').value);
        formData.append('wifi', document.getElementById('wifi').checked);
        formData.append('ssid', document.getElementById('ssid').value);
        formData.append('wifiPassword', document.getElementById('wifiPassword').value);
        formData.append('cheminee_granule', document.getElementById('chemineeGranule').checked);
        formData.append('cheminee_bois', document.getElementById('chemineeBois').checked);
        formData.append('poolhouse', document.getElementById('poolhouse').checked);
        formData.append('surface_poolhouse', document.getElementById('surface_poolhouse').value || null);
    
        // Ajout du fichier photo à formData
        const photoBien = document.getElementById('photoBien').files[0];
        if (photoBien) {
            formData.append('photoBien', photoBien);
        }
    
        const method = currentBienId ? 'PUT' : 'POST';
        const url = currentBienId ? `/update-bien/${currentBienId}` : '/create-bien';
    
        fetch(url, {
            method,
            body: formData // Envoi des données avec le fichier
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