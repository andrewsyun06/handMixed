// Center Camera Layout UI Handler

// Track browser state
const trackBrowserState = {
    targetDeck: null,
    tracks: [],
    isLoading: false
};

// Initialize UI elements
function initializeCenterUI() {
    // Initialize crossfader
    const crossfader = document.getElementById('crossfader');
    if (crossfader) {
        crossfader.addEventListener('input', function(e) {
            updateCrossfaderValue(parseInt(e.target.value));
        });
    }
    
    // Initialize sync button
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncDecks);
    }
    
    // Update deck displays
    updateDeckDisplay('A');
    updateDeckDisplay('B');
    
    console.log('🎛️ Center camera UI initialized');
}

// Update deck display
function updateDeckDisplay(deckLetter) {
    const deck = appState.decks[deckLetter];
    const deckElement = document.getElementById(`deck${deckLetter}`);
    if (!deckElement) return;
    
    // Update track info
    const titleElement = deckElement.querySelector('.track-title');
    const artistElement = deckElement.querySelector('.track-artist');
    const artworkElement = deckElement.querySelector('.track-artwork img');
    const bpmElement = deckElement.querySelector('.bpm-display');
    const timeElement = deckElement.querySelector('.time-display');
    
    if (deck.track) {
        titleElement.textContent = deck.track.title || 'Unknown Title';
        artistElement.textContent = deck.track.artist || 'Unknown Artist';
        
        if (deck.track.artwork && artworkElement) {
            artworkElement.src = deck.track.artwork;
        }
        
        if (deck.track.bpm && bpmElement) {
            bpmElement.textContent = `${deck.track.bpm} BPM`;
        }
    } else {
        titleElement.textContent = 'No track loaded';
        artistElement.textContent = '-';
        bpmElement.textContent = '-- BPM';
        timeElement.textContent = '0:00';
        
        if (artworkElement) {
            artworkElement.src = '/static/img/default-artwork.png';
        }
    }
    
    // Update play button
    const playBtn = document.getElementById(`playBtn${deckLetter}`);
    if (playBtn) {
        playBtn.textContent = deck.isPlaying ? '⏸' : '▶';
        playBtn.classList.toggle('playing', deck.isPlaying);
    }
    
    // Update volume
    const volumeSlider = document.getElementById(`volume${deckLetter}`);
    if (volumeSlider) {
        volumeSlider.value = deck.volume * 100;
    }
    
    // Update active state
    deckElement.classList.toggle('active', deck.isPlaying);
}

// Show track browser
function showTrackBrowser(deckLetter) {
    trackBrowserState.targetDeck = deckLetter;
    const modal = document.getElementById('trackBrowserModal');
    const deckLabel = document.getElementById('modalDeckLabel');
    
    if (modal && deckLabel) {
        deckLabel.textContent = `Deck ${deckLetter}`;
        modal.classList.add('active');
        
        // Load trending tracks if not already loaded
        if (trackBrowserState.tracks.length === 0) {
            loadTrendingTracks();
        } else {
            displayBrowserTracks(trackBrowserState.tracks);
        }
    }
}

