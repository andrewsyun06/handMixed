// static/js/audio/deck-manager.js - Professional Multi-Channel Deck Management

console.log('🎛️ Professional Multi-Channel Deck Manager Loading...');

// Select deck for loading
function selectDeck(deckLetter) {
    appState.selectedDeck = deckLetter;
    updateStatus(`Deck ${deckLetter} selected - choose a track to load`, 'info');
    
    // Visual feedback
    document.querySelectorAll('.deck-track-display').forEach(display => {
        display.style.borderColor = '';
        display.style.background = '';
    });
    
    const selectedDisplay = document.getElementById(`deck${deckLetter}TrackDisplay`);
    if (selectedDisplay) {
        selectedDisplay.style.borderColor = '#1ed760';
        selectedDisplay.style.background = 'linear-gradient(135deg, rgba(30, 215, 96, 0.4), rgba(0, 212, 255, 0.4))';
    }
}

// Load track to selected deck with professional multi-channel processing
// COMMENTED OUT - This conflicts with the main loadTrackToDeck in multi-channel-audio.js
// This version has a different signature (trackIndex vs track, deckLetter) and calls undefined updateStatus
/*
async function loadTrackToDeck(trackIndex) {
    if (!appState.selectedDeck) {
        updateStatus('Please select a deck first (click on a deck display)', 'error');
        return;
    }

    if (trackIndex < 0 || trackIndex >= appState.currentTracks.length) {
        updateStatus('Invalid track selection', 'error');
        return;
    }

    const track = appState.currentTracks[trackIndex];
    const deckLetter = appState.selectedDeck;
    const deck = deckState[deckLetter];

    console.log(`🎵 Loading track to Deck ${deckLetter}:`, track.title);
    console.log(`🎵 Track BPM from Audius: ${track.bpm || 'Not available'}`);
    updateStatus(`Loading "${track.title}" to Deck ${deckLetter}...`, 'info');

    try {
        // Stop current track if playing
        if (deck.isPlaying) {
            stopDeck(deckLetter);
        }

        // Clean up previous track
        cleanupDeckTrack(deckLetter);

        // Store track info
        deck.track = track;

        // Set BPM immediately from Audius metadata
        if (track.bpm && track.bpm > 0) {
            deck.bpm = track.bpm;
            updateDeckBPM(deckLetter, `${track.bpm} BPM`);
            console.log(`✅ BPM set from Audius metadata: ${track.bpm} BPM`);
        } else {
            const fallbackBPM = getFallbackBPM(track.genre);
            deck.bpm = fallbackBPM;
            updateDeckBPM(deckLetter, `~${fallbackBPM} BPM`);
            console.log(`⚠️ Using fallback BPM: ${fallbackBPM} BPM (Genre: ${track.genre || 'Unknown'})`);
        }

        // Initialize professional audio channels
        initializeDeckAudioChannels(deckLetter);

        // Create HTML5 Audio element for initial loading
        deck.audio = new Audio();
        deck.audio.crossOrigin = 'anonymous';
        deck.audio.preload = 'auto';
        
        // Set up loading timeout
        const loadTimeout = setTimeout(() => {
            if (deck.audio && deck.audio.readyState === 0) {
                console.warn(`⚠️ Track loading timeout for Deck ${deckLetter}`);
                updateStatus(`Track loading timeout for Deck ${deckLetter}`, 'error');
                cleanupDeckTrack(deckLetter);
                updateDeckDisplayEnhanced(deckLetter, null);
            }
        }, 15000);
        
        // Set up audio event listeners
        deck.audio.addEventListener('loadeddata', async () => {
            clearTimeout(loadTimeout);
            console.log(`✅ Track loaded in Deck ${deckLetter}: ${track.title}`);
            
            // Process professional multi-channel audio
            await processProfessionalMultiChannelAudio(deckLetter);
            
            updateStatus(`"${track.title}" loaded in Deck ${deckLetter} (${deck.bpm} BPM) - Professional multi-channel ready`, 'success');
            updateDeckDisplayEnhanced(deckLetter, track);
            updateDeckUI(deckLetter);
            updateChannelIndicators(deckLetter);
        });

        deck.audio.addEventListener('error', (error) => {
            clearTimeout(loadTimeout);
            console.error(`❌ Error loading track in Deck ${deckLetter}:`, error);
            
            let errorMessage = 'Failed to load track';
            if (deck.audio.error) {
                switch(deck.audio.error.code) {
                    case deck.audio.error.MEDIA_ERR_NETWORK:
                        errorMessage = 'Network error - check connection';
                        break;
                    case deck.audio.error.MEDIA_ERR_DECODE:
                        errorMessage = 'Audio decode error';
                        break;
                    case deck.audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = 'Audio format not supported';
                        break;
                    default:
                        errorMessage = 'Unknown audio error';
                }
            }
            
            updateStatus(`${errorMessage} in Deck ${deckLetter}`, 'error');
            cleanupDeckTrack(deckLetter);
            updateDeckDisplayEnhanced(deckLetter, null);
        });

        // Set up track end detection
        setupTrackEndDetection(deckLetter);

        // Load the track
        if (!track.stream_url || track.stream_url.trim() === '') {
            throw new Error('Invalid or missing stream URL');
        }

        console.log(`🌐 Loading audio from: ${track.stream_url}`);
        deck.audio.src = track.stream_url;

        // Clear selection
        appState.selectedDeck = null;
        document.querySelectorAll('.deck-track-display').forEach(display => {
            display.style.borderColor = '';
            display.style.background = '';
        });

    } catch (error) {
        console.error(`❌ Error loading track to Deck ${deckLetter}:`, error);
        updateStatus(`Failed to load track: ${error.message}`, 'error');
        cleanupDeckTrack(deckLetter);
        updateDeckDisplayEnhanced(deckLetter, null);
    }
}
*/

