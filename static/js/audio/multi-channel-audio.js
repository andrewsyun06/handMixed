// Multi-Channel Audio Manager with Source Separation
console.log('🎵 Multi-Channel Audio Manager Loading...');

// Audio context and nodes
let audioContext = null;
let masterGainNode = null;

// Initialize audio context
async function initializeAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioContext.createGain();
        masterGainNode.gain.value = 0.8; // Set master volume
        masterGainNode.connect(audioContext.destination);
        
        // Resume context if suspended (browser policy)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        console.log('✅ Audio context initialized, state:', audioContext.state);
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize audio context:', error);
        return false;
    }
}

// Deck audio players
const deckPlayers = {
    A: {
        audio: null,
        source: null,
        gainNode: null,
        channels: {
            bass: { gainNode: null, enabled: true },
            drums: { gainNode: null, enabled: true },
            synth: { gainNode: null, enabled: true }
        },
        isPlaying: false,
        volume: 0.7
    },
    B: {
        audio: null,
        source: null,
        gainNode: null,
        channels: {
            bass: { gainNode: null, enabled: true },
            drums: { gainNode: null, enabled: true },
            synth: { gainNode: null, enabled: true }
        },
        isPlaying: false,
        volume: 0.7
    }
};

// Load track to deck with multi-channel setup
async function loadTrackToDeck(track, deckLetter) {
    console.log(`🎵 Loading track to Deck ${deckLetter}:`, track.title);
    
    try {
        if (!audioContext) {
            await initializeAudioContext();
        }
        
        const deck = deckPlayers[deckLetter];
        
        // Stop current track if playing
        if (deck.isPlaying) {
            stopDeck(deckLetter);
        }
        
        // Create audio element
        deck.audio = new Audio();
        deck.audio.crossOrigin = 'anonymous';
        
        // Try to get a working audio URL or generate audio
        let audioUrl = null;
        let useGeneratedAudio = false;
        
        // Try all available audio URLs (including Audius)
        if (track.stream_url) {
            audioUrl = track.stream_url;
            console.log('🎵 Using stream_url:', audioUrl);
        } else if (track.preview_url) {
            audioUrl = track.preview_url;
            console.log('🎵 Using preview_url:', audioUrl);
        } else if (track.track_segments && track.track_segments.length > 0) {
            // Some Audius tracks have segments
            audioUrl = track.track_segments[0].multihash;
            console.log('🎵 Using track segment:', audioUrl);
        } else {
            // Generate audio as fallback
            console.log('🎵 No valid audio URL found, using generated audio for testing');
            useGeneratedAudio = true;
        }
        
        if (useGeneratedAudio) {
            // Skip audio element setup and go directly to generated audio
            console.log(`🎵 Loading generated audio for Deck ${deckLetter}`);
            loadGeneratedAudioTrack(deck, deckLetter, track);
        } else {
            if (!audioUrl) {
                throw new Error('No audio URL available for track');
            }
            
            deck.audio.src = audioUrl;
            
            // Set basic properties for direct playback
            deck.audio.preload = 'auto';
            deck.audio.volume = 0.7;
            
            // Update track display immediately when track is assigned
            console.log(`📋 Updating track display immediately for Deck ${deckLetter}`);
            try {
                updateTrackDisplay(deckLetter, track);
            } catch (error) {
                console.error('Initial updateTrackDisplay failed:', error);
                // Try direct update as fallback
                if (window.updateTrackDisplayDirect) {
                    window.updateTrackDisplayDirect(deckLetter, track);
                }
            }
            
            // Dispatch trackLoaded event immediately
            const immediateEvent = new CustomEvent('trackLoaded', { 
                detail: { deck: deckLetter, track: track } 
            });
            window.dispatchEvent(immediateEvent);
            
            // Set up audio nodes when audio loads
            deck.audio.addEventListener('canplaythrough', () => {
                console.log(`✅ Track loaded to Deck ${deckLetter} - Ready for direct playback`);
                
                // Update track display again to ensure it's visible
                try {
                    updateTrackDisplay(deckLetter, track);
                } catch (error) {
                    console.warn('updateTrackDisplay in canplaythrough failed:', error);
                    // Try direct update
                    if (window.updateTrackDisplayDirect) {
                        window.updateTrackDisplayDirect(deckLetter, track);
                    }
                }
                
                // Set up complex audio routing (but don't require it for basic playback)
                try {
                    setupDeckAudioNodes(deckLetter);
                } catch (error) {
                    console.warn(`Complex audio setup failed for Deck ${deckLetter}, but basic playback available:`, error);
                }
                
                // Initialize waveform visualizers
                if (typeof initializeWaveformVisualizers === 'function') {
                    initializeWaveformVisualizers(deckLetter);
                }
            });
            
            deck.audio.addEventListener('error', (e) => {
                console.error(`❌ Error loading track to Deck ${deckLetter}:`, e);
                console.error('Audio error details:', {
                    error: e.target.error,
                    networkState: e.target.networkState,
                    readyState: e.target.readyState,
                    src: e.target.src
                });
                
                // Try alternative URLs if available
                if (track.preview_url && track.preview_url !== audioUrl) {
                    console.log(`🔄 Trying preview_url for Deck ${deckLetter}`);
                    deck.audio.src = track.preview_url;
                    deck.audio.load();
                } else {
                    // Fall back to generated audio
                    console.log(`🔄 Falling back to generated audio for Deck ${deckLetter}`);
                    loadGeneratedAudioTrack(deck, deckLetter, track);
                }
            });
            
            // Load the audio
            deck.audio.load();
        }
        
        // Update deck state
        if (typeof deckState !== 'undefined') {
            deckState[deckLetter].track = track;
            deckState[deckLetter].isLoaded = true;
            console.log(`✅ Updated deckState for Deck ${deckLetter}`);
        } else {
            console.warn('deckState not available, track loaded only in deckPlayers');
        }
        
    } catch (error) {
        console.error(`❌ Failed to load track to Deck ${deckLetter}:`, error);
        showAudioError(deckLetter, error.message);
    }
}

