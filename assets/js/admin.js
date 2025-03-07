// Admin panel functionality

// Load matches for admin panel
function loadAdminMatches() {
    const matchesContainer = document.getElementById('admin-matches-container');
    if (!matchesContainer) return;
    
    // Clear existing content
    matchesContainer.innerHTML = '<div class="loading">Loading matches...</div>';
    
    // Query matches from Firebase
    db.collection('matches')
        .orderBy('date')
        .get()
        .then(snapshot => {
            const matches = [];
            snapshot.forEach(doc => {
                matches.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Display matches
            displayAdminMatches(matches, matchesContainer);
        })
        .catch(error => {
            console.error("Error loading matches:", error);
            matchesContainer.innerHTML = '<div class="error-message">Failed to load matches. Please try again later.</div>';
        });
}

// Display matches in admin panel
function displayAdminMatches(matches, container) {
    // Clear loading indicator
    container.innerHTML = '';
    
    // Check if matches exist
    if (matches.length === 0) {
        container.innerHTML = '<div class="no-matches">No matches available</div>';
        return;
    }
    
    // Create table for matches
    const table = document.createElement('table');
    table.className = 'admin-matches-table';
    
    // Table header
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>League</th>
                <th>Match</th>
                <th>Prediction</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="admin-matches-body"></tbody>
    `;
    
    container.appendChild(table);
    
    const tableBody = document.getElementById('admin-matches-body');
    
    // Add matches to table
    matches.forEach(match => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', match.id);
        
        // Format date
        const matchDate = match.date.toDate();
        const formattedDate = matchDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        const formattedTime = matchDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Get first prediction if available
        const prediction = match.predictions && match.predictions.length > 0 
            ? `${match.predictions[0].type}: ${match.predictions[0].value}` 
            : 'No prediction';
        
        // Create row content
        row.innerHTML = `
            <td>${formattedDate}<br>${formattedTime}</td>
            <td>${match.league || 'Unknown'}</td>
            <td>${match.homeTeam} vs ${match.awayTeam}</td>
            <td>${prediction}</td>
            <td>
                <button class="edit-btn" data-id="${match.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${match.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const matchId = button.getAttribute('data-id');
            deleteMatch(matchId);
        });
    });
    
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const matchId = button.getAttribute('data-id');
            editMatch(matchId);
        });
    });
}

// Delete match from Firebase
function deleteMatch(matchId) {
    if (confirm('Are you sure you want to delete this match?')) {
        db.collection('matches').doc(matchId).delete()
            .then(() => {
                // Remove row from table
                const row = document.querySelector(`tr[data-id="${matchId}"]`);
                if (row) {
                    row.remove();
                }
                alert('Match deleted successfully');
            })
            .catch(error => {
                console.error("Error deleting match:", error);
                alert('Failed to delete match. Please try again.');
            });
    }
}

