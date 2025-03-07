// Functions for loading and managing matches

// Load matches from Firebase
function loadMatches() {
    const matchesContainer = document.getElementById('matches-container');
    if (!matchesContainer) return;
    
    // Clear existing content
    matchesContainer.innerHTML = '<div class="loading-matches"><div class="loader"></div><p>Loading matches...</p></div>';
    
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
            
            // Group matches by league
            const groupedMatches = groupMatchesByLeague(matches);
            
            // Display matches
            displayMatches(groupedMatches, matchesContainer);
            
            // Filter matches based on active tab
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                filterMatches(activeTab.getAttribute('data-filter'));
            }
        })
        .catch(error => {
            console.error("Error loading matches:", error);
            matchesContainer.innerHTML = '<div class="error-message">Failed to load matches. Please try again later.</div>';
        });
}

// Group matches by league
function groupMatchesByLeague(matches) {
    const grouped = {};
    
    matches.forEach(match => {
        const league = match.league || 'Other';
        
        if (!grouped[league]) {
            grouped[league] = [];
        }
        
        grouped[league].push(match);
    });
    
    return grouped;
}

// Display matches grouped by league
function displayMatches(groupedMatches, container) {
    // Clear loading indicator
    container.innerHTML = '';
    
    // Check if matches exist
    if (Object.keys(groupedMatches).length === 0) {
        container.innerHTML = '<div class="no-matches">No matches available</div>';
        return;
    }
    
    // Loop through each league
    for (const league in groupedMatches) {
        const leagueSection = document.createElement('div');
        leagueSection.className = 'league-section';
        
        // League header
        const leagueHeader = document.createElement('h3');
        leagueHeader.className = 'league-header';
        leagueHeader.textContent = league;
        leagueSection.appendChild(leagueHeader);
        
        // Matches list
        const matchesList = document.createElement('div');
        matchesList.className = 'matches-list';
        
        // Add matches to the list
        groupedMatches[league].forEach(match => {
            const matchCard = createMatchCard(match);
            matchesList.appendChild(matchCard);
        });
        
        leagueSection.appendChild(matchesList);
        container.appendChild(leagueSection);
    }
}

// Create a match card element
function createMatchCard(match) {
    const matchCard = document.createElement('div');
    matchCard.className = 'match-card';
    matchCard.setAttribute('data-id', match.id);
    matchCard.setAttribute('data-date', match.date.toDate().toISOString());
    
    // Format date and time
    const matchDate = match.date.toDate();
    const formattedDate = matchDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
    const formattedTime = matchDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Match card content
    matchCard.innerHTML = `
        <div class="match-time">${formattedTime}</div>
        <div class="match-teams">
            <div class="team home">
                <img src="${match.homeTeamLogo || 'assets/images/teams/placeholder.png'}" alt="${match.homeTeam}">
                <span>${match.homeTeam}</span>
            </div>
            <span class="vs">vs</span>
            <div class="team away">
                <img src="${match.awayTeamLogo || 'assets/images/teams/placeholder.png'}" alt="${match.awayTeam}">
                <span>${match.awayTeam}</span>
            </div>
        </div>
        <div class="prediction-tag">
            <span>${match.predictions && match.predictions[0] ? match.predictions[0].type : 'Prediction'}</span>
        </div>
    `;
    
    // Add click event to navigate to match details
    matchCard.addEventListener('click', () => {
        window.location.href = `match-details.html?id=${match.id}`;
    });
    
    return matchCard;
}

// Filter matches based on selected tab
function filterMatches(filter) {
    const matchCards = document.querySelectorAll('.match-card');
    const leagueSections = document.querySelectorAll('.league-section');
    
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    matchCards.forEach(card => {
        const matchDate = new Date(card.getAttribute('data-date'));
        matchDate.setHours(0, 0, 0, 0);
        
        let shouldShow = false;
        
        switch (filter) {
            case 'today':
                shouldShow = matchDate.getTime() === today.getTime();
                break;
            case 'tomorrow':
                shouldShow = matchDate.getTime() === tomorrow.getTime();
                break;
            case 'upcoming':
                shouldShow = matchDate.getTime() > tomorrow.getTime();
                break;
            default:
                shouldShow = true;
        }
        
        card.style.display = shouldShow ? 'flex' : 'none';
    });
    
    // Hide empty league sections
    leagueSections.forEach(section => {
        const visibleMatches = section.querySelectorAll('.match-card[style="display: flex"]');
        section.style.display = visibleMatches.length > 0 ? 'block' : 'none';
    });
}

// Load match details
function loadMatchDetails() {
    // Get match ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('id');
    
    if (!matchId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Query the match from Firebase
    db.collection('matches').doc(matchId).get()
        .then(doc => {
            if (doc.exists) {
                const match = {
                    id: doc.id,
                    ...doc.data()
                };
                
                displayMatchDetails(match);
            } else {
                console.error("Match not found");
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.error("Error loading match details:", error);
        });
}

// Display match details
function displayMatchDetails(match) {
    // Update league name
    const leagueNameElement = document.getElementById('league-name');
    if (leagueNameElement) {
        leagueNameElement.textContent = match.league || 'Unknown League';
    }
    
    // Update match datetime
    const matchDateElement = document.getElementById('match-datetime');
    if (matchDateElement && match.date) {
        const matchDate = match.date.toDate();
        const formattedDate = matchDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const formattedTime = matchDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        matchDateElement.textContent = `${formattedDate} | ${formattedTime}`;
    }
    
    // Update team names and logos
    const homeTeamName = document.getElementById('home-team-name');
    const awayTeamName = document.getElementById('away-team-name');
    const homeTeamLogo = document.getElementById('home-team-logo');
    const awayTeamLogo = document.getElementById('away-team-logo');
    
    if (homeTeamName) homeTeamName.textContent = match.homeTeam || 'Home Team';
    if (awayTeamName) awayTeamName.textContent = match.awayTeam || 'Away Team';
    
    if (homeTeamLogo && match.homeTeamLogo) {
        homeTeamLogo.src = match.homeTeamLogo;
    }
    
    if (awayTeamLogo && match.awayTeamLogo) {
        awayTeamLogo.src = match.awayTeamLogo;
    }
    
    // Display predictions
    const tipsContainer = document.getElementById('tips-container');
    if (tipsContainer && match.predictions) {
        tipsContainer.innerHTML = '';
        
        if (match.predictions.length === 0) {
            tipsContainer.innerHTML = '<div class="no-tips">No predictions available</div>';
        } else {
            match.predictions.forEach(prediction => {
                const tipCard = document.createElement('div');
                tipCard.className = 'tip-card';
                
                // Create confidence stars
                let starsHTML = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= prediction.confidence) {
                        starsHTML += '<i class="fas fa-star"></i>';
                    } else {
                        starsHTML += '<i class="far fa-star"></i>';
                    }
                }
                
                tipCard.innerHTML = `
                    <div class="tip-header">
                        <h3>${prediction.type}</h3>
                        <div class="confidence-stars">${starsHTML}</div>
                    </div>
                    <div class="tip-value">${prediction.value}</div>
                `;
                
                tipsContainer.appendChild(tipCard);
            });
        }
    }
    
    // Display reasoning
    const reasoningElement = document.getElementById('prediction-reasoning');
    if (reasoningElement) {
        reasoningElement.textContent = match.reasoning || 'No analysis available for this match.';
    }
    
    // Update page title
    document.title = `${match.homeTeam} vs ${match.awayTeam} - LuCky DaIly Prediction`;
}
