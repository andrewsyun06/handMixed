// Deck Control Functions for Fullscreen Studio

// Load track to deck
// COMMENTED OUT - Using the implementation from multi-channel-audio.js instead
// This was overwriting the proper implementation that handles audio loading and display updates
/*
function loadTrackToDeck(track, deckLetter) {
    console.log(`Loading track to deck ${deckLetter}:`, track);
    
    const deck = deckState[deckLetter];
    if (!deck) {
        console.error(`Deck ${deckLetter} not found`);
        return;
    }
    
    // Update deck state
    deck.track = track;
    deck.isLoaded = true;
    
    // Update UI
    if (window.updateDeckDisplay) {
        updateDeckDisplay(deckLetter);
    }
    
    console.log(`✅ Track loaded to deck ${deckLetter}`);
}
*/

// Play deck
function playDeck(deckLetter) {
    console.log(`Playing deck ${deckLetter}`);
    
    const deck = deckState[deckLetter];
    if (!deck || !deck.track) {
        console.warn(`Cannot play deck ${deckLetter} - no track loaded`);
        return;
    }
    
    deck.isPlaying = true;
    deck.isPaused = false;
    
    // Update UI
    if (window.updateDeckDisplay) {
        updateDeckDisplay(deckLetter);
    }
}

// Pause deck
function pauseDeck(deckLetter) {
    console.log(`Pausing deck ${deckLetter}`);
    
    const deck = deckState[deckLetter];
    if (!deck) return;
    
    deck.isPlaying = false;
    deck.isPaused = true;
    
    // Update UI
    if (window.updateDeckDisplay) {
        updateDeckDisplay(deckLetter);
    }
}

// Update deck volume
function updateDeckVolume(deckLetter, volume) {
    const deck = deckState[deckLetter];
    if (!deck) return;
    
    deck.volume = Math.max(0, Math.min(1, volume));
    deck.handVolume = deck.volume;
    
    console.log(`Deck ${deckLetter} volume: ${Math.round(deck.volume * 100)}%`);
}


// Toggle audio channel
function toggleAudioChannel(deckLetter, channel) {
    const deck = deckState[deckLetter];
    if (!deck || !deck.audioChannels) return;
    
    const channelObj = deck.audioChannels[channel];
    if (channelObj) {
        channelObj.enabled = !channelObj.enabled;
        console.log(`Deck ${deckLetter} ${channel}: ${channelObj.enabled ? 'ON' : 'OFF'}`);
    }
}

// Play both decks simultaneously
function playBothDecks() {
    console.log('Playing both decks A & B simultaneously');
    
    // Check if both decks have tracks loaded
    const deckA = deckState.A;
    const deckB = deckState.B;
    
    if (!deckA.track && !deckB.track) {
        console.warn('Cannot play both decks - no tracks loaded in either deck');
        if (window.updateStatus) {
            window.updateStatus('Load tracks in both decks first', 'error');
        }
        return;
    }
    
    // Play deck A if it has a track
    if (deckA.track && !deckA.isPlaying) {
        console.log('Starting playback on Deck A');
        playDeck('A');
    }
    
    // Play deck B if it has a track
    if (deckB.track && !deckB.isPlaying) {
        console.log('Starting playback on Deck B');
        playDeck('B');
    }
    
    // Update global state
    if (window.updateGlobalPlaybackState) {
        window.updateGlobalPlaybackState();
    }
    
    console.log('✅ Both decks playing simultaneously');
    
    // Show status message
    if (window.updateStatus) {
        const playingDecks = [];
        if (deckA.track) playingDecks.push('A');
        if (deckB.track) playingDecks.push('B');
        window.updateStatus(`Playing Deck${playingDecks.length > 1 ? 's' : ''} ${playingDecks.join(' & ')} simultaneously`, 'success');
    }
}

// Export functions
// window.loadTrackToDeck = loadTrackToDeck; // Commented out - using multi-channel-audio.js implementation
window.playDeck = playDeck;
window.pauseDeck = pauseDeck;
window.updateDeckVolume = updateDeckVolume;
window.toggleAudioChannel = toggleAudioChannel;
window.playBothDecks = playBothDecks;