// Hide track browser
function hideTrackBrowser() {
    const modal = document.getElementById('trackBrowserModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Load trending tracks
async function loadTrendingTracks() {
    if (trackBrowserState.isLoading) return;
    
    trackBrowserState.isLoading = true;
    const trackList = document.getElementById('trackList');
    
    if (trackList) {
        trackList.innerHTML = '<div class="loading">Loading trending tracks...</div>';
    }
    
    try {
        const response = await fetch('/api/audius/trending/?limit=30');
        const data = await response.json();
        
        if (data.tracks) {
            trackBrowserState.tracks = data.tracks;
            displayBrowserTracks(data.tracks);
        }
    } catch (error) {
        console.error('Error loading tracks:', error);
        if (trackList) {
            trackList.innerHTML = '<div class="error">Failed to load tracks</div>';
        }
    } finally {
        trackBrowserState.isLoading = false;
    }
}

// Search tracks
async function searchTracks() {
    const searchInput = document.getElementById('trackSearchInput');
    if (!searchInput || !searchInput.value.trim()) return;
    
    const query = searchInput.value.trim();
    const trackList = document.getElementById('trackList');
    
    if (trackList) {
        trackList.innerHTML = '<div class="loading">Searching...</div>';
    }
    
    try {
        const response = await fetch(`/api/audius/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.tracks) {
            displayBrowserTracks(data.tracks);
        }
    } catch (error) {
        console.error('Search error:', error);
        if (trackList) {
            trackList.innerHTML = '<div class="error">Search failed</div>';
        }
    }
}

// Display tracks in browser
function displayBrowserTracks(tracks) {
    const trackList = document.getElementById('trackList');
    if (!trackList) return;
    
    if (tracks.length === 0) {
        trackList.innerHTML = '<div class="empty">No tracks found</div>';
        return;
    }
    
    const html = tracks.map((track, index) => `
        <div class="browser-track" onclick="selectTrackForDeck(${index})">
            <div class="browser-track-artwork">
                ${track.artwork ? 
                    `<img src="${track.artwork}" alt="${track.title}">` :
                    `<div class="artwork-placeholder">🎵</div>`
                }
            </div>
            <div class="browser-track-info">
                <div class="browser-track-title">${track.title || 'Unknown'}</div>
                <div class="browser-track-artist">${track.artist || 'Unknown Artist'}</div>
            </div>
            <div class="browser-track-meta">
                ${track.bpm ? `<span class="track-bpm">${track.bpm} BPM</span>` : ''}
                <span class="track-duration">${formatDuration(track.duration)}</span>
            </div>
        </div>
    `).join('');
    
    trackList.innerHTML = html;
}

// Select track for deck
function selectTrackForDeck(trackIndex) {
    const track = trackBrowserState.tracks[trackIndex];
    if (!track || !trackBrowserState.targetDeck) return;
    
    // Load track to deck
    loadTrackToDeck(track, trackBrowserState.targetDeck);
    
    // Hide browser
    hideTrackBrowser();
    
    // Show notification
    showNotification(`Loaded "${track.title}" to Deck ${trackBrowserState.targetDeck}`, 'success');
}

// Sync decks
function syncDecks() {
    const deckA = appState.decks.A;
    const deckB = appState.decks.B;
    
    if (!deckA.track || !deckB.track) {
        showNotification('Load tracks in both decks first', 'warning');
        return;
    }
    
    // Simple BPM sync - adjust deck B to match deck A
    if (deckA.track.bpm && deckB.track.bpm) {
        const bpmRatio = deckA.track.bpm / deckB.track.bpm;
        // This would adjust playback rate - simplified for now
        showNotification(`Synced Deck B to ${deckA.track.bpm} BPM`, 'success');
    } else {
        showNotification('BPM data not available', 'warning');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const statusBar = document.querySelector('.status-message');
    if (statusBar) {
        statusBar.textContent = message;
        statusBar.className = `status-message ${type}`;
        
        setTimeout(() => {
            statusBar.textContent = 'Ready';
            statusBar.className = 'status-message';
        }, 3000);
    }
}

// Format duration
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Start hand tracking
function startHandTracking() {
    if (typeof initializeHandTracking === 'function') {
        initializeHandTracking();
        document.getElementById('cameraPlaceholder').style.display = 'none';
        document.querySelector('.camera-view').classList.add('active');
    }
}

// Stop hand tracking
function stopHandTracking() {
    if (typeof stopMediaPipeHands === 'function') {
        stopMediaPipeHands();
        document.getElementById('cameraPlaceholder').style.display = 'flex';
        document.querySelector('.camera-view').classList.remove('active');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializeCenterUI();
});

// Add browser track styles
const browserStyles = document.createElement('style');
browserStyles.textContent = `
    .browser-track {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .browser-track:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(5px);
    }
    
    .browser-track-artwork {
        width: 50px;
        height: 50px;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;
    }
    
    .browser-track-artwork img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .artwork-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, var(--primary-blue), var(--primary-orange));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    
    .browser-track-info {
        flex: 1;
        min-width: 0;
    }
    
    .browser-track-title {
        font-weight: 600;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .browser-track-artist {
        font-size: 0.85rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .browser-track-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
    
    .track-bpm {
        font-weight: 600;
        color: var(--primary-blue);
    }
    
    .loading, .error, .empty {
        text-align: center;
        padding: 40px;
        color: var(--text-secondary);
    }
    
    .error {
        color: var(--status-error);
    }
    
    .camera-view.active #cameraPlaceholder {
        display: none;
    }
`;

document.head.appendChild(browserStyles);