// Load generated audio track as fallback
function loadGeneratedAudioTrack(deck, deckLetter, track) {
    console.log(`🎵 Loading generated audio for Deck ${deckLetter}`);
    
    try {
        if (!audioContext) {
            throw new Error('Audio context not available');
        }
        
        // Create a buffer with generated audio (sine wave)
        const bufferLength = audioContext.sampleRate * 30; // 30 seconds
        const buffer = audioContext.createBuffer(2, bufferLength, audioContext.sampleRate);
        
        // Generate audio data (simple chord progression)
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            const frequency = deckLetter === 'A' ? 220 : 330; // Different frequencies for A and B
            
            for (let i = 0; i < bufferLength; i++) {
                // Generate a simple melody with bass, mid, and high components
                const time = i / audioContext.sampleRate;
                const bass = Math.sin(2 * Math.PI * (frequency / 4) * time) * 0.3;
                const mid = Math.sin(2 * Math.PI * frequency * time) * 0.2;
                const high = Math.sin(2 * Math.PI * (frequency * 2) * time) * 0.1;
                
                data[i] = bass + mid + high;
                
                // Add some rhythm
                if (Math.floor(time * 2) % 2 === 0) {
                    data[i] *= 0.7;
                }
            }
        }
        
        // Create a buffer source
        deck.bufferSource = audioContext.createBufferSource();
        deck.bufferSource.buffer = buffer;
        deck.bufferSource.loop = true;
        
        // Set up the audio nodes
        setupDeckAudioNodesFromBuffer(deckLetter, deck.bufferSource);
        
        // Initialize waveform visualizers
        if (typeof initializeWaveformVisualizers === 'function') {
            initializeWaveformVisualizers(deckLetter);
        }
        
        // Update UI
        updateTrackDisplay(deckLetter, track);
        
        // Update deck state
        if (typeof deckState !== 'undefined') {
            deckState[deckLetter].track = track;
            deckState[deckLetter].isLoaded = true;
            console.log(`✅ Updated deckState for Deck ${deckLetter} (generated audio)`);
        }
        
        console.log(`✅ Generated audio loaded for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Failed to generate audio for Deck ${deckLetter}:`, error);
        showAudioError(deckLetter, 'Failed to generate audio');
    }
}

