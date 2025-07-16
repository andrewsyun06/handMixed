// Fullscreen Studio UI Handler with Enhanced Hand Tracking

// Studio state
const studioState = {
    isHandDJActive: false,
    currentDeckSelection: null,
    leftHandActive: false,
    rightHandActive: false,
    tracks: {}
};

// Start Hand DJ
async function startHandDJ() {
    try {
        console.log('🎛️ Starting Hand DJ...');
        
        // Check if hand tracking functions exist
        if (typeof startHandTracking !== 'function') {
            console.error('startHandTracking function not found');
            showStudioNotification('Hand tracking not initialized. Please refresh the page.', 'error');
            return;
        }
        
        // Start hand tracking with MediaPipe
        await startHandTracking();
        
        // Update UI
        document.getElementById('cameraPlaceholder').style.display = 'none';
        document.getElementById('stopHandDJ').style.display = 'block';
        document.getElementById('crossfaderContainer').style.display = 'block';
        document.getElementById('playBothBtn').style.display = 'block';
        document.getElementById('gestureGuide').style.display = 'block';
        
        studioState.isHandDJActive = true;
        
        // Start monitoring hand states
        startHandMonitoring();
        
        // Show notification
        showStudioNotification('Hand DJ Active! Use your hands to control the decks', 'success');
        
    } catch (error) {
        console.error('Failed to start Hand DJ:', error);
        showStudioNotification('Failed to start camera: ' + error.message, 'error');
    }
}

// Stop Hand DJ
function stopHandDJ() {
    if (typeof stopMediaPipeHands === 'function') {
        stopMediaPipeHands();
    }
    
    // Update UI
    document.getElementById('cameraPlaceholder').style.display = 'flex';
    document.getElementById('stopHandDJ').style.display = 'none';
    document.getElementById('crossfaderContainer').style.display = 'none';
    document.getElementById('playBothBtn').style.display = 'none';
    document.getElementById('gestureGuide').style.display = 'none';
    
    // Reset deck states
    resetDeckStates();
    
    studioState.isHandDJActive = false;
    
    showStudioNotification('Hand DJ stopped', 'info');
}

// Start hand monitoring
function startHandMonitoring() {
    setInterval(() => {
        if (!studioState.isHandDJActive) return;
        
        updateHandIndicators();
        updateDeckActivation();
        updateVolumeDisplays();
    }, 50); // 20fps update rate
}

// Update hand indicators
function updateHandIndicators() {
    if (!window.handState) return;
    
    // Left hand (Deck A)
    const leftHandDot = document.getElementById('leftHandDot');
    const leftHandDetected = handState.leftHand && handState.leftHand.detected;
    
    if (leftHandDetected) {
        leftHandDot.classList.add('active');
        studioState.leftHandActive = true;
    } else {
        leftHandDot.classList.remove('active');
        studioState.leftHandActive = false;
    }
    
    // Right hand (Deck B)
    const rightHandDot = document.getElementById('rightHandDot');
    const rightHandDetected = handState.rightHand && handState.rightHand.detected;
    
    if (rightHandDetected) {
        rightHandDot.classList.add('active');
        studioState.rightHandActive = true;
    } else {
        rightHandDot.classList.remove('active');
        studioState.rightHandActive = false;
    }
}

// Update deck activation with elevation effect
function updateDeckActivation() {
    const deckA = document.querySelector('.deck-overlay-panel.left');
    const deckB = document.querySelector('.deck-overlay-panel.right');
    
    // Deck A activation
    if (studioState.leftHandActive) {
        deckA.classList.add('active');
        deckA.style.transform = 'translateY(-10px) scale(1.02)';
        deckA.style.boxShadow = '0 10px 40px rgba(0, 212, 255, 0.6)';
        deckA.style.borderColor = '#00ff88';
        deckA.style.borderWidth = '3px';
        
        // Use enhanced activation if available
        if (window.enhanceDeckActivation) {
            enhanceDeckActivation('A', true);
        }
    } else {
        deckA.classList.remove('active');
        deckA.style.transform = 'translateY(0) scale(1)';
        deckA.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.3)';
        deckA.style.borderColor = '#00d4ff';
        deckA.style.borderWidth = '2px';
        
        if (window.enhanceDeckActivation) {
            enhanceDeckActivation('A', false);
        }
    }
    
    // Deck B activation
    if (studioState.rightHandActive) {
        deckB.classList.add('active');
        deckB.style.transform = 'translateY(-10px) scale(1.02)';
        deckB.style.boxShadow = '0 10px 40px rgba(255, 138, 0, 0.6)';
        deckB.style.borderColor = '#ffff00';
        deckB.style.borderWidth = '3px';
        
        // Use enhanced activation if available
        if (window.enhanceDeckActivation) {
            enhanceDeckActivation('B', true);
        }
    } else {
        deckB.classList.remove('active');
        deckB.style.transform = 'translateY(0) scale(1)';
        deckB.style.boxShadow = '0 0 30px rgba(255, 138, 0, 0.3)';
        deckB.style.borderColor = '#ff8a00';
        deckB.style.borderWidth = '2px';
        
        if (window.enhanceDeckActivation) {
            enhanceDeckActivation('B', false);
        }
    }
}