// Fill form with match data for editing
function editMatch(matchId) {
    db.collection('matches').doc(matchId).get()
        .then(doc => {
            if (doc.exists) {
                const match = doc.data();
                
                // Fill form fields
                document.getElementById('league-name').value = match.league || '';
                
                if (match.date) {
                    const matchDate = match.date.toDate();
                    document.getElementById('match-date').valueAsDate = matchDate;
                    
                    // Format time for input
                    const hours = matchDate.getHours().toString().padStart(2, '0');
                    const minutes = matchDate.getMinutes().toString().padStart(2, '0');
                    document.getElementById('match-time').value = `${hours}:${minutes}`;
                }
                
                document.getElementById('home-team').value = match.homeTeam || '';
                document.getElementById('away-team').value = match.awayTeam || '';
                document.getElementById('home-logo-url').value = match.homeTeamLogo || '';
                document.getElementById('away-logo-url').value = match.awayTeamLogo || '';
                
                // Fill prediction fields if available
                if (match.predictions && match.predictions.length > 0) {
                    const prediction = match.predictions[0];
                    document.getElementById('prediction-type').value = prediction.type || '1X2';
                    document.getElementById('prediction-value').value = prediction.value || '';
                    document.getElementById('confidence').value = prediction.confidence || 3;
                }
                
                document.getElementById('prediction-reasoning').value = match.reasoning || '';
                
                // Update form to edit mode
                const form = document.getElementById('add-match-form');
                form.setAttribute('data-edit-id', matchId);
                
                // Change button text
                const submitButton = form.querySelector('button[type="submit"]');
                submitButton.textContent = 'Update Match';
                
                // Scroll to form
                form.scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(error => {
            console.error("Error loading match for edit:", error);
            alert('Failed to load match data for editing.');
        });
}

// Handle form submission for adding/editing matches
document.addEventListener('DOMContentLoaded', function() {
    const addMatchForm = document.getElementById('add-match-form');
    if (addMatchForm) {
        addMatchForm.addEventListener('submit', e => {
            e.preventDefault();
            
            // Get form data
            const league = document.getElementById('league-name').value;
            const dateInput = document.getElementById('match-date').value;
            const timeInput = document.getElementById('match-time').value;
            const homeTeam = document.getElementById('home-team').value;
            const awayTeam = document.getElementById('away-team').value;
            const homeLogoUrl = document.getElementById('home-logo-url').value;
            const awayLogoUrl = document.getElementById('away-logo-url').value;
            const predictionType = document.getElementById('prediction-type').value;
            const predictionValue = document.getElementById('prediction-value').value;
            const confidence = parseInt(document.getElementById('confidence').value);
            const reasoning = document.getElementById('prediction-reasoning').value;
            
            // Create date object
            const dateTimeString = `${dateInput}T${timeInput}`;
            const matchDate = new Date(dateTimeString);
            
            // Create match object
            const matchData = {
                league: league,
                date: firebase.firestore.Timestamp.fromDate(matchDate),
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                homeTeamLogo: homeLogoUrl || null,
                awayTeamLogo: awayLogoUrl || null,
                predictions: [
                    {
                        type: predictionType,
                        value: predictionValue,
                        confidence: confidence
                    }
                ],
                reasoning: reasoning,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Check if editing or adding
            const editId = addMatchForm.getAttribute('data-edit-id');
            
            if (editId) {
                // Update existing match
                db.collection('matches').doc(editId).update(matchData)
                    .then(() => {
                        alert('Match updated successfully');
                        
                        // Reset form
                        addMatchForm.reset();
                        addMatchForm.removeAttribute('data-edit-id');
                        
                        // Change button text back
                        const submitButton = addMatchForm.querySelector('button[type="submit"]');
                        submitButton.textContent = 'Add Match';
                        
                        // Reload matches
                        loadAdminMatches();
                    })
                    .catch(error => {
                        console.error("Error updating match:", error);
                        alert('Failed to update match. Please try again.');
                    });
            } else {
                // Add new match
                db.collection('matches').add(matchData)
                    .then(() => {
                        alert('Match added successfully');
                        
                        // Reset form
                        addMatchForm.reset();
                        
                        // Reload matches
                        loadAdminMatches();
                    })
                    .catch(error => {
                        console.error("Error adding match:", error);
                        alert('Failed to add match. Please try again.');
                    });
            }
        });
    }
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.match-list-filters .filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter matches
            const filter = button.getAttribute('data-filter');
            filterAdminMatches(filter);
        });
    });
});

// Filter admin matches
function filterAdminMatches(filter) {
    const rows = document.querySelectorAll('#admin-matches-body tr');
    
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    rows.forEach(row => {
        const matchId = row.getAttribute('data-id');
        
        // Get match date from Firebase
        db.collection('matches').doc(matchId).get()
            .then(doc => {
                if (doc.exists) {
                    const match = doc.data();
                    const matchDate = match.date.toDate();
                    matchDate.setHours(0, 0, 0, 0);
                    
                    let shouldShow = false;
                    
                    switch (filter) {
                        case 'today':
                            shouldShow = matchDate.getTime() === today.getTime();
                            break;
                        case 'upcoming':
                            shouldShow = matchDate.getTime() > today.getTime();
                            break;
                        default:
                            shouldShow = true;
                    }
                    
                    row.style.display = shouldShow ? '' : 'none';
                }
            });
    });
}