// Set up audio nodes from buffer source
function setupDeckAudioNodesFromBuffer(deckLetter, bufferSource) {
    const deck = deckPlayers[deckLetter];
    
    try {
        // Create main gain node for the deck
        deck.gainNode = audioContext.createGain();
        deck.gainNode.gain.value = deck.volume;
        
        // Set up channel separation with buffer source
        setupChannelSeparationFromBuffer(deck, bufferSource);
        
        // Store the buffer source
        deck.source = bufferSource;
        
        console.log(`🔊 Audio nodes set up from buffer for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Failed to setup audio nodes from buffer for Deck ${deckLetter}:`, error);
    }
}

// Set up channel separation from buffer source
function setupChannelSeparationFromBuffer(deck, bufferSource) {
    try {
        // Create filters for each channel
        const bassFilter = audioContext.createBiquadFilter();
        const drumsFilter = audioContext.createBiquadFilter();
        const synthFilter = audioContext.createBiquadFilter();
        
        // Configure filters (same as before)
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 250;
        bassFilter.Q.value = 1;
        
        drumsFilter.type = 'bandpass';
        drumsFilter.frequency.value = 2000;
        drumsFilter.Q.value = 0.5;
        
        synthFilter.type = 'highpass';
        synthFilter.frequency.value = 800;
        synthFilter.Q.value = 1;
        
        // Create gain nodes for each channel
        deck.channels.bass.gainNode = audioContext.createGain();
        deck.channels.drums.gainNode = audioContext.createGain();
        deck.channels.synth.gainNode = audioContext.createGain();
        
        // Set initial gain values
        deck.channels.bass.gainNode.gain.value = deck.channels.bass.enabled ? 0.8 : 0;
        deck.channels.drums.gainNode.gain.value = deck.channels.drums.enabled ? 0.6 : 0;
        deck.channels.synth.gainNode.gain.value = deck.channels.synth.enabled ? 0.7 : 0;
        
        // Connect the audio graph
        bufferSource.connect(bassFilter);
        bufferSource.connect(drumsFilter);
        bufferSource.connect(synthFilter);
        
        bassFilter.connect(deck.channels.bass.gainNode);
        drumsFilter.connect(deck.channels.drums.gainNode);
        synthFilter.connect(deck.channels.synth.gainNode);
        
        deck.channels.bass.gainNode.connect(deck.gainNode);
        deck.channels.drums.gainNode.connect(deck.gainNode);
        deck.channels.synth.gainNode.connect(deck.gainNode);
        
        deck.gainNode.connect(masterGainNode);
        
        // Store filter references
        deck.filters = {
            bass: bassFilter,
            drums: drumsFilter,
            synth: synthFilter
        };
        
        console.log(`🎛️ Channel separation configured from buffer`);
        
    } catch (error) {
        console.error(`❌ Failed to setup channel separation from buffer:`, error);
        // Fallback to simple connection
        bufferSource.connect(deck.gainNode);
        deck.gainNode.connect(masterGainNode);
    }
}

// Set up audio nodes for a deck with channel separation
function setupDeckAudioNodes(deckLetter) {
    const deck = deckPlayers[deckLetter];
    
    try {
        // Create source node
        deck.source = audioContext.createMediaElementSource(deck.audio);
        
        // Create main gain node for the deck
        deck.gainNode = audioContext.createGain();
        deck.gainNode.gain.value = deck.volume;
        
        // Create channel separation using filters
        setupChannelSeparation(deck, deckLetter);
        
        console.log(`🔊 Audio nodes with channel separation set up for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Failed to setup audio nodes for Deck ${deckLetter}:`, error);
    }
}