// Update volume displays
function updateVolumeDisplays() {
    if (!window.handState) return;
    
    // Update Deck A volume
    if (handState.leftHand && handState.leftHand.volume !== undefined) {
        const volumePercent = Math.round(handState.leftHand.volume * 100);
        document.querySelector('.deck-overlay-panel.left .volume-label').textContent = `Volume ${volumePercent}%`;
        document.getElementById('volumeFillA').style.width = `${volumePercent}%`;
        
        // Update actual deck volume
        if (window.appState && appState.decks && appState.decks.A) {
            updateDeckVolume('A', handState.leftHand.volume);
        }
    }
    
    // Update Deck B volume
    if (handState.rightHand && handState.rightHand.volume !== undefined) {
        const volumePercent = Math.round(handState.rightHand.volume * 100);
        document.querySelector('.deck-overlay-panel.right .volume-label').textContent = `Volume ${volumePercent}%`;
        document.getElementById('volumeFillB').style.width = `${volumePercent}%`;
        
        // Update actual deck volume
        if (window.appState && appState.decks && appState.decks.B) {
            updateDeckVolume('B', handState.rightHand.volume);
        }
    }
}

// Reset deck states
function resetDeckStates() {
    const deckA = document.querySelector('.deck-overlay-panel.left');
    const deckB = document.querySelector('.deck-overlay-panel.right');
    
    [deckA, deckB].forEach(deck => {
        if (deck) {
            deck.classList.remove('active');
            deck.style.transform = 'translateY(0) scale(1)';
        }
    });
}

// Select track for deck
function selectTrackForDeck(deck) {
    console.log(`🎵 Opening track browser for Deck ${deck}`);
    
    try {
        // Set the current deck selection
        studioState.currentDeckSelection = deck;
        
        // Force create and show modal if it doesn't exist
        let modal = document.getElementById('trackBrowserModal');
        if (!modal) {
            console.log('Creating modal dynamically...');
            createTrackBrowserModal();
            modal = document.getElementById('trackBrowserModal');
        }
        
        // Update modal label
        const modalLabel = document.getElementById('modalDeckLabel');
        if (modalLabel) {
            modalLabel.textContent = `Deck ${deck}`;
        }
        
        // Show the modal directly
        if (modal) {
            modal.style.display = 'block';
            modal.style.zIndex = '9999';
            console.log('✅ Modal shown directly');
            
            // Load trending tracks
            loadTrendingTracks();
        } else {
            console.error('❌ Modal still not found after creation attempt');
            showStudioNotification('Track browser not available', 'error');
        }
        
    } catch (error) {
        console.error('Error in selectTrackForDeck:', error);
        showStudioNotification('Failed to open track browser: ' + error.message, 'error');
    }
}

