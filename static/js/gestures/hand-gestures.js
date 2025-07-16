// static/js/gestures/hand-gestures.js - Multi-Channel Audio Control with Hand Gestures

console.log('🎵 Multi-Channel Hand Gestures Loaded - Professional DJ Control');

// Audio channel control functions for multi-channel audio
function toggleAudioChannel(deckLetter, channelType) {
    const deck = deckState[deckLetter];
    
    // Initialize audio channels if not exists
    if (!deck.audioChannels) {
        deck.audioChannels = {
            bass: { enabled: true, volume: 1.0, solo: false, mute: false },
            drums: { enabled: true, volume: 1.0, solo: false, mute: false },
            synth: { enabled: true, volume: 1.0, solo: false, mute: false }
        };
    }
    
    const channel = deck.audioChannels[channelType];
    if (channel) {
        channel.enabled = !channel.enabled;
        console.log(`🎚️ Deck ${deckLetter} ${channelType} channel: ${channel.enabled ? 'ON' : 'OFF'}`);
        
        // Apply channel settings to audio
        updateAudioChannelSettings(deckLetter);
        
        // Update visual indicators
        updateChannelIndicators(deckLetter);
        
        // Show visual feedback
        showChannelToggleFeedback(deckLetter, channelType, channel.enabled);
    }
}

function toggleAllAudioChannels(deckLetter) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels) return;
    
    // Check if all channels are enabled
    const allEnabled = Object.values(deck.audioChannels).every(ch => ch.enabled);
    
    // Toggle all channels
    Object.keys(deck.audioChannels).forEach(channelType => {
        const channel = deck.audioChannels[channelType];
        channel.enabled = !allEnabled;
    });
    
    console.log(`🎚️ Deck ${deckLetter} all channels: ${!allEnabled ? 'ON' : 'OFF'}`);
    
    // Apply settings and update UI
    updateAudioChannelSettings(deckLetter);
    updateChannelIndicators(deckLetter);
    
    // Show visual feedback
    showChannelToggleFeedback(deckLetter, 'all', !allEnabled);
}

function updateAudioChannelSettings(deckLetter) {
    const deck = deckState[deckLetter];
    if (!deck.audio || !deck.audioChannels) return;
    
    // If using multi-channel player, update individual channel volumes
    if (deck.multiChannelPlayer) {
        Object.keys(deck.audioChannels).forEach(channelType => {
            const channel = deck.audioChannels[channelType];
            const channelVolume = channel.enabled ? channel.volume : 0;
            deck.multiChannelPlayer.setChannelVolume(channelType, channelVolume);
        });
    } else {
        // For single audio element, calculate overall volume based on enabled channels
        const enabledChannels = Object.values(deck.audioChannels).filter(ch => ch.enabled);
        const channelVolume = enabledChannels.length > 0 ? 
            enabledChannels.reduce((sum, ch) => sum + ch.volume, 0) / enabledChannels.length : 0;
        
        // Apply combined volume with hand control
        updateDeckVolume(deckLetter);
    }
}

function updateChannelIndicators(deckLetter) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels) return;
    
    // Update channel status in UI
    const channelMap = {
        bass: 'Bass',
        drums: 'Drums',
        synth: 'Synth'
    };
    
    Object.keys(deck.audioChannels).forEach(channelType => {
        const channel = deck.audioChannels[channelType];
        const channelName = channelMap[channelType];
        const indicator = document.getElementById(`deck${deckLetter}${channelName}Channel`);
        
        if (indicator) {
            const statusElement = indicator.querySelector('.channel-status');
            if (statusElement) {
                // Update active state
                statusElement.classList.toggle('active', channel.enabled);
                
                // Update visual style based on channel state
                if (channel.enabled) {
                    statusElement.style.opacity = '1';
                    statusElement.style.filter = 'none';
                    statusElement.style.transform = 'scale(1)';
                } else {
                    statusElement.style.opacity = '0.3';
                    statusElement.style.filter = 'grayscale(100%)';
                    statusElement.style.transform = 'scale(0.8)';
                }
                
                // Add pulsing effect if channel is being controlled
                if (deck.handControlled && channel.enabled) {
                    statusElement.classList.add('pulsing');
                } else {
                    statusElement.classList.remove('pulsing');
                }
            }
        }
    });
    
    // Update waveform visibility based on channel states
    updateChannelWaveformVisibility(deckLetter);
    
    console.log(`🎚️ Channel indicators updated for Deck ${deckLetter}`);
}