// Set up channel separation using Web Audio API filters
function setupChannelSeparation(deck, deckLetter) {
    try {
        // Create filters for each channel
        const bassFilter = audioContext.createBiquadFilter();
        const drumsFilter = audioContext.createBiquadFilter();
        const synthFilter = audioContext.createBiquadFilter();
        
        // Configure bass filter (low-pass for bass frequencies)
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 250; // Bass frequencies (20-250 Hz)
        bassFilter.Q.value = 1;
        
        // Configure drums filter (band-pass for mid frequencies)
        drumsFilter.type = 'bandpass';
        drumsFilter.frequency.value = 2000; // Drum frequencies (200-5000 Hz)
        drumsFilter.Q.value = 0.5;
        
        // Configure synth filter (high-pass for high frequencies)
        synthFilter.type = 'highpass';
        synthFilter.frequency.value = 800; // Synth frequencies (800+ Hz)
        synthFilter.Q.value = 1;
        
        // Create gain nodes for each channel
        deck.channels.bass.gainNode = audioContext.createGain();
        deck.channels.drums.gainNode = audioContext.createGain();
        deck.channels.synth.gainNode = audioContext.createGain();
        
        // Set initial gain values based on enabled state
        deck.channels.bass.gainNode.gain.value = deck.channels.bass.enabled ? 0.8 : 0;
        deck.channels.drums.gainNode.gain.value = deck.channels.drums.enabled ? 0.6 : 0;
        deck.channels.synth.gainNode.gain.value = deck.channels.synth.enabled ? 0.7 : 0;
        
        // Connect the audio graph:
        // Source -> Filters -> Channel Gains -> Main Gain -> Master
        deck.source.connect(bassFilter);
        deck.source.connect(drumsFilter);
        deck.source.connect(synthFilter);
        
        bassFilter.connect(deck.channels.bass.gainNode);
        drumsFilter.connect(deck.channels.drums.gainNode);
        synthFilter.connect(deck.channels.synth.gainNode);
        
        deck.channels.bass.gainNode.connect(deck.gainNode);
        deck.channels.drums.gainNode.connect(deck.gainNode);
        deck.channels.synth.gainNode.connect(deck.gainNode);
        
        deck.gainNode.connect(masterGainNode);
        
        // Store filter references for future use
        deck.filters = {
            bass: bassFilter,
            drums: drumsFilter,
            synth: synthFilter
        };
        
        console.log(`🎛️ Channel separation configured for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Failed to setup channel separation for Deck ${deckLetter}:`, error);
        // Fallback to simple connection
        deck.source.connect(deck.gainNode);
        deck.gainNode.connect(masterGainNode);
    }
}

// Play deck
function playDeck(deckLetter) {
    console.log(`🎵 Attempting to play Deck ${deckLetter}`);
    const deck = deckPlayers[deckLetter];
    
    console.log(`Deck ${deckLetter} status:`, {
        hasAudio: !!deck.audio,
        hasBufferSource: !!deck.bufferSource,
        isPlaying: deck.isPlaying,
        audioSrc: deck.audio?.src,
        audioContext: audioContext?.state
    });
    
    if (!deck.audio && !deck.bufferSource) {
        console.warn(`Cannot play Deck ${deckLetter} - no track loaded`);
        showAudioError(deckLetter, 'No track loaded');
        return;
    }
    
    try {
        // Resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') {
            console.log('Resuming audio context...');
            audioContext.resume().then(() => {
                console.log('Audio context resumed, trying playback...');
                attemptPlayback(deck, deckLetter);
            });
        } else {
            attemptPlayback(deck, deckLetter);
        }
        
    } catch (error) {
        console.error(`❌ Failed to play Deck ${deckLetter}:`, error);
        showAudioError(deckLetter, 'Failed to play track');
    }
}

// Attempt actual playback
function attemptPlayback(deck, deckLetter) {
    console.log(`Attempting playback for Deck ${deckLetter}...`);
    
    if (deck.audio) {
        console.log('Playing audio element...');
        console.log(`Audio ready state: ${deck.audio.readyState}, duration: ${deck.audio.duration}`);
        
        // Check if audio is ready to play
        if (deck.audio.readyState >= 3) { // HAVE_FUTURE_DATA or higher
            deck.audio.play().then(() => {
                console.log(`✅ Audio element playing for Deck ${deckLetter}`);
                deck.isPlaying = true;
                updateDeckPlaybackState(deckLetter, true);
            }).catch(error => {
                console.error(`❌ Audio element play failed for Deck ${deckLetter}:`, error);
                console.error('Play error details:', error);
                showAudioError(deckLetter, 'Audio playback failed: ' + error.message);
            });
        } else {
            console.log(`Audio not ready yet for Deck ${deckLetter}, waiting for load...`);
            deck.audio.addEventListener('canplay', () => {
                console.log(`Audio now ready for Deck ${deckLetter}, attempting play...`);
                deck.audio.play().then(() => {
                    console.log(`✅ Audio element playing for Deck ${deckLetter} (after wait)`);
                    deck.isPlaying = true;
                    updateDeckPlaybackState(deckLetter, true);
                }).catch(error => {
                    console.error(`❌ Audio element play failed for Deck ${deckLetter} (after wait):`, error);
                    showAudioError(deckLetter, 'Audio playback failed: ' + error.message);
                });
            }, { once: true });
        }
    } else if (deck.bufferSource && !deck.isPlaying) {
        console.log('Starting buffer source...');
        try {
            deck.bufferSource.start(0);
            deck.startTime = Date.now(); // Record start time for progress tracking
            console.log(`✅ Buffer source started for Deck ${deckLetter}`);
            deck.isPlaying = true;
            updateDeckPlaybackState(deckLetter, true);
        } catch (error) {
            console.error(`❌ Buffer source start failed for Deck ${deckLetter}:`, error);
            // Try to recreate the buffer source
            recreateBufferSource(deckLetter);
        }
    } else {
        console.warn(`No valid audio source for Deck ${deckLetter}`);
    }
}

