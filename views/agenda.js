(function() {
    // Encapsule tout le code dans une fonction pour éviter la redéclaration de variables globales
    const calendarTable = document.getElementById('calendarBody');
    const monthYearDisplay = document.getElementById('monthYear');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const weekViewBtn = document.getElementById('weekViewBtn');
    const monthViewBtn = document.getElementById('monthViewBtn');

    const eventPopup = document.getElementById('eventPopup');
    const eventForm = document.getElementById('eventForm');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    const closePopupBtn = document.getElementById('closePopupBtn');
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = null;  // selectedDate reste null jusqu'à ce qu'une date soit cliquée
    let currentEvent = null;  // Stocker l'événement en cours de modification ou de création
    let viewMode = 'week';  // Le mode d'affichage par défaut est mois
    const joursSemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const months = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
    const categoryColors = {
        'rendez-vous': 'blue',
        'inspection': 'green',
        'intervention': 'red',
        'repos': 'gray',
        'perso': 'purple'
    };


// Charger les événements depuis la base de données
async function loadEvents() {
    try {
        const response = await fetch('/get-appointments', {
            method: 'GET',
            credentials: 'include'  // Ajoutez cette ligne pour inclure les cookies JWT
        });
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des événements');
        }
        const events = await response.json();
        return events.map(event => ({
            ...event,
            start: new Date(event.start),  // Convertir la date de début en objet Date
            date: event.date
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Fonction pour charger le calendrier
async function loadCalendar() {
    calendarTable.innerHTML = "";  // Vider le calendrier
    const events = await loadEvents();  // Charger les événements depuis la base de données

    // Si la date sélectionnée n'est pas définie et que nous sommes en mode semaine, initialiser à la date actuelle
    if (!selectedDate) {
        selectedDate = new Date();
    }

    if (viewMode === 'month') {
        loadMonthView(currentMonth, currentYear, events);
    } else {
        loadWeekView(selectedDate, events);  // Charger la vue semaine si c'est le mode actif
    }
}

// Fonction pour charger la vue "mois"
function loadMonthView(month, year, events) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();

    // Mise à jour de l'affichage du mois et de l'année
    monthYearDisplay.innerHTML = `${months[month]} ${year}`;

    let date = 1;
    for (let i = 0; i < 6; i++) {  // 6 lignes (max 6 semaines par mois)
        const row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');

            if (i === 0 && j < firstDay) {
                cell.classList.add('grayed');
                cell.appendChild(document.createTextNode(''));
            } else if (date > daysInMonth) {
                cell.classList.add('grayed');
                cell.appendChild(document.createTextNode(''));
            } else {
                const cellDate = new Date(year, month, date);
                cell.appendChild(document.createTextNode(date));

                // Afficher les événements pour ce jour
                const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.getDate() === cellDate.getDate() &&
                        eventDate.getMonth() === cellDate.getMonth() &&
                        eventDate.getFullYear() === cellDate.getFullYear();
                });

                dayEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.classList.add('event');
                    eventElement.textContent = event.title;

                    // Ajouter la couleur de la catégorie
                    const category = event.category || 'rendez-vous';  // Catégorie par défaut "rendez-vous"
                    eventElement.style.backgroundColor = categoryColors[category] || 'blue';

                    eventElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openEventPopup(event, cell);
                    });
                    cell.appendChild(eventElement);
                });

                // Définir la date sélectionnée lorsque l'utilisateur clique sur un jour
                cell.addEventListener('click', () => {
                    selectedDate = cellDate;
                    console.log(`Date sélectionnée : ${selectedDate}`);
                    openEventPopup({ date, month, year }, cell);
                });
                date++;
            }
            row.appendChild(cell);
        }
        calendarTable.appendChild(row);
    }
}

// Fonction pour charger la vue "semaine"
function loadWeekView(date, events) {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();

    // Ajustement pour commencer la semaine le lundi
    const dayOffset = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Dimanche (0) devient le dernier jour
    startOfWeek.setDate(startOfWeek.getDate() - dayOffset);  // Ajuster pour que le début soit lundi

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);  // Calculer la fin de la semaine (Dimanche)

    // Mise à jour de l'affichage de la semaine
    monthYearDisplay.innerHTML = `Semaine du ${startOfWeek.getDate()} ${months[startOfWeek.getMonth()]} au ${endOfWeek.getDate()} ${months[endOfWeek.getMonth()]}`;

    const row = document.createElement('tr');

    for (let i = 0; i < 7; i++) {
        const cell = document.createElement('td');
        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + i);

        // Afficher uniquement la date dans la case (sans le jour de la semaine)
        const dayText = `${currentDay.getDate()}`;
        cell.appendChild(document.createTextNode(dayText));

        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.getDate() === currentDay.getDate() &&
                eventDate.getMonth() === currentDay.getMonth() &&
                eventDate.getFullYear() === currentDay.getFullYear();
        });

        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.classList.add('event');
            eventElement.textContent = event.title;

            // Ajouter la couleur de la catégorie
            const category = event.category || 'rendez-vous';  // Catégorie par défaut "rendez-vous"
            eventElement.style.backgroundColor = categoryColors[category] || 'blue';

            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                openEventPopup(event, cell);
            });
            cell.appendChild(eventElement);
        });

        cell.addEventListener('click', () => {
            selectedDate = currentDay;
            openEventPopup({ date: selectedDate.getDate(), month: selectedDate.getMonth(), year: selectedDate.getFullYear() }, cell);
        });

        row.appendChild(cell);
    }

    calendarTable.appendChild(row);
}