// Process professional multi-channel audio separation
async function processProfessionalMultiChannelAudio(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.audio || !deck.track) {
        console.warn(`⚠️ No audio available for professional multi-channel processing in Deck ${deckLetter}`);
        return;
    }

    try {
        console.log(`🔄 Processing professional multi-channel audio for Deck ${deckLetter}...`);
        
        // Show processing feedback
        showMultiChannelProcessingFeedback(deckLetter, true);
        
        // Create audio context if not exists
        if (!appState.audioContext) {
            appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create audio buffer from source
        const audioBuffer = await createAudioBufferFromElement(deck.audio);
        
        // Separate audio into professional channels using enhanced separator
        const separatedBuffers = await separateAudioSourceProfessional(audioBuffer, appState.audioContext);
        
        // Store separated buffers
        deck.separatedBuffers = separatedBuffers;
        
        // Create professional multi-channel player
        deck.multiChannelPlayer = createProfessionalMultiChannelPlayer(appState.audioContext, separatedBuffers);
        
        // Load professional multi-channel waveforms
        await loadProfessionalMultiChannelWaveforms(deckLetter, separatedBuffers);
        
        // Hide processing feedback
        showMultiChannelProcessingFeedback(deckLetter, false);
        
        console.log(`✅ Professional multi-channel processing complete for Deck ${deckLetter}`);
        updateStatus(`Professional multi-channel audio ready for Deck ${deckLetter}`, 'success');
        
    } catch (error) {
        console.error(`❌ Professional multi-channel processing failed for Deck ${deckLetter}:`, error);
        
        // Hide processing feedback
        showMultiChannelProcessingFeedback(deckLetter, false);
        
        // Fallback to single-channel audio
        deck.separatedBuffers = null;
        deck.multiChannelPlayer = null;
        
        // Try to load single waveform
        if (deck.wavesurfer && deck.track.stream_url) {
            try {
                deck.wavesurfer.load(deck.track.stream_url);
            } catch (waveError) {
                console.warn(`⚠️ Single waveform loading also failed for Deck ${deckLetter}:`, waveError);
            }
        }
        
        updateStatus(`Multi-channel processing failed for Deck ${deckLetter}, using standard audio`, 'error');
    }
}

