// Charger les événements du jour
async function loadTodaysEvents() {
    try {
        const response = await fetch('/get-appointments');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des événements');
        }
        const events = await response.json();

        // Filtrer les événements du jour
        const today = new Date();
        const todaysEvents = events.filter(event => {
            const eventDate = new Date(event.start);
            return (
                eventDate.getDate() === today.getDate() &&
                eventDate.getMonth() === today.getMonth() &&
                eventDate.getFullYear() === today.getFullYear()
            );
        });

        // Afficher les événements
        displayTodaysEvents(todaysEvents);
    } catch (error) {
        console.error(error);
    }
}

// Afficher les événements du jour dans le conteneur
function displayTodaysEvents(events) {
    const eventsContainer = document.getElementById('today-events');
    eventsContainer.innerHTML = '';  // Vider l'élément

    if (events.length === 0) {
        eventsContainer.innerHTML = '<p>Aucun événement pour aujourd\'hui.</p>';
    } else {
        events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event-item');
            eventDiv.innerHTML = `
                <h3>${event.title}</h3>
                <p>${new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            `;

            // Rendre l'événement cliquable pour le modifier
            eventDiv.addEventListener('click', () => {
                openEventPopup(event);
            });

            eventsContainer.appendChild(eventDiv);
        });
    }
}

// Fonction pour ouvrir le popup de modification d'événement
function openEventPopup(event, cell) {
    currentEvent = event;
    eventPopup.style.display = 'block';

    if (event.id) {
        // Remplir le formulaire avec les détails de l'événement
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title || '';

        let time = '';
        if (typeof event.start === 'string' && event.start.includes('T')) {
            time = event.start.split('T')[1].slice(0, 5);  // Extraire l'heure (format HH:MM)
        } else if (event.start instanceof Date) {
            time = event.start.toTimeString().slice(0, 5);
        }
        document.getElementById('eventTime').value = time;

        // Afficher la durée
        document.getElementById('eventDuration').value = event.duration || '';  // Récupérer et afficher la durée

        document.getElementById('eventDescription').value = event.description || '';

        // Définir selectedDate sur la date de début de l'événement lors de la modification
        selectedDate = new Date(event.start);

        // S'assurer que la catégorie est correctement définie
        document.getElementById('eventCategory').value = event.category || 'rendez-vous';

        deleteEventBtn.style.display = 'inline';  // Afficher le bouton supprimer si l'événement existe
    } else {
        // Cas d'un nouvel événement
        document.getElementById('eventId').value = '';
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventTime').value = '';
        document.getElementById('eventDuration').value = '';  // Vider le champ de durée pour un nouvel événement
        document.getElementById('eventDescription').value = '';
        document.getElementById('eventCategory').value = 'rendez-vous';  // Réinitialiser la catégorie à "rendez-vous"
        selectedDate = selectedDate || new Date();  // Utiliser la date du jour si selectedDate n'est pas définie
        deleteEventBtn.style.display = 'none';  // Cacher le bouton supprimer pour un nouvel événement
    }
}

// Fermer le popup quand la croix est cliquée
const closePopupCross = document.getElementById('closePopupCross');
closePopupCross.addEventListener('click', () => {
    eventPopup.style.display = 'none';
    currentEvent = null;
    selectedDate = null;
});

// Charger les événements du jour au chargement de la page
document.addEventListener('DOMContentLoaded', loadTodaysEvents);