// Update deck playback state
function updateDeckPlaybackState(deckLetter, isPlaying) {
    const deck = deckPlayers[deckLetter];
    deck.isPlaying = isPlaying;
    
    // Update deck state
    deckState[deckLetter].isPlaying = isPlaying;
    deckState[deckLetter].isPaused = !isPlaying;
    
    console.log(`▶️ Deck ${deckLetter} playback state updated:`, isPlaying);
    updatePlaybackUI();
    
    // Update waveform visualization
    if (typeof updateWaveformForDeck === 'function') {
        updateWaveformForDeck(deckLetter, isPlaying);
    }
}

// Recreate buffer source (needed since buffer sources can only be started once)
function recreateBufferSource(deckLetter) {
    console.log(`Recreating buffer source for Deck ${deckLetter}`);
    const deck = deckPlayers[deckLetter];
    
    if (deck.bufferSource && deck.bufferSource.buffer) {
        // Store the original buffer
        const originalBuffer = deck.bufferSource.buffer;
        
        // Create new buffer source
        deck.bufferSource = audioContext.createBufferSource();
        deck.bufferSource.buffer = originalBuffer;
        deck.bufferSource.loop = true;
        
        // Reconnect to the audio graph
        setupChannelSeparationFromBuffer(deck, deck.bufferSource);
        
        // Try to start again
        try {
            deck.bufferSource.start(0);
            deck.isPlaying = true;
            updateDeckPlaybackState(deckLetter, true);
            console.log(`✅ Recreated buffer source started for Deck ${deckLetter}`);
        } catch (error) {
            console.error(`❌ Failed to start recreated buffer source for Deck ${deckLetter}:`, error);
        }
    }
}

// Pause deck
function pauseDeck(deckLetter) {
    const deck = deckPlayers[deckLetter];
    
    if (!deck.audio) return;
    
    try {
        deck.audio.pause();
        deck.isPlaying = false;
        
        // Update deck state
        deckState[deckLetter].isPlaying = false;
        deckState[deckLetter].isPaused = true;
        
        console.log(`⏸️ Paused Deck ${deckLetter}`);
        updatePlaybackUI();
        
    } catch (error) {
        console.error(`❌ Failed to pause Deck ${deckLetter}:`, error);
    }
}

// Stop deck
function stopDeck(deckLetter) {
    const deck = deckPlayers[deckLetter];
    
    if (!deck.audio) return;
    
    try {
        deck.audio.pause();
        deck.audio.currentTime = 0;
        deck.isPlaying = false;
        
        // Update deck state
        deckState[deckLetter].isPlaying = false;
        deckState[deckLetter].isPaused = false;
        
        console.log(`⏹️ Stopped Deck ${deckLetter}`);
        updatePlaybackUI();
        
    } catch (error) {
        console.error(`❌ Failed to stop Deck ${deckLetter}:`, error);
    }
}