// Create AudioBuffer from HTML audio element
async function createAudioBufferFromElement(audioElement) {
    return new Promise((resolve, reject) => {
        try {
            // Create a new audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Fetch audio data
            fetch(audioElement.src)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    console.log(`📊 Audio buffer created: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz`);
                    resolve(audioBuffer);
                })
                .catch(error => {
                    console.error('Failed to create audio buffer:', error);
                    // Create a dummy buffer as fallback
                    const dummyBuffer = audioContext.createBuffer(2, audioContext.sampleRate * 2, audioContext.sampleRate);
                    resolve(dummyBuffer);
                });
                
        } catch (error) {
            reject(error);
        }
    });
}

// Initialize professional audio channels for a deck
function initializeDeckAudioChannels(deckLetter) {
    const deck = deckState[deckLetter];
    
    deck.audioChannels = {
        bass: { 
            enabled: true, 
            volume: 1.0, 
            solo: false, 
            mute: false,
            eq: { low: 0, mid: 0, high: 0 }
        },
        drums: { 
            enabled: true, 
            volume: 1.0, 
            solo: false, 
            mute: false,
            eq: { low: 0, mid: 0, high: 0 }
        },
        synth: { 
            enabled: true, 
            volume: 1.0, 
            solo: false, 
            mute: false,
            eq: { low: 0, mid: 0, high: 0 }
        }
    };
    
    console.log(`🎚️ Professional audio channels initialized for Deck ${deckLetter}`);
}

// Get fallback BPM based on genre
function getFallbackBPM(genre) {
    if (!genre) return 120;
    
    const genreLower = genre.toLowerCase();
    
    // Extended genre BPM mapping
    if (genreLower.includes('house')) return 128;
    if (genreLower.includes('techno')) return 132;
    if (genreLower.includes('trance')) return 138;
    if (genreLower.includes('progressive')) return 128;
    if (genreLower.includes('deep house')) return 122;
    if (genreLower.includes('tech house')) return 126;
    if (genreLower.includes('drum') && genreLower.includes('bass')) return 174;
    if (genreLower.includes('dnb')) return 174;
    if (genreLower.includes('dubstep')) return 140;
    if (genreLower.includes('trap')) return 140;
    if (genreLower.includes('hip hop') || genreLower.includes('rap')) return 95;
    if (genreLower.includes('reggae')) return 90;
    if (genreLower.includes('jazz')) return 120;
    if (genreLower.includes('rock')) return 120;
    if (genreLower.includes('pop')) return 120;
    if (genreLower.includes('electronic')) return 128;
    if (genreLower.includes('ambient')) return 80;
    if (genreLower.includes('breakbeat')) return 130;
    if (genreLower.includes('garage')) return 130;
    if (genreLower.includes('hardcore')) return 160;
    if (genreLower.includes('hardstyle')) return 150;
    if (genreLower.includes('psytrance')) return 145;
    
    return 120;
}