function showChannelToggleFeedback(deckLetter, channelType, enabled) {
    const overlay = document.getElementById(`deck${deckLetter}Overlay`);
    if (!overlay) return;
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'channel-toggle-feedback';
    
    // Set feedback content based on channel type
    let feedbackText = '';
    let feedbackColor = enabled ? '#1ed760' : '#ff6b6b';
    
    switch (channelType) {
        case 'bass':
            feedbackText = `${enabled ? '🔊' : '🔇'} BASS`;
            break;
        case 'drums':
            feedbackText = `${enabled ? '🔊' : '🔇'} DRUMS`;
            break;
        case 'synth':
            feedbackText = `${enabled ? '🔊' : '🔇'} SYNTH`;
            break;
        case 'all':
            feedbackText = `${enabled ? '🔊' : '🔇'} ALL`;
            break;
    }
    
    feedback.textContent = feedbackText;
    feedback.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: ${feedbackColor};
        padding: 15px 25px;
        border-radius: 15px;
        font-size: 1.2rem;
        font-weight: bold;
        font-family: 'Orbitron', monospace;
        z-index: 2000;
        animation: channelToggleFlash 1s ease-out;
        pointer-events: none;
        border: 2px solid ${feedbackColor};
        box-shadow: 0 0 20px ${feedbackColor}40;
    `;
    
    // Add CSS animation if not exists
    if (!document.getElementById('channelToggleStyle')) {
        const style = document.createElement('style');
        style.id = 'channelToggleStyle';
        style.textContent = `
            @keyframes channelToggleFlash {
                0% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.5); 
                }
                20% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1.1); 
                }
                80% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1); 
                }
                100% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(1); 
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    overlay.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 1000);
}

// Global play function for both decks with multi-channel support
function playBothDecks() {
    console.log('🎵 Starting both decks simultaneously with multi-channel audio');
    
    const deckAHasTrack = deckState.A.track && (deckState.A.audio || deckState.A.multiChannelPlayer);
    const deckBHasTrack = deckState.B.track && (deckState.B.audio || deckState.B.multiChannelPlayer);
    
    if (!deckAHasTrack && !deckBHasTrack) {
        updateStatus('No tracks loaded in either deck', 'error');
        return;
    }
    
    // Start both decks
    const promises = [];
    
    if (deckAHasTrack && !deckState.A.isPlaying) {
        promises.push(playDeck('A'));
    }
    
    if (deckBHasTrack && !deckState.B.isPlaying) {
        promises.push(playDeck('B'));
    }
    
    if (promises.length === 0) {
        updateStatus('Both decks already playing', 'info');
        return;
    }
    
    // Update global playback state
    appState.globalPlaybackState = 'playing';
    
    // Update UI
    updateGlobalPlaybackUI();
    
    updateStatus('Both decks playing - Use hand gestures to control multi-channel audio!', 'success');
}

// Global pause function for both decks
function pauseBothDecks() {
    console.log('⏸️ Pausing both decks');
    
    if (deckState.A.isPlaying) pauseDeck('A');
    if (deckState.B.isPlaying) pauseDeck('B');
    
    // Update global playback state
    appState.globalPlaybackState = 'paused';
    
    // Update UI
    updateGlobalPlaybackUI();
    
    updateStatus('Both decks paused', 'info');
}

// Update deck volume with multi-channel support
function updateDeckVolume(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.audio && !deck.multiChannelPlayer) return;
    
    let finalVolume = deck.volume;
    
    // Apply hand volume if hand controlled
    if (deck.handControlled) {
        finalVolume *= deck.handVolume;
    }
    
    // Apply to multi-channel player
    if (deck.multiChannelPlayer && deck.audioChannels) {
        Object.keys(deck.audioChannels).forEach(channelType => {
            const channel = deck.audioChannels[channelType];
            let channelVolume = channel.enabled ? channel.volume * finalVolume : 0;
            
            // Apply mute
            if (channel.mute) channelVolume = 0;
            
            deck.multiChannelPlayer.setChannelVolume(channelType, channelVolume);
        });
    }
    
    // Apply to single audio element
    if (deck.audio) {
        // Calculate overall volume based on enabled channels
        const enabledChannels = deck.audioChannels ? 
            Object.values(deck.audioChannels).filter(ch => ch.enabled) : 
            [{ volume: 1.0 }];
        
        const channelMultiplier = enabledChannels.length > 0 ? 
            enabledChannels.reduce((sum, ch) => sum + ch.volume, 0) / enabledChannels.length : 
            0;
        
        deck.audio.volume = finalVolume * channelMultiplier;
    }
    
    console.log(`🔊 Deck ${deckLetter} volume updated: ${Math.round(finalVolume * 100)}%`);
}