// Play both decks simultaneously
function playBothDecksSync() {
    console.log('▶️ Playing both decks...');
    
    const deckA = deckPlayers.A;
    const deckB = deckPlayers.B;
    
    console.log('Deck A status:', {
        hasAudio: !!deckA.audio,
        hasBufferSource: !!deckA.bufferSource,
        isPlaying: deckA.isPlaying,
        gainNode: !!deckA.gainNode,
        audioSrc: deckA.audio?.src,
        audioReadyState: deckA.audio?.readyState,
        audioDuration: deckA.audio?.duration
    });
    
    console.log('Deck B status:', {
        hasAudio: !!deckB.audio,
        hasBufferSource: !!deckB.bufferSource,
        isPlaying: deckB.isPlaying,
        gainNode: !!deckB.gainNode,
        audioSrc: deckB.audio?.src,
        audioReadyState: deckB.audio?.readyState,
        audioDuration: deckB.audio?.duration
    });
    
    // Check if at least one deck has audio or buffer source
    const deckAReady = deckA.audio || deckA.bufferSource;
    const deckBReady = deckB.audio || deckB.bufferSource;
    
    if (!deckAReady && !deckBReady) {
        showNotification('Please load tracks in both decks first', 'warning');
        return;
    } else if (!deckAReady) {
        showNotification('Please load a track in Deck A first', 'warning');
        return;
    } else if (!deckBReady) {
        showNotification('Please load a track in Deck B first', 'warning');
        return;
    }
    
    try {
        // Initialize audio context if needed
        if (!audioContext) {
            initializeAudioContext().then(() => {
                playBothDecksSync(); // Retry after initialization
            });
            return;
        }
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            console.log('Resuming audio context...');
            audioContext.resume().then(() => {
                playBothDecksActual();
            });
        } else {
            playBothDecksActual();
        }
        
    } catch (error) {
        console.error('❌ Failed to play both decks:', error);
        showNotification('Failed to play both decks: ' + error.message, 'error');
    }
}

// Actual playback function after audio context is ready
function playBothDecksActual() {
    console.log('Starting actual playback...');
    
    const deckA = deckPlayers.A;
    const deckB = deckPlayers.B;
    
    let playbackStarted = false;
    
    // Play Deck A
    if (deckA.audio || deckA.bufferSource) {
        try {
            playDeck('A');
            playbackStarted = true;
            console.log('✅ Deck A started');
        } catch (error) {
            console.error('❌ Failed to start Deck A:', error);
        }
    }
    
    // Play Deck B
    if (deckB.audio || deckB.bufferSource) {
        try {
            playDeck('B');
            playbackStarted = true;
            console.log('✅ Deck B started');
        } catch (error) {
            console.error('❌ Failed to start Deck B:', error);
        }
    }
    
    if (playbackStarted) {
        console.log('✅ Both decks playing');
        showNotification('Both decks playing', 'success');
        updatePlaybackUI();
        
        // Start progress tracking for both decks
        if (typeof startProgressTracking === 'function') {
            startProgressTracking('A');
            startProgressTracking('B');
        }
    } else {
        console.warn('❌ No decks could be started');
        showNotification('Failed to start playback', 'error');
    }
}

// Update deck volume
function updateDeckVolume(deckLetter, value) {
    const volume = parseInt(value) / 100;
    const deck = deckPlayers[deckLetter];
    
    deck.volume = volume;
    
    // Update audio gain if available
    if (deck.gainNode) {
        deck.gainNode.gain.value = volume;
    }
    
    // Update UI
    document.getElementById(`volumeLabel${deckLetter}`).textContent = value;
    
    // Update deck state
    deckState[deckLetter].volume = volume;
    deckState[deckLetter].handVolume = volume;
    
    console.log(`🔊 Deck ${deckLetter} volume: ${value}%`);
}

// Toggle channel (BASS, DRUMS, SYNTH)
function toggleChannel(deckLetter, channel) {
    const deck = deckPlayers[deckLetter];
    const channelState = deck.channels[channel];
    
    // Toggle enabled state
    channelState.enabled = !channelState.enabled;
    
    // Update gain node with smooth transition
    if (channelState.gainNode) {
        const targetGain = channelState.enabled ? getChannelDefaultGain(channel) : 0;
        
        // Smooth fade in/out over 100ms
        channelState.gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        channelState.gainNode.gain.setTargetAtTime(
            targetGain, 
            audioContext.currentTime, 
            0.05 // Time constant for smooth transition
        );
    }
    
    console.log(`🎚️ Deck ${deckLetter} ${channel}: ${channelState.enabled ? 'ON' : 'OFF'}`);
    
    // Update UI
    updateChannelButtonUI(deckLetter, channel, channelState.enabled);
    
    // Update deck state
    if (deckState[deckLetter] && deckState[deckLetter].audioChannels) {
        deckState[deckLetter].audioChannels[channel].enabled = channelState.enabled;
    }
    
    // Show visual feedback
    showChannelToggleFeedback(deckLetter, channel, channelState.enabled);
}

