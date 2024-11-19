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
                        // Création du bouton principal
                        const button = document.createElement('button');
                        button.className = 'bien-btn';
                        button.style.display = 'flex';
                        button.style.alignItems = 'center';
                        button.style.padding = '10px';
    
                        // Conteneur pour le texte du bien
                        const buttonText = document.createElement('span');
                        buttonText.className = 'bien-text';
                        buttonText.textContent = `${bien.nom_bien} - ${bien.surface_maison} m²`;
    
                        // Conteneur pour l'image du bien
                        const bienImage = document.createElement('img');
                        bienImage.className = 'bien-image';
                        bienImage.src = bien.photo_url && bien.photo_url.trim() !== '' ? 
                            (bien.photo_url.startsWith('/uploads/') ? bien.photo_url : `/uploads/${bien.photo_url}`) : 
                            '/uploads/image.png';  // Image par défaut
                        bienImage.alt = `Photo du bien ${bien.nom_bien}`;
    
                        // Ajout des éléments au bouton
                        button.appendChild(buttonText); // Ajouter le texte
                        button.appendChild(bienImage);  // Ajouter l'image
    
                        button.addEventListener('click', function () {
                            loadBienDetails(bien.id);
                        });
    
                        // Ajouter le bouton au conteneur de la liste des biens
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
    async function createOrUpdateBien() {
        const nomBienElem = document.getElementById('nom_bien');
        const nomProprietaireElem = document.getElementById('nom_proprietaire');
        const adresseBienElem = document.getElementById('adresse');
        const surfaceMaisonElem = document.getElementById('surface_maison');
        const photoInput = document.getElementById('photoBien');
        const photoPreview = document.getElementById('photoPreview');
        const currentPhotoUrlElem = document.getElementById('currentPhotoUrl');
        const currentPhotoUrl = currentPhotoUrlElem ? currentPhotoUrlElem.value : '';
        
    
        const formData = new FormData();
    
        // Ajout des informations principales
        formData.append('nom_bien', nomBienElem ? nomBienElem.value : '');
        formData.append('nom_proprietaire', nomProprietaireElem ? nomProprietaireElem.value : '');
        formData.append('saisonnier', document.getElementById('saisonnier')?.checked ? 'true' : 'false');
        formData.append('annuel', document.getElementById('annuel')?.checked ? 'true' : 'false');
        formData.append('adresse', adresseBienElem ? adresseBienElem.value : '');
        formData.append('nbr_etage', document.getElementById('nbr_etage')?.value || '');
        formData.append('surface_maison', surfaceMaisonElem ? surfaceMaisonElem.value : '');
        formData.append('nbr_chambres', document.getElementById('nbr_chambres')?.value || '');
        formData.append('nbr_salle_de_bain', document.getElementById('nbr_salle_bain')?.value || '');
        formData.append('nbr_salle_eau', document.getElementById('nbr_salle_eau')?.value || '');
        formData.append('nbr_salon', document.getElementById('nbr_salon')?.value || '');
        formData.append('code_alarme', document.getElementById('code_alarme')?.value || '');
        formData.append('code_portail', document.getElementById('code_portail').value || '');
        formData.append('nature_sol', document.getElementById('nature_sol')?.value || '');
        formData.append('chauffage_eau', document.getElementById('chauffage_eau')?.value || '');
        formData.append('nature_sol_terrasse', document.getElementById('nature_sol_terrasse')?.value || '');
        formData.append('details', document.getElementById('details')?.value || '');
        formData.append('surface_jardin', document.getElementById('surface_jardin')?.value || '');
        formData.append('cloture', document.querySelector('input[name="cloture"]:checked')?.value || 'non');
        formData.append('piscine_type', document.getElementById('piscine_type')?.value || 'aucune');
        formData.append('piscine_longueur', document.getElementById('piscine_longueur')?.value || '');
        formData.append('piscine_largeur', document.getElementById('piscine_largeur')?.value || '');
        formData.append('wifi', document.getElementById('wifi')?.checked ? 'true' : 'false');
        formData.append('ssid', document.getElementById('ssid')?.value || '');
        formData.append('wifiPassword', document.getElementById('wifiPassword')?.value || '');
    
        // Poolhouse
        formData.append('poolhouse', document.querySelector('input[name="poolhouse"]:checked')?.value || 'non');
        formData.append('surface_poolhouse', document.getElementById('surface_poolhouse')?.value || '');
    
        // Modes de chauffage
        formData.append('chauffage_sol', document.getElementById('chauffageSol')?.checked ? 'true' : 'false');
        formData.append('radiateur', document.getElementById('radiateur')?.checked ? 'true' : 'false');
        formData.append('cheminee', document.getElementById('cheminee')?.checked ? 'true' : 'false');
        formData.append('climatisation', document.getElementById('climatisation')?.checked ? 'true' : 'false');
        formData.append('poele', document.getElementById('poele')?.checked ? 'true' : 'false');
        formData.append('fioul', document.getElementById('fioul')?.checked ? 'true' : 'false');
    
        // Type de cheminée
        formData.append('cheminee_granule', document.getElementById('chemineeGranule')?.checked ? 'true' : 'false');
        formData.append('cheminee_bois', document.getElementById('chemineeBois')?.checked ? 'true' : 'false');
    
        if (photoInput?.files.length > 0) {
            formData.append('photoBien', photoInput.files[0]);
        } else if (currentPhotoUrl) {
            formData.append('photo_url', currentPhotoUrl);
        } else {
            formData.append('photo_url', '/uploads/image.png'); // Image par défaut
        }
    
        // Vérifiez les données avant de les envoyer
        console.log('Données envoyées au serveur :');
        formData.forEach((value, key) => console.log(key, value));
    
        const method = currentBienId ? 'PUT' : 'POST';
        const url = currentBienId ? `/update-bien/${currentBienId}` : '/create-bien';
    
        try {
            const response = await fetch(url, {
                method,
                body: formData,
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert('Bien enregistré avec succès');
                loadBiens();
                resetBienForm();
    
                // Réinitialiser l'image par défaut
                photoPreview.src = '/uploads/image.png';
                photoPreview.style.display = 'block';
    
                createBienForm.style.display = 'none';
                bienList.style.display = 'block';
            } else {
                alert('Erreur lors de l\'enregistrement du bien');
            }
        } catch (error) {
            console.error('Erreur :', error);
        }
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
    console.log("Chargement des détails pour le bien avec ID:", bienId);
    currentBienId = bienId;

    fetch(`/get-bien/${bienId}`)
        .then(response => response.json())
        .then(bien => {
            console.log("Détails du bien récupérés :", bien);

            // Afficher le formulaire de modification
            if (bienList) bienList.style.display = 'none';
            if (createBienForm) createBienForm.style.display = 'block';

            // Champs de texte et numériques
            const fields = {
                'nom_bien': bien.nom_bien,
                'nom_proprietaire': bien.nom_proprietaire,
                'adresse': bien.adresse,
                'surface_maison': bien.surface_maison,
                'nbr_etage': bien.nbr_etage,
                'nbr_salle_eau': bien.nbr_salle_eau,
                'nbr_chambres': bien.nbr_chambres,
                'nbr_salle_bain': bien.nbr_salle_de_bain,
                'nbr_salon': bien.nbr_salon,
                'code_alarme': bien.code_alarme,
                'chauffage_eau': bien.chauffage_eau,
                'nature_sol': bien.nature_sol,
                'nature_sol_terrasse': bien.nature_sol_terrasse,
                'details': bien.details,
                'surface_jardin': bien.surface_jardin,
                'surface_terrasse': bien.surface_terrasse,
                'code_portail': bien.code_portail,
                'piscine_type': bien.piscine_type || 'aucune',
                'piscine_longueur': bien.piscine_longueur,
                'piscine_largeur': bien.piscine_largeur,
                'ssid': bien.ssid,
                'wifiPassword': bien.wifiPassword,
                'surface_poolhouse': bien.surface_poolhouse
            };

            for (const [id, value] of Object.entries(fields)) {
                const element = document.getElementById(id);
                if (element) element.value = value || '';
            }

            // Champs checkbox
            const checkboxes = {
                'saisonnier': bien.saisonnier === 'true',
                'annuel': bien.annuel === 'true',
                'cheminee': bien.cheminee === 'true',
                'radiateur': bien.radiateur === 'true',
                'fioul': bien.fioul === 'true',
                'poele': bien.poele === 'true',
                'chauffageSol': bien.chauffage_sol === 'true',
                'climatisation': bien.climatisation === 'true',
                'chemineeGranule': bien.cheminee_granule === 'true',
                'chemineeBois': bien.cheminee_bois === 'true',
                'wifi': bien.wifi === 'true'
            };

            for (const [id, isChecked] of Object.entries(checkboxes)) {
                const checkbox = document.getElementById(id);
                if (checkbox) checkbox.checked = isChecked;
            }

            // Boutons radio : Clôture
            const clotureOption = document.querySelector(`input[name="cloture"][value="${bien.cloture}"]`);
            if (clotureOption) clotureOption.checked = true;

            // Boutons radio : Poolhouse
            const poolhouseOption = document.querySelector(`input[name="poolhouse"][value="${bien.poolhouse}"]`);
            if (poolhouseOption) poolhouseOption.checked = true;

            // Afficher ou masquer les détails du Poolhouse
            const poolhouseDetails = document.getElementById('poolhouseDetails');
            poolhouseDetails.style.display = bien.poolhouse === 'oui' ? 'table-row' : 'none';

            // Boutons radio : Jacuzzi
            const jacuzziOption = document.querySelector(`input[name="jacuzzi"][value="${bien.jacuzzi}"]`);
            if (jacuzziOption) jacuzziOption.checked = true;
            // Affichage des options de cheminée
            const chemineeOptions = document.getElementById('chemineeOptions');
            if (chemineeOptions) chemineeOptions.style.display = bien.cheminee === 'true' ? 'block' : 'none';

            // Affichage des détails Wi-Fi
            const wifiDetails = document.getElementById('wifi-details');
            if (wifiDetails) wifiDetails.style.display = bien.wifi === 'true' ? 'table-row' : 'none';

            // Affichage de la photo et stockage de son URL
            const photoPreview = document.getElementById('photoPreview');
            const currentPhotoUrl = document.getElementById('currentPhotoUrl');
            if (bien.photo_url) {
                const photoUrl = bien.photo_url.startsWith('/uploads/') ? bien.photo_url : `/uploads/${bien.photo_url}`;
                photoPreview.src = photoUrl;
                photoPreview.style.display = 'block';
                currentPhotoUrl.value = photoUrl; // Stocker l'URL actuelle de la photo
            } else {
                photoPreview.src = '';
                photoPreview.style.display = 'none';
                currentPhotoUrl.value = ''; // Réinitialiser si pas de photo
            }
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
        document.getElementById('code_portail').value = '';
        document.getElementById('nature_sol').value = '';
        document.getElementById('details').value = '';
        document.getElementById('nature_sol_terrasse').value = '';
        document.getElementById('chauffage_eau').value = '';
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
        document.getElementById('surface_terrasse').value = '';
        document.getElementById('chemineeOptions').style.display = 'none';  // Masquer les options de cheminée au reset
        document.querySelector('input[name="cloture"][value="non"]').checked = true;
        document.querySelector('input[name="poolhouse"][value="non"]').checked = true;
        document.getElementById('poolhouseDetails').style.display = 'none';
        document.getElementById('surface_poolhouse').value = '';
        document.querySelector('input[name="jacuzzi"][value="non"]').checked = true;

        
    }
    document.querySelectorAll('input[name="poolhouse"]').forEach(radio => {
        radio.addEventListener('change', function () {
            const poolhouseDetails = document.getElementById('poolhouseDetails');
            if (this.value === 'oui') {
                poolhouseDetails.style.display = 'table-row';
            } else {
                poolhouseDetails.style.display = 'none';
                document.getElementById('surface_poolhouse').value = ''; // Réinitialiser la valeur
            }
        });
    });

    loadBiens();  // Charger la liste des biens à l'initialisation de la page
}