// Update deck volume with mode-specific control
function updateDeckVolumeWithMode(deckLetter, handVolume, mode) {
    const deck = deckState[deckLetter];
    
    if (!deck.audio && !deck.multiChannelPlayer) return;
    
    let baseVolume = deck.volume;
    
    // Apply to multi-channel player
    if (deck.multiChannelPlayer && deck.audioChannels) {
        Object.keys(deck.audioChannels).forEach(channelType => {
            const channel = deck.audioChannels[channelType];
            
            // Apply hand volume only to channels that are active in the current mode
            let channelVolume = 0;
            
            if (mode === 'all' && channel.enabled) {
                // In 'all' mode, hand controls all enabled channels
                channelVolume = channel.volume * baseVolume * handVolume;
            } else if (mode === 'main' && channelType === 'synth' && channel.enabled) {
                // In 'main' mode, hand only controls synth channel
                channelVolume = channel.volume * baseVolume * handVolume;
            } else if (mode === 'bass' && channelType === 'bass' && channel.enabled) {
                // In 'bass' mode, hand only controls bass channel
                channelVolume = channel.volume * baseVolume * handVolume;
            } else if (mode === 'drums' && channelType === 'drums' && channel.enabled) {
                // In 'drums' mode, hand only controls drums channel
                channelVolume = channel.volume * baseVolume * handVolume;
            } else if (channel.enabled) {
                // Other channels maintain their current volume
                channelVolume = channel.volume * baseVolume * deck.lastHandVolume;
            }
            
            deck.multiChannelPlayer.setChannelVolume(channelType, channelVolume);
        });
        
        // Store last hand volume for channels not being controlled
        deck.lastHandVolume = handVolume;
    }
    
    // Apply to single audio element (fallback mode)
    if (deck.audio) {
        deck.audio.volume = baseVolume * handVolume;
    }
    
    console.log(`🔊 Deck ${deckLetter} mode-based volume: ${Math.round(handVolume * 100)}% (Mode: ${mode})`);
}

// Initialize enhanced audio channels for both decks
function initializeAudioChannels() {
    ['A', 'B'].forEach(deckLetter => {
        const deck = deckState[deckLetter];
        deck.audioChannels = {
            bass: { enabled: true, volume: 1.0, solo: false, mute: false },
            drums: { enabled: true, volume: 1.0, solo: false, mute: false },
            synth: { enabled: true, volume: 1.0, solo: false, mute: false }
        };
        
        console.log(`🎚️ Multi-channel audio initialized for Deck ${deckLetter}`);
    });
    
    console.log('✅ Multi-channel audio system ready for both decks');
}

// Channel solo functionality (exclusive play)
function soloChannel(deckLetter, channelType) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels) return;
    
    // Turn off all channels, then turn on the solo channel
    Object.keys(deck.audioChannels).forEach(type => {
        deck.audioChannels[type].enabled = (type === channelType);
        deck.audioChannels[type].solo = (type === channelType);
    });
    
    updateAudioChannelSettings(deckLetter);
    updateChannelIndicators(deckLetter);
    
    updateStatus(`Deck ${deckLetter}: ${channelType} channel solo`, 'info');
    console.log(`🎚️ Deck ${deckLetter} ${channelType} channel solo`);
}

// Channel mute functionality
function muteChannel(deckLetter, channelType) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels || !deck.audioChannels[channelType]) return;
    
    const channel = deck.audioChannels[channelType];
    channel.mute = !channel.mute;
    channel.enabled = !channel.mute; // Mute overrides enabled state
    
    updateAudioChannelSettings(deckLetter);
    updateChannelIndicators(deckLetter);
    
    updateStatus(`Deck ${deckLetter}: ${channelType} channel ${channel.mute ? 'muted' : 'unmuted'}`, 'info');
    console.log(`🎚️ Deck ${deckLetter} ${channelType} channel ${channel.mute ? 'muted' : 'unmuted'}`);
}