// Create track browser modal dynamically if it doesn't exist
function createTrackBrowserModal() {
    console.log('Creating track browser modal...');
    
    const modalHTML = `
        <div class="modal" id="trackBrowserModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Select Track for <span id="modalDeckLabel">Deck A</span></h3>
                    <button class="modal-close" onclick="window.hideTrackBrowser()">×</button>
                </div>
                <div class="modal-body">
                    <div class="track-search">
                        <input type="text" id="trackSearchInput" placeholder="Search tracks...">
                        <button class="search-btn" onclick="window.searchTracks()">Search</button>
                    </div>
                    <div class="track-list" id="trackList">
                        <!-- Tracks will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ Modal created');
}

// Load demo track for testing
function loadDemoTrack(deck) {
    console.log(`Loading demo track for Deck ${deck}`);
    
    const demoTrack = {
        title: `Demo Track ${deck}`,
        artist: 'System Generated',
        id: `demo_${deck.toLowerCase()}`,
        bpm: deck === 'A' ? 120 : 128
    };
    
    console.log('Loading demo track:', demoTrack);
    
    if (typeof loadTrackToDeck === 'function') {
        loadTrackToDeck(demoTrack, deck);
        showStudioNotification(`Demo track loaded to Deck ${deck}`, 'success');
    } else {
        console.error('loadTrackToDeck function not available');
        showStudioNotification('Track loading system not ready', 'error');
    }
}

// Show track browser
function showTrackBrowser() {
    console.log('🎵 Showing track browser modal');
    
    const modal = document.getElementById('trackBrowserModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('✅ Modal display set to block');
        loadTrendingTracks();
    } else {
        console.error('❌ trackBrowserModal element not found');
        showStudioNotification('Track browser not available', 'error');
    }
}

// Hide track browser
function hideTrackBrowser() {
    document.getElementById('trackBrowserModal').style.display = 'none';
}

// Load trending tracks
async function loadTrendingTracks() {
    console.log('🎵 Loading trending tracks...');
    
    const trackList = document.getElementById('trackList');
    if (!trackList) {
        console.error('❌ trackList element not found');
        return;
    }
    
    trackList.innerHTML = '<div class="loading">Loading trending tracks...</div>';
    
    try {
        console.log('📡 Fetching from /api/audius/trending/');
        const response = await fetch('/api/audius/trending/?limit=30');
        console.log('📡 Response status:', response.status);
        
        const data = await response.json();
        console.log('📡 Response data:', data);
        
        if (data.tracks) {
            studioState.tracks = data.tracks;
            console.log(`✅ Loaded ${data.tracks.length} tracks`);
            displayTracks(data.tracks);
        } else {
            console.warn('⚠️ No tracks in response data');
            trackList.innerHTML = '<div class="error">No tracks available</div>';
        }
    } catch (error) {
        console.error('❌ Error loading tracks:', error);
        trackList.innerHTML = '<div class="error">Failed to load tracks. Check console for details.</div>';
    }
}

// Search tracks
async function searchTracks() {
    const query = document.getElementById('trackSearchInput').value.trim();
    if (!query) return;
    
    const trackList = document.getElementById('trackList');
    trackList.innerHTML = '<div class="loading">Searching...</div>';
    
    try {
        const response = await fetch(`/api/audius/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.tracks) {
            studioState.tracks = data.tracks;
            displayTracks(data.tracks);
        }
    } catch (error) {
        console.error('Search error:', error);
        trackList.innerHTML = '<div class="error">Search failed</div>';
    }
}

// Display tracks
function displayTracks(tracks) {
    const trackList = document.getElementById('trackList');
    
    if (!tracks || tracks.length === 0) {
        trackList.innerHTML = '<div class="empty">No tracks found</div>';
        return;
    }
    
    const html = tracks.map((track, index) => `
        <div class="track-item" onclick="window.selectTrack(${index})">
            <div class="track-info">
                <div class="track-title">${track.title || 'Unknown'}</div>
                <div class="track-artist">${track.user?.username || track.artist || 'Unknown Artist'}</div>
            </div>
            <div class="track-meta">
                ${track.bpm ? `<span class="bpm">${track.bpm} BPM</span>` : ''}
                <span class="duration">${formatDuration(track.duration)}</span>
            </div>
        </div>
    `).join('');
    
    trackList.innerHTML = html;
}

// Select track
function selectTrack(index) {
    const track = studioState.tracks[index];
    if (!track || !studioState.currentDeckSelection) return;
    
    const deck = studioState.currentDeckSelection;
    
    // Load track to deck using existing deck manager
    if (window.loadTrackToDeck && typeof loadTrackToDeck === 'function') {
        loadTrackToDeck(track, deck);
    }
    
    // Update track display - use the function from multi-channel-audio.js
    if (window.updateTrackDisplay) {
        window.updateTrackDisplay(deck, track);
    } else {
        console.error('updateTrackDisplay function not found in window scope');
    }
    
    // Hide browser
    hideTrackBrowser();
    
    showStudioNotification(`Loaded "${track.title}" to Deck ${deck}`, 'success');
}

