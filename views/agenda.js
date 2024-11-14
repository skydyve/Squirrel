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
    document.getElementById('workStart').addEventListener('change', loadCalendar);
    document.getElementById('workEnd').addEventListener('change', loadCalendar);

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
    monthYearDisplay.innerHTML = `${months[month]} ${year}`;
    let date = 1;

    for (let i = 0; i < 6; i++) { // Maximum de 6 semaines dans un mois
        const row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            const eventsContainer = document.createElement('div');
            eventsContainer.classList.add('events-container');
            cell.appendChild(eventsContainer);

            if (i === 0 && j < firstDay || date > daysInMonth) {
                cell.classList.add('grayed');
                cell.appendChild(document.createTextNode(''));
            } else {
                const cellDate = new Date(year, month, date);
                cell.appendChild(document.createTextNode(date));
                
                // Filtrer les événements pour ce jour
                const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.getDate() === cellDate.getDate() &&
                        eventDate.getMonth() === cellDate.getMonth() &&
                        eventDate.getFullYear() === cellDate.getFullYear();
                });

                // Affichage des événements sans limitation
                dayEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.classList.add('event');
                    eventElement.textContent = event.title;
                    eventElement.style.backgroundColor = categoryColors[event.category] || 'blue';
                    eventElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openEventPopup(event, cell);
                    });
                    eventsContainer.appendChild(eventElement);
                });

                cell.addEventListener('click', () => {
                    selectedDate = cellDate;
                    openEventPopup({ date, month, year }, cell);
                });
                date++;
            }
            row.appendChild(cell);
        }
        calendarTable.appendChild(row);
    }
}

function displayAllEventsPopup(dayEvents) {
    const popupContent = document.querySelector('.popup-content');
    popupContent.innerHTML = ''; // Vider le contenu précédent

    dayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.classList.add('popup-event-item');
        eventItem.textContent = `${event.title} - ${event.description || ''}`;
        popupContent.appendChild(eventItem);
    });
    eventPopup.style.display = 'block'; // Afficher le popup
}

// Fonction pour charger la vue "semaine"
function loadWeekView(date, events) {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const dayOffset = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Commencer la semaine le lundi
    startOfWeek.setDate(startOfWeek.getDate() - dayOffset);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const pixelsPerHour = 100; // 100 pixels par heure

    // Récupérer les heures de travail configurées par l'utilisateur
    const workStart = parseInt(document.getElementById('workStart').value.split(':')[0]);
    const workEnd = parseInt(document.getElementById('workEnd').value.split(':')[0]);

    monthYearDisplay.innerHTML = `Semaine du ${startOfWeek.getDate()} ${months[startOfWeek.getMonth()]} au ${endOfWeek.getDate()} ${months[endOfWeek.getMonth()]}`;
    calendarTable.innerHTML = ''; // Vider la table

    for (let hour = 0; hour < 24; hour++) {
        // Afficher uniquement les heures dans la plage configurée
        if (hour < workStart || hour >= workEnd) {
            continue; // Ignorer les heures en dehors de la plage
        }

        const row = document.createElement('tr');
        row.classList.add('hour-row');

        // Colonne de gauche avec l'heure
        const hourCell = document.createElement('td');
        hourCell.classList.add('hour-label');
        hourCell.textContent = `${String(hour).padStart(2, '0')}:00`;
        row.appendChild(hourCell);

        // Ajouter les cellules pour chaque jour de la semaine
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('td');
            cell.classList.add('hour-cell');
            cell.style.position = 'relative';

            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            currentDay.setHours(hour, 0, 0, 0);

            // Filtrer les événements de la journée
            const dayEvents = events.filter(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                return (
                    currentDay.getDate() === eventStart.getDate() &&
                    currentDay.getMonth() === eventStart.getMonth() &&
                    currentDay.getFullYear() === eventStart.getFullYear() &&
                    eventEnd > currentDay
                );
            });

            // Gérer les groupes de chevauchement pour la journée entière
            const overlapGroups = [];
            dayEvents.forEach(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);

                let addedToGroup = false;
                for (let group of overlapGroups) {
                    if (group.some(ev => new Date(ev.end) > eventStart && new Date(ev.start) < eventEnd)) {
                        group.push(event);
                        addedToGroup = true;
                        break;
                    }
                }
                if (!addedToGroup) {
                    overlapGroups.push([event]);
                }
            });

            // Créer et positionner chaque événement unique en fonction des chevauchements
            overlapGroups.forEach(group => {
                const groupWidth = 100 / group.length; // Diviser la largeur entre événements du groupe

                group.forEach((event, index) => {
                    const eventElement = document.createElement('div');
                    eventElement.classList.add('event');
                    eventElement.textContent = event.title;
                    eventElement.dataset.eventId = event.id;

                    const eventStart = new Date(event.start);
                    const eventEnd = new Date(event.end);
                    const durationInMinutes = (eventEnd - eventStart) / 60000;

                    // Calculer la hauteur en fonction de la durée totale
                    const cellHeight = (durationInMinutes / 60) * pixelsPerHour;
                    const topOffset = (eventStart.getHours() - hour) * pixelsPerHour + (eventStart.getMinutes() / 60) * pixelsPerHour;

                    // Appliquer les styles pour la largeur et le positionnement en hauteur
                    eventElement.style.height = `${cellHeight}px`;
                    eventElement.style.width = `${groupWidth}%`;
                    eventElement.style.left = `${index * groupWidth}%`;
                    eventElement.style.top = `${topOffset}px`;
                    eventElement.style.position = 'absolute';
                    eventElement.style.backgroundColor = categoryColors[event.category] || 'blue';

                    // Éviter les duplications
                    if (!cell.querySelector(`.event[data-event-id="${event.id}"]`)) {
                        eventElement.addEventListener('click', (e) => {
                            e.stopPropagation();
                            openEventPopup(event, cell);
                        });
                        cell.appendChild(eventElement);
                    }
                });
            });

            // Gérer l'ajout de nouveaux rendez-vous en cliquant dans une zone vide
            cell.addEventListener('click', () => {
                selectedDate = new Date(currentDay);
                openEventPopup({ date: selectedDate.getDate(), month: selectedDate.getMonth(), year: selectedDate.getFullYear() }, cell);
            });

            row.appendChild(cell);
        }
        calendarTable.appendChild(row);
    }
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