// Get default gain for each channel type
function getChannelDefaultGain(channel) {
    const gains = {
        bass: 0.8,   // Bass channels are usually prominent
        drums: 0.6,  // Drums at moderate level
        synth: 0.7   // Synth/melody at good level
    };
    return gains[channel] || 0.7;
}

// Show visual feedback for channel toggle
function showChannelToggleFeedback(deckLetter, channel, enabled) {
    const deckPanel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    if (!deckPanel) return;
    
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.className = 'channel-feedback';
    feedback.textContent = `${channel.toUpperCase()}: ${enabled ? 'ON' : 'OFF'}`;
    feedback.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${enabled ? '#00ff88' : '#ff0080'};
        color: ${enabled ? '#000' : '#fff'};
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        z-index: 1000;
        pointer-events: none;
        animation: channelFeedbackFade 1s ease-out forwards;
    `;
    
    // Add CSS animation if not exists
    if (!document.getElementById('channelFeedbackStyle')) {
        const style = document.createElement('style');
        style.id = 'channelFeedbackStyle';
        style.textContent = `
            @keyframes channelFeedbackFade {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }
    
    deckPanel.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 1000);
}

// Update channel button UI
function updateChannelButtonUI(deckLetter, channel, enabled) {
    const deckPanel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    const channelBtn = deckPanel.querySelector(`[data-channel="${channel}"]`);
    
    if (channelBtn) {
        if (enabled) {
            channelBtn.classList.add('active');
        } else {
            channelBtn.classList.remove('active');
        }
    }
}

// Update track display
function updateTrackDisplay(deckLetter, track) {
    console.log(`🎨 updateTrackDisplay called for Deck ${deckLetter}`, track);
    const trackDisplay = document.getElementById(`trackDisplay${deckLetter}`);
    if (!trackDisplay) {
        console.error(`❌ trackDisplay${deckLetter} element not found!`);
        return;
    }
    
    console.log(`✅ Found trackDisplay element for Deck ${deckLetter}`);
    
    // Get album cover URL from various Audius track formats
    let albumCoverUrl = null;
    
    // Try multiple artwork formats from Audius
    if (track.artwork) {
        if (typeof track.artwork === 'string') {
            albumCoverUrl = track.artwork;
        } else if (typeof track.artwork === 'object') {
            albumCoverUrl = track.artwork['1000x1000'] || 
                           track.artwork['480x480'] || 
                           track.artwork['150x150'] || 
                           track.artwork['thumbnail'] || 
                           track.artwork['small'] || 
                           track.artwork['medium'] || 
                           track.artwork['large'];
        }
    }
    
    // Fallback to user avatar or other sources
    if (!albumCoverUrl) {
        albumCoverUrl = track.cover_art || 
                       track.cover_art_sizes?.['1000x1000'] ||
                       track.cover_art_sizes?.['480x480'] ||
                       track.user?.profile_picture?.['1000x1000'] ||
                       track.user?.profile_picture?.['480x480'] ||
                       track.user?.profile_picture?.['150x150'] ||
                       track.user?.avatar_url;
    }
    
    // Final fallback to music note SVG
    if (!albumCoverUrl) {
        albumCoverUrl = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="#333"/><text x="25" y="30" text-anchor="middle" fill="#fff" font-size="12">♪</text></svg>');
    }
    
    console.log(`Album cover URL for Deck ${deckLetter}:`, albumCoverUrl);
    
    const htmlContent = `
        <div class="track-loaded">
            <div class="track-art">
                <img src="${albumCoverUrl}" alt="Album Cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="track-art-fallback" style="display: none;">♪</div>
            </div>
            <div class="track-info">
                <div class="track-name">${track.title || 'Unknown'}</div>
                <div class="track-artist">${track.user?.username || track.artist || 'Unknown Artist'}</div>
            </div>
        </div>
    `;
    
    console.log(`📝 Setting innerHTML for Deck ${deckLetter}`);
    trackDisplay.innerHTML = htmlContent;
    console.log(`✅ Track display updated successfully for Deck ${deckLetter}`);
    
    // Force a reflow to ensure the DOM updates
    trackDisplay.offsetHeight;
    
    // Verify the content was actually set
    const actualContent = trackDisplay.innerHTML;
    if (actualContent.includes('track-loaded')) {
        console.log(`✅ Verified: HTML content includes 'track-loaded' class for Deck ${deckLetter}`);
    } else {
        console.error(`❌ ERROR: HTML content does NOT include 'track-loaded' class for Deck ${deckLetter}`);
        console.log('Actual content:', actualContent);
    }
    
    // Update BPM if available
    const bpmDisplay = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'} .bpm-display`);
    if (bpmDisplay && track.bpm) {
        bpmDisplay.textContent = `${track.bpm} BPM`;
    }
    
    // Initialize main waveform
    if (typeof initializeMainWaveform === 'function') {
        setTimeout(() => {
            initializeMainWaveform(deckLetter);
        }, 100);
    }
}