// Update track display - DEPRECATED (use the one in multi-channel-audio.js)
function updateTrackDisplay_OLD(deck, track) {
    const trackDisplay = document.getElementById(`trackDisplay${deck}`);
    if (!trackDisplay) return;
    
    // Get album cover URL from various sources
    let albumCoverUrl = null;
    
    if (track.artwork) {
        if (typeof track.artwork === 'string') {
            albumCoverUrl = track.artwork;
        } else if (typeof track.artwork === 'object') {
            albumCoverUrl = track.artwork['1000x1000'] || 
                           track.artwork['480x480'] || 
                           track.artwork['150x150'];
        }
    }
    
    if (!albumCoverUrl) {
        albumCoverUrl = track.cover_art || 
                       track.user?.profile_picture?.['480x480'] ||
                       track.user?.avatar_url;
    }
    
    trackDisplay.innerHTML = `
        <div class="track-loaded">
            <div class="track-art">
                ${albumCoverUrl ? 
                    `<img src="${albumCoverUrl}" alt="Album Cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                     <div class="track-art-fallback" style="display: none;">♪</div>` :
                    `<div class="track-art-fallback">♪</div>`
                }
            </div>
            <div class="track-info">
                <div class="track-name">${track.title || 'Unknown'}</div>
                <div class="track-artist">${track.user?.username || track.artist || 'Unknown Artist'}</div>
            </div>
        </div>
    `;
    
    // Update BPM display
    const bpmDisplay = document.querySelector(`.deck-overlay-panel.${deck === 'A' ? 'left' : 'right'} .bpm-display`);
    if (bpmDisplay && track.bpm) {
        bpmDisplay.textContent = `${track.bpm} BPM`;
    }
}

// Play both decks
function playBothDecks() {
    console.log('=== PLAY BOTH DECKS CLICKED ===');
    
    // Check if deckState exists (from app-state.js)
    if (typeof deckState === 'undefined') {
        console.warn('deckState not available, checking deckPlayers directly');
        // Use the audio system's direct check
        if (typeof playBothDecksSync === 'function') {
            playBothDecksSync();
            return;
        } else {
            showStudioNotification('Audio system not ready', 'error');
            return;
        }
    }
    
    // Debug: Check deck states
    console.log('Deck A state:', deckState.A);
    console.log('Deck B state:', deckState.B);
    console.log('Available functions:', {
        playDeck: typeof playDeck,
        playBothDecksSync: typeof playBothDecksSync,
        loadTrackToDeck: typeof loadTrackToDeck,
        audioContext: typeof audioContext !== 'undefined' ? 'available' : 'not available'
    });
    
    // Check if tracks are loaded in both decks (multiple sources)
    const deckAHasTrack = (deckState.A && (deckState.A.track || deckState.A.isLoaded)) || 
                         (deckPlayers && deckPlayers.A && (deckPlayers.A.audio || deckPlayers.A.bufferSource));
    const deckBHasTrack = (deckState.B && (deckState.B.track || deckState.B.isLoaded)) || 
                         (deckPlayers && deckPlayers.B && (deckPlayers.B.audio || deckPlayers.B.bufferSource));
    
    console.log('Track status:', {
        deckAHasTrack: deckAHasTrack,
        deckBHasTrack: deckBHasTrack,
        deckATrack: deckState.A?.track,
        deckBTrack: deckState.B?.track,
        deckAHasAudio: deckPlayers?.A?.audio ? 'yes' : 'no',
        deckBHasAudio: deckPlayers?.B?.audio ? 'yes' : 'no',
        deckAHasBuffer: deckPlayers?.A?.bufferSource ? 'yes' : 'no',
        deckBHasBuffer: deckPlayers?.B?.bufferSource ? 'yes' : 'no'
    });
    
    // Show error if tracks aren't loaded
    if (!deckAHasTrack && !deckBHasTrack) {
        showStudioNotification('Please load tracks in both Deck A and Deck B first', 'error');
        return;
    } else if (!deckAHasTrack) {
        showStudioNotification('Please load a track in Deck A first', 'error');
        return;
    } else if (!deckBHasTrack) {
        showStudioNotification('Please load a track in Deck B first', 'error');
        return;
    }
    
    // Both tracks are loaded, use the audio system's sync function
    if (typeof playBothDecksSync === 'function') {
        console.log('Using playBothDecksSync function');
        playBothDecksSync();
    } else {
        // Fallback to individual deck playback
        console.log('Fallback to individual deck playback');
        playDecksAfterLoad();
    }
}

// Play decks after ensuring they're loaded
function playDecksAfterLoad() {
    console.log('Attempting to play decks...');
    
    try {
        // Check if audio context is available and running
        if (typeof audioContext !== 'undefined' && audioContext) {
            console.log('Audio context state:', audioContext.state);
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                    startPlayback();
                });
            } else {
                startPlayback();
            }
        } else {
            console.log('No audio context, trying direct playback...');
            startPlayback();
        }
        
    } catch (error) {
        console.error('Error in playDecksAfterLoad:', error);
        showStudioNotification('Failed to play decks: ' + error.message, 'error');
    }
}

// Start actual playback
function startPlayback() {
    console.log('Starting playback...');
    
    if (typeof playDeck === 'function') {
        console.log('Playing Deck A...');
        playDeck('A');
        console.log('Playing Deck B...');
        playDeck('B');
        showStudioNotification('Playing both decks', 'success');
    } else {
        console.error('playDeck function not available');
        showStudioNotification('Audio system not ready', 'error');
    }
}

// Show music library
function showMusicLibrary() {
    // Toggle between deck panels
    const deckPanels = document.querySelectorAll('.deck-overlay-panel');
    deckPanels.forEach(panel => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
}

// Show studio notification
function showStudioNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `studio-notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid;
        border-radius: 25px;
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;
    
    // Set border color based on type
    switch(type) {
        case 'success':
            notification.style.borderColor = '#00ff88';
            break;
        case 'error':
            notification.style.borderColor = '#ff0080';
            break;
        case 'warning':
            notification.style.borderColor = '#ff8a00';
            break;
        default:
            notification.style.borderColor = '#00d4ff';
    }
    
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Format duration
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Channel control handlers and modal verification
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 DOM Content Loaded - Checking modal elements...');
    
    // Check if modal elements exist
    const modal = document.getElementById('trackBrowserModal');
    const trackList = document.getElementById('trackList');
    const modalLabel = document.getElementById('modalDeckLabel');
    
    console.log('Modal elements check:', {
        modal: !!modal,
        trackList: !!trackList,
        modalLabel: !!modalLabel
    });
    
    if (!modal) console.error('❌ trackBrowserModal not found');
    if (!trackList) console.error('❌ trackList not found');
    if (!modalLabel) console.error('❌ modalDeckLabel not found');
    
    // Add select track button click handlers
    document.querySelectorAll('.select-track-btn').forEach(btn => {
        console.log('Found select track button:', btn);
        
        // Remove any existing onclick attribute
        btn.removeAttribute('onclick');
        
        // Add event listener
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const deckPanel = this.closest('.deck-overlay-panel');
            const deck = deckPanel.classList.contains('left') ? 'A' : 'B';
            
            console.log('Select track button clicked for deck:', deck);
            selectTrackForDeck(deck);
        });
    });
    
    // Add channel button click handlers
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const channel = this.dataset.channel;
            const deck = this.closest('.deck-overlay-panel').classList.contains('left') ? 'A' : 'B';
            
            // Toggle channel
            this.classList.toggle('active');
            
            // Update audio if available
            if (window.toggleAudioChannel && typeof toggleAudioChannel === 'function') {
                toggleAudioChannel(deck, channel);
            }
        });
    });
    
    // Crossfader functionality
    const crossfader = document.getElementById('crossfaderHandle');
    if (crossfader) {
        let isDragging = false;
        const track = crossfader.parentElement;
        
        crossfader.addEventListener('mousedown', () => isDragging = true);
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = track.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
            
            crossfader.style.left = `${percent}%`;
            
            // Update crossfader value
            if (window.updateCrossfaderValue && typeof updateCrossfaderValue === 'function') {
                updateCrossfaderValue(percent);
            }
        });
    }
    
    console.log('🎛️ Fullscreen Studio UI initialized');
});