// Fonction pour ouvrir le popup d'événement
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

// Sauvegarder ou modifier un événement
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;
    const duration = document.getElementById('eventDuration').value;  // Récupérer la durée
    const description = document.getElementById('eventDescription').value;
    const category = document.getElementById('eventCategory').value;

    if (!selectedDate) {
        console.error("Date non sélectionnée.");
        return;
    }

    // Construire la chaîne de date ISO pour l'heure de début
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const startDateTime = new Date(`${dateStr}T${time}:00`);

    // Extraire les heures et minutes de la durée
    const [hours, minutes] = duration.split(':').map(Number);

    // Calculer l'heure de fin en ajoutant la durée à l'heure de début
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + hours);
    endDateTime.setMinutes(endDateTime.getMinutes() + minutes);

    const eventData = {
        title,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),  // Inclure l'heure de fin calculée
        description,
        date: dateStr,
        category,
        duration  // Inclure la durée dans les données envoyées
    };

    try {
        let response;
        if (id) {
            // Modification d'un événement existant
            response = await fetch(`/update-appointment/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
        } else {
            // Création d'un nouvel événement
            response = await fetch('/create-appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
        }

        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(`Erreur lors de la création ou modification du rendez-vous : ${errorDetails.message}`);
        }

        // Recharge le calendrier pour refléter les changements
        loadCalendar(currentMonth, currentYear);
        eventPopup.style.display = 'none';  // Fermer le popup après modification
    } catch (error) {
        console.error('Erreur lors de la création ou modification du rendez-vous :', error.message);
    }
});

// Supprimer un événement
deleteEventBtn.addEventListener('click', async () => {
    const id = document.getElementById('eventId').value;
    if (id) {
        // Ajouter une confirmation avant de supprimer
        const confirmation = window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?");
        
        if (confirmation) {
            try {
                await fetch(`/delete-appointment/${id}`, { method: 'DELETE' });
                loadCalendar(currentMonth, currentYear);
                eventPopup.style.display = 'none';
            } catch (error) {
                console.error('Erreur lors de la suppression du rendez-vous :', error.message);
            }
        } else {
            console.log("Suppression annulée par l'utilisateur.");
        }
    }
});

// Navigation entre mois et semaine
prevBtn.addEventListener('click', () => {
    if (viewMode === 'month') {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
    } else if (viewMode === 'week') {
        // S'assurer que selectedDate est bien définie pour la navigation dans les semaines
        if (!selectedDate) {
            selectedDate = new Date();  // Si selectedDate est null, on prend la date actuelle
        }
        selectedDate.setDate(selectedDate.getDate() - 7);  // Aller à la semaine précédente
    }
    loadCalendar();
});
// Fonction pour obtenir la semaine actuelle
function obtenirSemaineActuelle() {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Lundi
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Dimanche

    return { firstDayOfWeek, lastDayOfWeek };
}
nextBtn.addEventListener('click', () => {
    if (viewMode === 'month') {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    } else if (viewMode === 'week') {
        // S'assurer que selectedDate est bien définie pour la navigation dans les semaines
        if (!selectedDate) {
            selectedDate = new Date();  // Si selectedDate est null, on prend la date actuelle
        }
        selectedDate.setDate(selectedDate.getDate() + 7);  // Aller à la semaine suivante
    }
    loadCalendar();
});

// Boutons pour changer de vue
weekViewBtn.addEventListener('click', () => {
    viewMode = 'week';
    if (!selectedDate) {
        selectedDate = new Date();  // Initialiser selectedDate avec la date actuelle si elle est null
    }
    loadCalendar();
});

monthViewBtn.addEventListener('click', () => {
    viewMode = 'month';
    loadCalendar();
});

// Charger le mois actuel au démarrage
loadCalendar();

})();