// Update playback UI
function updatePlaybackUI() {
    // This function can be expanded to update play/pause button states
    // For now, we'll just log the status
    const deckAPlaying = deckPlayers.A.isPlaying;
    const deckBPlaying = deckPlayers.B.isPlaying;
    
    console.log(`🎛️ Playback status - Deck A: ${deckAPlaying ? 'Playing' : 'Stopped'}, Deck B: ${deckBPlaying ? 'Playing' : 'Stopped'}`);
}

// Show audio error
function showAudioError(deckLetter, message) {
    console.error(`🚫 Audio error for Deck ${deckLetter}: ${message}`);
    if (typeof showStudioNotification === 'function') {
        showStudioNotification(`Deck ${deckLetter}: ${message}`, 'error');
    }
}

// Show notification helper
function showNotification(message, type = 'info') {
    if (typeof showStudioNotification === 'function') {
        showStudioNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    initializeAudioContext();
    
    // Set up channel button listeners
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const channel = this.dataset.channel;
            const deckLetter = this.closest('.deck-overlay-panel').classList.contains('left') ? 'A' : 'B';
            
            toggleChannel(deckLetter, channel);
        });
    });
    
    console.log('🎵 Multi-Channel Audio Manager Ready');
});

// Export functions to global scope
window.loadTrackToDeck = loadTrackToDeck;
window.playDeck = playDeck;
window.pauseDeck = pauseDeck;
window.stopDeck = stopDeck;
window.playBothDecksSync = playBothDecksSync;
window.updateDeckVolume = updateDeckVolume;
window.toggleChannel = toggleChannel;
window.initializeAudioContext = initializeAudioContext;
window.updateTrackDisplay = updateTrackDisplay;

// Export audio context for debugging
Object.defineProperty(window, 'audioContext', {
    get: function() { return audioContext; }
});

// Export deck players for debugging and global access
window.deckPlayers = deckPlayers;

// Debug function to test track display
window.debugTrackDisplay = function(deckLetter) {
    const trackDisplay = document.getElementById(`trackDisplay${deckLetter}`);
    console.log(`=== Debug Track Display for Deck ${deckLetter} ===`);
    console.log('Element exists:', !!trackDisplay);
    if (trackDisplay) {
        console.log('Current innerHTML:', trackDisplay.innerHTML);
        console.log('Has .no-track:', trackDisplay.querySelector('.no-track') !== null);
        console.log('Has .track-loaded:', trackDisplay.querySelector('.track-loaded') !== null);
        console.log('Computed display:', window.getComputedStyle(trackDisplay).display);
        console.log('Computed visibility:', window.getComputedStyle(trackDisplay).visibility);
        console.log('Parent element:', trackDisplay.parentElement);
        console.log('Parent display:', window.getComputedStyle(trackDisplay.parentElement).display);
    }
    console.log('Deck state:', deckState[deckLetter]);
    console.log('Deck player:', deckPlayers[deckLetter]);
};

// Test function to manually update track display
window.testTrackDisplay = function(deckLetter) {
    const testTrack = {
        title: 'Test Track',
        artist: 'Test Artist',
        user: { username: 'Test User' },
        artwork: {
            '480x480': 'https://via.placeholder.com/480x480/00d4ff/ffffff?text=TEST'
        }
    };
    console.log('Testing track display update...');
    updateTrackDisplay(deckLetter, testTrack);
};