// Add animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }
    
    .deck-overlay-panel {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .deck-overlay-panel.active {
        animation: deckPulse 2s ease-in-out infinite;
    }
    
    @keyframes deckPulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.95;
        }
    }
    
    .loading, .error, .empty {
        text-align: center;
        padding: 20px;
        color: rgba(255, 255, 255, 0.6);
    }
    
    .error {
        color: #ff0080;
    }
    
    .track-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .track-item:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: #00d4ff;
        transform: translateX(5px);
    }
    
    .track-meta {
        display: flex;
        gap: 15px;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
    }
    
    .bpm {
        color: #00d4ff;
        font-weight: 600;
    }
`;

document.head.appendChild(animationStyles);

// Track playing states for double-play prevention
const individualDeckStates = {
    A: { isPlaying: false, audioElement: null },
    B: { isPlaying: false, audioElement: null }
};

// Simple individual deck playback functions
function playIndividualDeck(deckLetter) {
    console.log(`🎵 Playing individual Deck ${deckLetter}`);
    
    // Check if already playing
    if (individualDeckStates[deckLetter].isPlaying) {
        console.log(`⚠️ Deck ${deckLetter} is already playing`);
        showStudioNotification(`Deck ${deckLetter} is already playing`, 'warning');
        return;
    }
    
    // Try multiple ways to find a loaded track
    let audioElement = null;
    let trackFound = false;
    
    // Method 1: Check deckPlayers (multi-channel audio system)
    if (typeof deckPlayers !== 'undefined' && deckPlayers[deckLetter]) {
        const deck = deckPlayers[deckLetter];
        console.log(`Found deckPlayers Deck ${deckLetter}:`, deck);
        
        if (deck.audio && deck.audio.src) {
            audioElement = deck.audio;
            trackFound = true;
            console.log(`✅ Found audio in deckPlayers for Deck ${deckLetter}:`, deck.audio.src);
        } else if (deck.bufferSource) {
            console.log(`Found buffer source for Deck ${deckLetter}, using complex system`);
            if (typeof playDeck === 'function') {
                playDeck(deckLetter);
                return;
            }
        }
    }
    
    // Method 2: Check if there's a direct audio element in the DOM or other systems
    if (!trackFound && typeof deckState !== 'undefined' && deckState[deckLetter] && deckState[deckLetter].track) {
        console.log(`Found track in deckState for Deck ${deckLetter}:`, deckState[deckLetter].track);
        // If we have track info but no audio element, try to create one
        if (!audioElement) {
            console.log(`Track found in deckState but no audio element, checking for audio URL...`);
            const track = deckState[deckLetter].track;
            if (track.stream_url || track.preview_url) {
                audioElement = new Audio();
                audioElement.src = track.stream_url || track.preview_url;
                audioElement.volume = 0.7;
                trackFound = true;
                console.log(`✅ Created new audio element for Deck ${deckLetter}:`, audioElement.src);
            }
        }
    }
    
    // Method 3: Check track display to see if UI shows a loaded track
    if (!trackFound) {
        const trackDisplay = document.getElementById(`trackDisplay${deckLetter}`);
        if (trackDisplay && trackDisplay.querySelector('.track-loaded')) {
            console.log(`UI shows track loaded for Deck ${deckLetter} but no audio source found`);
            showStudioNotification(`Track displayed but audio not ready for Deck ${deckLetter}`, 'warning');
            return;
        }
    }
    
    // Try to play the audio
    if (trackFound && audioElement) {
        console.log(`Attempting to play Deck ${deckLetter}...`);
        audioElement.play().then(() => {
            console.log(`✅ Deck ${deckLetter} playing successfully`);
            
            // Track state for double-play prevention
            individualDeckStates[deckLetter].isPlaying = true;
            individualDeckStates[deckLetter].audioElement = audioElement;
            
            // Add event listener for when track ends
            audioElement.addEventListener('ended', () => {
                individualDeckStates[deckLetter].isPlaying = false;
                individualDeckStates[deckLetter].audioElement = null;
                console.log(`🏁 Deck ${deckLetter} finished playing`);
                updateDeckButtonStates(deckLetter, false);
            });
            
            // Add event listener for when track is paused
            audioElement.addEventListener('pause', () => {
                if (audioElement.currentTime === 0) {
                    individualDeckStates[deckLetter].isPlaying = false;
                    individualDeckStates[deckLetter].audioElement = null;
                    updateDeckButtonStates(deckLetter, false);
                }
            });
            
            showStudioNotification(`Deck ${deckLetter} playing`, 'success');
            updateDeckButtonStates(deckLetter, true);
            
            // Start waveform visualization
            startWaveformVisualization(deckLetter, audioElement);
            
        }).catch(error => {
            console.error(`❌ Failed to play Deck ${deckLetter}:`, error);
            showStudioNotification(`Failed to play Deck ${deckLetter}: ${error.message}`, 'error');
        });
    } else {
        console.warn(`No track loaded in Deck ${deckLetter}`);
        console.log('Debug info:', {
            deckPlayersAvailable: typeof deckPlayers !== 'undefined',
            deckStateAvailable: typeof deckState !== 'undefined',
            deckPlayers: typeof deckPlayers !== 'undefined' ? deckPlayers : 'not available',
            deckState: typeof deckState !== 'undefined' ? deckState[deckLetter] : 'not available'
        });
        showStudioNotification(`No track loaded in Deck ${deckLetter}`, 'warning');
    }
}

function stopIndividualDeck(deckLetter) {
    console.log(`⏹️ Stopping individual Deck ${deckLetter}`);
    
    let audioStopped = false;
    
    // Check individual deck state first
    if (individualDeckStates[deckLetter].isPlaying && individualDeckStates[deckLetter].audioElement) {
        const audioElement = individualDeckStates[deckLetter].audioElement;
        audioElement.pause();
        audioElement.currentTime = 0;
        
        individualDeckStates[deckLetter].isPlaying = false;
        individualDeckStates[deckLetter].audioElement = null;
        audioStopped = true;
        console.log(`✅ Deck ${deckLetter} individual audio stopped`);
    }
    
    // Try to stop audio from deckPlayers system as well
    if (typeof deckPlayers !== 'undefined' && deckPlayers[deckLetter]) {
        const deck = deckPlayers[deckLetter];
        
        if (deck.audio) {
            deck.audio.pause();
            deck.audio.currentTime = 0;
            audioStopped = true;
            console.log(`✅ Deck ${deckLetter} deckPlayers audio stopped`);
        }
        
        if (deck.bufferSource) {
            console.log(`Using complex stop for Deck ${deckLetter}`);
            if (typeof stopDeck === 'function') {
                stopDeck(deckLetter);
                audioStopped = true;
            }
        }
    }
    
    if (audioStopped) {
        showStudioNotification(`Deck ${deckLetter} stopped`, 'info');
        updateDeckButtonStates(deckLetter, false);
        stopWaveformVisualization(deckLetter);
    } else {
        console.warn(`No audio to stop for Deck ${deckLetter}`);
        showStudioNotification(`No audio playing in Deck ${deckLetter}`, 'warning');
    }
}

// Update button states based on playing status
function updateDeckButtonStates(deckLetter, isPlaying) {
    const deckPanel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    const playBtn = deckPanel.querySelector('.play-deck-btn');
    const stopBtn = deckPanel.querySelector('.stop-deck-btn');
    
    if (playBtn && stopBtn) {
        if (isPlaying) {
            playBtn.style.opacity = '0.6';
            playBtn.style.cursor = 'not-allowed';
            stopBtn.style.opacity = '1';
            stopBtn.style.cursor = 'pointer';
        } else {
            playBtn.style.opacity = '1';
            playBtn.style.cursor = 'pointer';
            stopBtn.style.opacity = '0.6';
            stopBtn.style.cursor = 'not-allowed';
        }
    }
}

// Waveform visualization variables - use a different name to avoid conflict
const studioWaveformVisualizers = {
    A: { animationId: null, analyser: null, dataArray: null },
    B: { animationId: null, analyser: null, dataArray: null }
};

// Start waveform visualization
function startWaveformVisualization(deckLetter, audioElement) {
    console.log(`🌊 Starting waveform visualization for Deck ${deckLetter}`);
    
    try {
        // Initialize audio context if needed
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Create analyser for this deck
        const analyser = window.audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Connect audio to analyser
        const source = window.audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(window.audioContext.destination);
        
        // Store analyser data
        studioWaveformVisualizers[deckLetter].analyser = analyser;
        studioWaveformVisualizers[deckLetter].dataArray = dataArray;
        
        // Start visualization for all three waveforms (bass, drums, synth)
        startChannelWaveform(deckLetter, 'Bass', 'waveformBass');
        startChannelWaveform(deckLetter, 'Drums', 'waveformDrums');
        startChannelWaveform(deckLetter, 'Synth', 'waveformSynth');
        
        // Start main waveform
        if (typeof initializeMainWaveform === 'function') {
            initializeMainWaveform(deckLetter);
        }
        
        console.log(`✅ Waveform visualization started for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Failed to start waveform visualization for Deck ${deckLetter}:`, error);
    }
}

// Start visualization for individual channel waveform
function startChannelWaveform(deckLetter, channelName, waveformId) {
    const canvas = document.getElementById(`${waveformId}${deckLetter}`);
    if (!canvas) {
        console.warn(`Canvas not found: ${waveformId}${deckLetter}`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const analyser = studioWaveformVisualizers[deckLetter].analyser;
    const dataArray = studioWaveformVisualizers[deckLetter].dataArray;
    
    if (!analyser || !dataArray) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * 2; // High DPI
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px';
    ctx.scale(2, 2);
    
    const colors = {
        A: { bass: '#ff6b6b', drums: '#f39c12', synth: '#00d4ff' },
        B: { bass: '#ff8a00', drums: '#ffff00', synth: '#00ff88' }
    };
    
    const channelColor = colors[deckLetter][channelName.toLowerCase()] || '#00d4ff';
    
    function draw() {
        if (!individualDeckStates[deckLetter].isPlaying) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        const width = canvas.width / 2;
        const height = canvas.height / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        const barWidth = width / dataArray.length;
        let x = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            
            const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, channelColor);
            gradient.addColorStop(1, channelColor + '66');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            
            x += barWidth;
        }
        
        studioWaveformVisualizers[deckLetter].animationId = requestAnimationFrame(draw);
    }
    
    draw();
}

// Stop waveform visualization
function stopWaveformVisualization(deckLetter) {
    if (studioWaveformVisualizers[deckLetter].animationId) {
        cancelAnimationFrame(studioWaveformVisualizers[deckLetter].animationId);
        studioWaveformVisualizers[deckLetter].animationId = null;
    }
    
    // Clear all waveform canvases
    ['Bass', 'Drums', 'Synth'].forEach(channel => {
        const canvas = document.getElementById(`waveform${channel}${deckLetter}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
    
    console.log(`🌊 Waveform visualization stopped for Deck ${deckLetter}`);
}