// Enhanced play function with professional multi-channel support
async function playDeck(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.track) {
        updateStatus(`No track loaded in Deck ${deckLetter}`, 'error');
        return;
    }

    try {
        // Ensure audio context is running
        if (appState.audioContext && appState.audioContext.state !== 'running') {
            await appState.audioContext.resume();
        }

        // Use professional multi-channel player if available
        if (deck.multiChannelPlayer) {
            console.log(`▶️ Playing professional multi-channel audio for Deck ${deckLetter}`);
            await deck.multiChannelPlayer.play();
            playProfessionalMultiChannelWaveforms(deckLetter);
        } else if (deck.audio) {
            console.log(`▶️ Playing single-channel audio for Deck ${deckLetter}`);
            
            if (deck.audio.readyState < 2) {
                updateStatus(`Track still loading in Deck ${deckLetter}, please wait...`, 'info');
                return;
            }
            
            await deck.audio.play();
            
            // Apply volume based on hand control and channel settings
            updateDeckVolume(deckLetter);
            
            // Start single waveform if available
            if (deck.wavesurfer && !deck.wavesurfer.isPlaying()) {
                deck.wavesurfer.play();
            }
        }

        deck.isPlaying = true;
        deck.isPaused = false;
        deck.isFinished = false;

        updateDeckStatus(deckLetter, 'Playing');
        updateDeckUI(deckLetter);
        
        console.log(`▶️ Playing Deck ${deckLetter}: ${deck.track.title} (${deck.bpm} BPM)`);

    } catch (error) {
        console.error(`❌ Error playing Deck ${deckLetter}:`, error);
        
        let errorMessage = 'Failed to play track';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Browser blocked audio - user interaction required';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Audio format not supported';
        }
        
        updateStatus(`${errorMessage} in Deck ${deckLetter}`, 'error');
    }
}

// Enhanced pause function
function pauseDeck(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.isPlaying) return;

    try {
        // Use professional multi-channel player if available
        if (deck.multiChannelPlayer) {
            deck.multiChannelPlayer.pause();
            pauseProfessionalMultiChannelWaveforms(deckLetter);
        } else if (deck.audio) {
            deck.audio.pause();
            
            if (deck.wavesurfer && deck.wavesurfer.isPlaying()) {
                deck.wavesurfer.pause();
            }
        }

        deck.isPlaying = false;
        deck.isPaused = true;

        updateDeckStatus(deckLetter, 'Paused');
        updateDeckUI(deckLetter);
        
        console.log(`⏸️ Paused Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Error pausing Deck ${deckLetter}:`, error);
    }
}

// Enhanced stop function
function stopDeck(deckLetter) {
    const deck = deckState[deckLetter];
    
    try {
        // Use professional multi-channel player if available
        if (deck.multiChannelPlayer) {
            deck.multiChannelPlayer.stop();
            stopProfessionalMultiChannelWaveforms(deckLetter);
        } else if (deck.audio) {
            deck.audio.pause();
            deck.audio.currentTime = 0;
            
            if (deck.wavesurfer) {
                deck.wavesurfer.stop();
            }
        }
        
        deck.isPlaying = false;
        deck.isPaused = false;

        updateDeckStatus(deckLetter, 'Stopped');
        updateDeckUI(deckLetter);
        
        console.log(`⏹️ Stopped Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Error stopping Deck ${deckLetter}:`, error);
    }
}

// Note: updateDeckVolume is defined in hand-gestures.js with full mute support

// Enhanced cleanup function
function cleanupDeckTrack(deckLetter) {
    const deck = deckState[deckLetter];
    
    // Stop any playing audio
    if (deck.isPlaying || deck.isPaused) {
        stopDeck(deckLetter);
    }
    
    // Clean up professional multi-channel player
    if (deck.multiChannelPlayer) {
        deck.multiChannelPlayer.stop();
        deck.multiChannelPlayer = null;
    }
    
    // Clean up separated buffers
    if (deck.separatedBuffers) {
        deck.separatedBuffers = null;
    }
    
    // Remove track end listener
    if (deck.audio && deck.trackEndListener) {
        deck.audio.removeEventListener('ended', deck.trackEndListener);
        deck.trackEndListener = null;
    }
    
    // Clean up audio element
    if (deck.audio) {
        deck.audio.pause();
        deck.audio.src = '';
        deck.audio = null;
    }
    
    // Clean up professional waveforms
    if (deck.wavesurfers) {
        Object.values(deck.wavesurfers).forEach(wavesurfer => {
            try {
                wavesurfer.destroy();
            } catch (error) {
                console.warn('Error destroying professional wavesurfer:', error);
            }
        });
        deck.wavesurfers = null;
    }
    
    if (deck.wavesurfer) {
        try {
            deck.wavesurfer.destroy();
        } catch (error) {
            console.warn('Error destroying single wavesurfer:', error);
        }
        deck.wavesurfer = null;
    }
    
    // Reset deck state
    deck.isFinished = false;
    deck.handControlled = false;
    deck.bpm = null;
    deck.audioChannels = null;
    
    // Reset BPM display
    updateDeckBPM(deckLetter, '-- BPM');
    
    console.log(`🧹 Cleaned up Deck ${deckLetter}`);
}

