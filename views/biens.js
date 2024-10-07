function loadAllBiens() {
    fetch('/get-all-biens')
        .then(response => response.json())
        .then(biens => {
            console.log(biens);  // Ajoutez ceci pour vérifier que vous recevez bien les biens
            const biensList = document.getElementById('biens-list');
            biensList.innerHTML = '';

            if (biens.length === 0) {
                biensList.innerHTML = '<p>Aucun bien trouvé.</p>';
            } else {
                biens.forEach(bien => {
                    const bienItem = document.createElement('div');
                    bienItem.className = 'bien-item';
                    bienItem.innerHTML = `
                        <strong>${bien.nom_bien}</strong><br>
                        Adresse: ${bien.adresse}<br>
                        Surface Maison: ${bien.surface_maison} m²<br>
                        Chambres: ${bien.nbr_chambres}
                    `;
                    biensList.appendChild(bienItem);
                });
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des biens:', error);
            const biensList = document.getElementById('biens-list');
            biensList.innerHTML = '<p>Erreur lors du chargement des biens.</p>';
        });
}