// Test function for debugging Audius API
function testAudiusAPI() {
    console.log('🧪 Testing Audius API...');
    
    fetch('/api/audius/trending/?limit=5')
        .then(response => {
            console.log('API Response status:', response.status);
            console.log('API Response headers:', response.headers);
            return response.text();
        })
        .then(text => {
            console.log('API Response text:', text);
            try {
                const data = JSON.parse(text);
                console.log('API Response JSON:', data);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
            }
        })
        .catch(error => {
            console.error('API Request failed:', error);
        });
}

// Manual test function to open track browser
function testOpenTrackBrowser() {
    console.log('🧪 Manually opening track browser for Deck A...');
    selectTrackForDeck('A');
}

// Debug function to check all select track buttons
function debugSelectButtons() {
    console.log('🔍 Debugging select track buttons...');
    
    const buttons = document.querySelectorAll('.select-track-btn');
    console.log(`Found ${buttons.length} select track buttons`);
    
    buttons.forEach((btn, index) => {
        console.log(`Button ${index}:`, {
            element: btn,
            text: btn.textContent,
            onclick: btn.onclick,
            eventListeners: btn._listeners || 'Unable to access',
            parent: btn.parentElement.className
        });
    });
    
    // Also check if buttons are clickable
    const firstButton = buttons[0];
    if (firstButton) {
        const rect = firstButton.getBoundingClientRect();
        console.log('First button position:', rect);
        console.log('Is visible:', rect.width > 0 && rect.height > 0);
        console.log('Computed style:', window.getComputedStyle(firstButton));
    }
}

// Export functions to window for global access
window.startHandDJ = startHandDJ;
window.stopHandDJ = stopHandDJ;
window.selectTrackForDeck = selectTrackForDeck;
window.loadDemoTrack = loadDemoTrack;
window.hideTrackBrowser = hideTrackBrowser;
window.searchTracks = searchTracks;
window.playBothDecks = playBothDecks;
window.playIndividualDeck = playIndividualDeck;
window.stopIndividualDeck = stopIndividualDeck;
window.showMusicLibrary = showMusicLibrary;
window.testAudiusAPI = testAudiusAPI;
window.testOpenTrackBrowser = testOpenTrackBrowser;
window.debugSelectButtons = debugSelectButtons;
window.selectTrack = selectTrack;