// Set individual channel volume
function setChannelVolume(deckLetter, channelType, volume) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels || !deck.audioChannels[channelType]) return;
    
    // Clamp volume between 0 and 1
    volume = Math.max(0, Math.min(1, volume));
    
    deck.audioChannels[channelType].volume = volume;
    
    updateAudioChannelSettings(deckLetter);
    
    console.log(`🎚️ Deck ${deckLetter} ${channelType} volume: ${Math.round(volume * 100)}%`);
}

// Get channel information
function getChannelInfo(deckLetter, channelType) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels || !deck.audioChannels[channelType]) {
        return null;
    }
    
    return {
        enabled: deck.audioChannels[channelType].enabled,
        volume: deck.audioChannels[channelType].volume,
        solo: deck.audioChannels[channelType].solo,
        mute: deck.audioChannels[channelType].mute
    };
}

// Get all channel states for a deck
function getAllChannelStates(deckLetter) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels) return null;
    
    const states = {};
    Object.keys(deck.audioChannels).forEach(channelType => {
        states[channelType] = getChannelInfo(deckLetter, channelType);
    });
    
    return states;
}

// Reset all channels to default state
function resetAllChannels(deckLetter) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels) return;
    
    Object.keys(deck.audioChannels).forEach(channelType => {
        const channel = deck.audioChannels[channelType];
        channel.enabled = true;
        channel.volume = 1.0;
        channel.solo = false;
        channel.mute = false;
    });
    
    updateAudioChannelSettings(deckLetter);
    updateChannelIndicators(deckLetter);
    
    updateStatus(`Deck ${deckLetter}: All channels reset`, 'info');
    console.log(`🔄 Deck ${deckLetter} all channels reset to default`);
}

// Update global playback UI
function updateGlobalPlaybackUI() {
    const globalPlayBtn = document.getElementById('globalPlayBtn');
    const globalPauseBtn = document.getElementById('globalPauseBtn');
    
    if (globalPlayBtn && globalPauseBtn) {
        if (appState.globalPlaybackState === 'playing') {
            globalPlayBtn.style.display = 'none';
            globalPauseBtn.style.display = 'block';
        } else {
            globalPlayBtn.style.display = 'block';
            globalPauseBtn.style.display = 'none';
        }
    }
}

// Update gesture status display with multi-channel info
function updateGestureDisplay(deckLetter, gestures) {
    if (!gestures) return;
    
    // Update gesture indicators if they exist
    const gestureElements = {
        thumbIndex: document.querySelector(`#deck${deckLetter}Overlay .gesture-bass`),
        thumbMiddle: document.querySelector(`#deck${deckLetter}Overlay .gesture-drums`),
        thumbRing: document.querySelector(`#deck${deckLetter}Overlay .gesture-synth`),
        thumbPinky: document.querySelector(`#deck${deckLetter}Overlay .gesture-all`)
    };
    
    Object.keys(gestures).forEach(gestureKey => {
        const element = gestureElements[gestureKey];
        if (element) {
            element.classList.toggle('active', gestures[gestureKey]);
        }
    });
    
    // Log active gestures for debugging
    const activeGestures = Object.keys(gestures).filter(key => gestures[key]);
    if (activeGestures.length > 0) {
        console.log(`🖐️ Deck ${deckLetter} active gestures: ${activeGestures.join(', ')}`);
    }
}

// Initialize the multi-channel audio system
initializeAudioChannels();

console.log('🎛️ Multi-Channel Hand Gesture Control System Loaded!');
console.log('🎚️ Features:');
console.log('  - 👆 Thumb + Index: Bass/Kick channel control');
console.log('  - 🖕 Thumb + Middle: Drums/Percussion channel control'); 
console.log('  - 💍 Thumb + Ring: Synth/Melody channel control');
console.log('  - 🤙 Thumb + Pinky: All channels control');
console.log('  - 🖐️ Hand height: Volume control');
console.log('✅ Professional DJ multi-channel system ready!');