// Track end detection
function setupTrackEndDetection(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (deck.audio) {
        // Remove previous listener if exists
        if (deck.trackEndListener) {
            deck.audio.removeEventListener('ended', deck.trackEndListener);
        }
        
        // Create new end listener
        deck.trackEndListener = function() {
            console.log(`🏁 Track finished on Deck ${deckLetter}: ${deck.track.title}`);
            handleTrackEnd(deckLetter);
        };
        
        deck.audio.addEventListener('ended', deck.trackEndListener);
        console.log(`👂 Track end detection set up for Deck ${deckLetter}`);
    }
}

function handleTrackEnd(deckLetter) {
    const deck = deckState[deckLetter];
    
    deck.isFinished = true;
    deck.isPlaying = false;
    deck.isPaused = false;
    
    updateDeckStatus(deckLetter, 'Finished');
    updateDeckUI(deckLetter);
    
    updateStatus(`Track finished on Deck ${deckLetter}`, 'info');
}

// Load professional multi-channel waveforms
async function loadProfessionalMultiChannelWaveforms(deckLetter, separatedBuffers) {
    try {
        const deck = deckState[deckLetter];
        
        if (!deck.wavesurfers || !separatedBuffers) {
            console.warn(`⚠️ Professional multi-channel wavesurfers not available for Deck ${deckLetter}`);
            return;
        }
        
        console.log(`🌊 Loading professional multi-channel waveforms for Deck ${deckLetter}`);
        
        // Load each channel with professional styling
        const loadPromises = Object.keys(separatedBuffers).map(async (channel) => {
            const wavesurfer = deck.wavesurfers[channel];
            const buffer = separatedBuffers[channel];
            
            if (!wavesurfer || !buffer) {
                console.warn(`⚠️ Missing wavesurfer or buffer for ${channel}`);
                return;
            }
            
            try {
                // Convert AudioBuffer to blob for wavesurfer
                const audioBlob = await audioBufferToBlob(buffer);
                const url = URL.createObjectURL(audioBlob);
                
                await wavesurfer.load(url);
                
                console.log(`✅ Loaded professional ${channel} waveform for Deck ${deckLetter}`);
                
                // Clean up URL after loading
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
            } catch (channelError) {
                console.error(`❌ Failed to load professional ${channel} waveform:`, channelError);
            }
        });
        
        // Wait for all channels to load
        await Promise.all(loadPromises);
        
        console.log(`✅ All professional waveforms loaded for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Professional multi-channel waveform loading failed for Deck ${deckLetter}:`, error);
    }
}

// Convert AudioBuffer to Blob for wavesurfer
async function audioBufferToBlob(audioBuffer) {
    return new Promise((resolve, reject) => {
        try {
            // Create offline context to render audio buffer
            const offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start(0);
            
            offlineContext.startRendering().then(renderedBuffer => {
                // Convert to WAV blob
                const wavBlob = audioBufferToWav(renderedBuffer);
                resolve(wavBlob);
            }).catch(reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer) {
    const length = buffer.length;
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * channels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * channels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * channels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < channels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Note: The professional multi-channel waveform control functions 
// (play, pause, stop) are defined in wavesurfer-setup.js to avoid duplication

console.log('✅ Professional Multi-Channel Deck Manager Ready');
console.log('🎛️ Features:');
console.log('  - Professional 3-channel audio separation');
console.log('  - Advanced audio processing and EQ');
console.log('  - Professional waveform visualization');
console.log('  - Hand gesture volume control');
console.log('  - Seamless channel management');