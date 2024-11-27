function initializeInterventionsPage() {
    // Fonction pour ouvrir ou fermer le popup d'intervention
function toggleInterventionPopup() {
    const popup = document.getElementById('intervention-popup');
    if (popup) {
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        if (popup.style.display === 'block') {
            // Si le popup est ouvert, vous pouvez effectuer des actions supplémentaires ici
            console.log("Popup d'intervention ouvert");
        }
    } else {
        console.error("Le popup d'intervention est introuvable");
    }
}

// Gestion de l'ouverture du popup via le bouton
document.getElementById('open-form-btn').addEventListener('click', toggleInterventionPopup);

// Gestion de la fermeture du popup via le bouton de fermeture
document.getElementById('close-popup').addEventListener('click', toggleInterventionPopup);

    
    const clientSelect = document.getElementById('client-select');
    const bienSelect = document.getElementById('bien-select');
    const interventionsTable = document.getElementById('interventions-table');
    const form = document.getElementById('intervention-form');

    // Charger les clients dans le select
    function loadClients() {
        fetch('/get-clients')
            .then(res => res.json())
            .then(clients => {
                clientSelect.innerHTML = '<option value="">Sélectionner un client</option>';
                clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = `${client.nom} ${client.prenom}`;
                    clientSelect.appendChild(option);
                });
            });
    }

    // Charger les biens pour un client
    clientSelect.addEventListener('change', () => {
        const clientId = clientSelect.value;
        if (!clientId) {
            bienSelect.innerHTML = '<option value="">Sélectionner un bien</option>';
            return;
        }

        fetch(`/get-biens-by-client/${clientId}`)
            .then(res => res.json())
            .then(biens => {
                bienSelect.innerHTML = '<option value="">Sélectionner un bien</option>';
                biens.forEach(bien => {
                    const option = document.createElement('option');
                    option.value = bien.id;
                    option.textContent = bien.nom_bien;
                    bienSelect.appendChild(option);
                });
            });
    });

    // Charger les interventions
function loadInterventions() {
    fetch('/get-interventions')
        .then(res => res.json())
        .then(interventions => {
            interventionsTable.innerHTML = ''; // Vider la table avant de la recharger
            interventions.forEach(intervention => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${intervention.client_nom} ${intervention.client_prenom}</td>
                    <td>${intervention.bien_nom}</td>
                    <td>${intervention.duree}</td>
                    <td>${intervention.heure_debut}</td>
                    <td>${intervention.intervenant}</td>
                    <td>${intervention.details || ''}</td>
                    <td>
                        <button onclick="deleteIntervention(${intervention.id})">Supprimer</button>
                    </td>
                `;
                interventionsTable.appendChild(row);
            });
        })
        .catch(err => {
            console.error('Erreur lors du chargement des interventions :', err);
        });
}

    // Ajouter une intervention
    form.addEventListener('submit', e => {
        e.preventDefault();
        const intervention = {
            client_id: clientSelect.value,
            bien_id: bienSelect.value,
            duree: document.getElementById('duree').value,
            heure_debut: document.getElementById('heure-debut').value,
            intervenant: document.getElementById('intervenant').value,
            details: document.getElementById('details').value
        };

        fetch('/create-intervention', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(intervention)
        }).then(() => {
            form.reset();
            loadInterventions();
        });
    });

    // Supprimer une intervention
    window.deleteIntervention = (id) => {
        if (confirm('Voulez-vous supprimer cette intervention ?')) {
            fetch(`/delete-intervention/${id}`, { method: 'DELETE' })
                .then(() => loadInterventions());
        }
    };

    loadClients();
    loadInterventions();
}