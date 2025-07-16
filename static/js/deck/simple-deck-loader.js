// Simple Deck Loader - Clean implementation for loading tracks to specific decks

console.log('🎵 Simple Deck Loader initialized');

// Store deck data
const simpleDeckData = {
    A: {
        track: null,
        audio: null,
        isPlaying: false,
        waveform: null,
        analyser: null,
        audioSourceConnected: false,
        volume: 0.5  // Default 50% volume
    },
    B: {
        track: null,
        audio: null,
        isPlaying: false,
        waveform: null,
        analyser: null,
        audioSourceConnected: false,
        volume: 0.5  // Default 50% volume
    }
};

// Load track to specific deck
window.loadTrackToSpecificDeck = async function(track, deckLetter) {
    console.log(`🎵 Loading track "${track.title}" to Deck ${deckLetter}`);
    console.log('Track object:', track);
    console.log('Current simpleDeckData:', window.simpleDeckData);
    
    try {
        const deck = window.simpleDeckData[deckLetter];
        console.log(`Deck ${deckLetter} before loading:`, deck);
        
        // Stop current track if playing
        if (deck.isPlaying && deck.audio) {
            deck.audio.pause();
            deck.isPlaying = false;
        }
        
        // Clean up old audio element properly
        if (deck.audio) {
            // Remove event listeners
            deck.audio.removeEventListener('loadedmetadata', deck._metadataListener);
            deck.audio.removeEventListener('error', deck._errorListener);
            deck.audio.removeEventListener('timeupdate', deck._timeupdateListener);
            deck.audio.removeEventListener('ended', deck._endedListener);
            
            // Reset source node reference
            deck.audio._sourceNode = null;
            
            // Clear the audio element
            deck.audio.src = '';
            deck.audio = null;
        }
        
        // Reset BPM display
        const bpmElement = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'} .bpm-display`);
        if (bpmElement) {
            bpmElement.textContent = '-- BPM';
        }
        
        // Reset audio source connection flag
        deck.audioSourceConnected = false;
        
        // Store track data
        deck.track = track;
        
        // Create new audio element
        deck.audio = new Audio();
        deck.audio.crossOrigin = 'anonymous';
        
        // Get audio URL
        const audioUrl = track.stream_url || track.preview_url || track.url;
        if (!audioUrl) {
            throw new Error('No valid audio URL found');
        }
        
        deck.audio.src = audioUrl;
        deck.audio.volume = deck.volume || 0.5;  // Use stored volume or default 50%
        
        // Update visual display immediately
        updateDeckVisuals(deckLetter, track);
        
        // Set up audio context for waveform
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Create event listeners and store references
        deck._metadataListener = () => {
            console.log(`✅ Audio loaded for Deck ${deckLetter}`);
            setupWaveform(deckLetter);
            updatePlayButton(deckLetter, false);
            
            // Setup audio splitting for channel waveforms
            if (window.setupAudioSplitting) {
                window.setupAudioSplitting(deckLetter, deck.audio);
            }
        };
        
        deck._errorListener = (e) => {
            console.error(`❌ Error loading audio for Deck ${deckLetter}:`, e);
            showNotification(`Failed to load audio for Deck ${deckLetter}`, 'error');
        };
        
        deck._timeupdateListener = () => {
            updateTimeDisplay(deckLetter);
            updateWaveformProgress(deckLetter);
        };
        
        deck._endedListener = () => {
            console.log(`🎵 Track ended for Deck ${deckLetter}`);
            deck.isPlaying = false;
            updatePlayButton(deckLetter, false);
        };
        
        // Add event listeners
        deck.audio.addEventListener('loadedmetadata', deck._metadataListener);
        deck.audio.addEventListener('error', deck._errorListener);
        deck.audio.addEventListener('timeupdate', deck._timeupdateListener);
        deck.audio.addEventListener('ended', deck._endedListener);
        
        // Load the audio
        deck.audio.load();
        
        showNotification(`Track loaded to Deck ${deckLetter}`, 'success');
        
        // Verify the deck was updated
        console.log(`✅ Deck ${deckLetter} after loading:`, window.simpleDeckData[deckLetter]);
        console.log(`Audio element created:`, window.simpleDeckData[deckLetter].audio);
        console.log(`Track stored:`, window.simpleDeckData[deckLetter].track);
        
    } catch (error) {
        console.error(`❌ Error loading track to Deck ${deckLetter}:`, error);
        showNotification(`Failed to load track: ${error.message}`, 'error');
    }
};

// Update deck visuals
function updateDeckVisuals(deckLetter, track) {
    console.log(`🎨 Updating visuals for Deck ${deckLetter}`);
    
    const trackDisplay = document.getElementById(`trackDisplay${deckLetter}`);
    if (!trackDisplay) {
        console.error(`❌ trackDisplay${deckLetter} not found`);
        return;
    }
    
    // Add has-track class for colored border
    trackDisplay.classList.add('has-track');
    
    // Get album art
    let albumArt = null;
    if (track.artwork) {
        if (typeof track.artwork === 'string') {
            albumArt = track.artwork;
        } else if (typeof track.artwork === 'object') {
            albumArt = track.artwork['480x480'] || track.artwork['150x150'] || Object.values(track.artwork)[0];
        }
    }
    
    if (!albumArt && track.user?.profile_picture) {
        albumArt = track.user.profile_picture['480x480'] || track.user.profile_picture['150x150'];
    }
    
    // Update HTML with clickable album art
    trackDisplay.innerHTML = `
        <div class="track-loaded" onclick="window.selectTrackForDeck('${deckLetter}')" style="cursor: pointer;">
            <div class="track-art">
                ${albumArt ? 
                    `<img src="${albumArt}" alt="${track.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` :
                    `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #00d4ff, #ff0080); border-radius: 8px; font-size: 24px;">♪</div>`
                }
            </div>
            <div class="track-info">
                <div class="track-name">${track.title || 'Unknown Track'}</div>
                <div class="track-artist">${track.user?.name || track.artist || 'Unknown Artist'}</div>
            </div>
        </div>
    `;
    
    // Update BPM display
    updateBPMDisplay(deckLetter, track);
    
    console.log(`✅ Visuals updated for Deck ${deckLetter}`);
}

// Setup waveform
function setupWaveform(deckLetter) {
    console.log(`🌊 Setting up main waveform for Deck ${deckLetter}`);
    
    const deck = simpleDeckData[deckLetter];
    const canvas = document.getElementById(`mainWaveformCanvas${deckLetter}`);
    
    if (!canvas || !deck.audio) {
        console.error('Canvas or audio not found for waveform');
        return;
    }
    
    // Wait a bit for audio splitting to be set up first
    setTimeout(() => {
        // Don't create a new source if audio splitting is handling it or if already connected
        if (!deck.audioSourceConnected && (!window.audioSplitter || !window.audioSplitter[deckLetter]?.isSetup)) {
            try {
                // Check if audio element already has a source node
                if (!deck.audio._sourceNode) {
                    // Only create source if not already created
                    const source = audioContext.createMediaElementSource(deck.audio);
                    deck.analyser = audioContext.createAnalyser();
                    deck.analyser.fftSize = 2048;
                    
                    // Connect nodes
                    source.connect(deck.analyser);
                    deck.analyser.connect(audioContext.destination);
                    
                    // Mark as connected and store reference
                    deck.audioSourceConnected = true;
                    deck.audio._sourceNode = source;
                    console.log(`✅ Audio source connected for Deck ${deckLetter}`);
                } else {
                    console.log(`ℹ️ Audio source already exists for Deck ${deckLetter}, reusing`);
                    deck.audioSourceConnected = true;
                }
            } catch (error) {
                console.log('Audio source connection error:', error.message);
                // Try to reuse existing analyser if available
                if (window.audioSplitter?.[deckLetter]?.masterAnalyser) {
                    deck.analyser = window.audioSplitter[deckLetter].masterAnalyser;
                    deck.audioSourceConnected = true;
                    console.log(`ℹ️ Using audio splitter's analyser for Deck ${deckLetter}`);
                }
            }
        } else {
            console.log(`ℹ️ Audio source already connected for Deck ${deckLetter}`);
            // Use the audio splitter's analyser if available
            if (window.audioSplitter?.[deckLetter]?.masterAnalyser) {
                deck.analyser = window.audioSplitter[deckLetter].masterAnalyser;
            }
        }
    }, 100);
    
    // Skip old waveform drawing - audio-waveform-renderer will handle it
    // drawStaticWaveform(canvas, deckLetter);
    // startMainWaveformAnimation(deckLetter);
    
    console.log('Main waveform will be handled by audio-waveform-renderer');
    
    // Set up click handler for seeking
    const seekSlider = document.getElementById(`seekSlider${deckLetter}`);
    if (seekSlider) {
        seekSlider.addEventListener('input', (e) => {
            if (deck.audio && deck.audio.duration) {
                const seekTime = (e.target.value / 100) * deck.audio.duration;
                deck.audio.currentTime = seekTime;
            }
        });
    }
}

// Draw static waveform
function drawStaticWaveform(canvas, deckLetter) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth || 280;
    const height = canvas.height = canvas.offsetHeight || 80;
    
    console.log(`Drawing static waveform for Deck ${deckLetter}:`, { width, height });
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform bars
    const barCount = 100;
    const barWidth = width / barCount;
    const barGap = 1;
    
    for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * height * 0.8 + height * 0.1;
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        
        // Gradient based on deck
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (deckLetter === 'A') {
            gradient.addColorStop(0, '#00d4ff');
            gradient.addColorStop(1, '#0099cc');
        } else {
            gradient.addColorStop(0, '#ff8a00');
            gradient.addColorStop(1, '#cc6600');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + barGap/2, y, barWidth - barGap, barHeight);
    }
}

// Update waveform progress
function updateWaveformProgress(deckLetter) {
    const deck = simpleDeckData[deckLetter];
    if (!deck.audio || !deck.audio.duration) return;
    
    const progress = (deck.audio.currentTime / deck.audio.duration) * 100;
    
    // Update progress bar
    const progressBar = document.getElementById(`waveformProgress${deckLetter}`);
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        // Ensure it's visible
        progressBar.style.opacity = '1';
        progressBar.style.display = 'block';
    }
    
    // Update seek slider
    const seekSlider = document.getElementById(`seekSlider${deckLetter}`);
    if (seekSlider) {
        seekSlider.value = progress;
    }
}

// Play/Stop deck
window.toggleDeckPlayback = function(deckLetter) {
    console.log(`🎵 toggleDeckPlayback called for Deck ${deckLetter}`);
    console.log('SimpleDeckData:', window.simpleDeckData);
    
    const deck = window.simpleDeckData?.[deckLetter];
    console.log(`Deck ${deckLetter} data:`, deck);
    
    if (!deck || !deck.audio) {
        console.error(`No track/audio in Deck ${deckLetter}:`, { deck, hasAudio: deck?.audio });
        showNotification(`No track loaded in Deck ${deckLetter}`, 'warning');
        return;
    }
    
    if (deck.isPlaying) {
        // Stop
        deck.audio.pause();
        deck.isPlaying = false;
        updatePlayButton(deckLetter, false);
        console.log(`⏸️ Stopped Deck ${deckLetter}`);
    } else {
        // Play
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        deck.audio.play();
        deck.isPlaying = true;
        updatePlayButton(deckLetter, true);
        console.log(`▶️ Playing Deck ${deckLetter}`);
    }
};

// Update play button
function updatePlayButton(deckLetter, isPlaying) {
    const playBtn = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'} .play-deck-btn`);
    if (playBtn) {
        playBtn.textContent = isPlaying ? `STOP DECK ${deckLetter}` : `PLAY DECK ${deckLetter}`;
        playBtn.classList.toggle('playing', isPlaying);
    }
    
    // Update Play Both Decks button if both are playing or stopped
    const deckA = simpleDeckData.A;
    const deckB = simpleDeckData.B;
    const playBothBtn = document.getElementById('playBothBtn');
    
    if (playBothBtn) {
        if (deckA.isPlaying || deckB.isPlaying) {
            playBothBtn.textContent = 'STOP BOTH DECKS';
            playBothBtn.onclick = window.stopBothDecks;
        } else {
            playBothBtn.textContent = 'PLAY BOTH DECKS';
            playBothBtn.onclick = window.playBothDecks;
        }
    }
}

// Update time display
function updateTimeDisplay(deckLetter) {
    const deck = simpleDeckData[deckLetter];
    if (!deck.audio) return;
    
    const currentTime = formatTime(deck.audio.currentTime);
    const duration = formatTime(deck.audio.duration || 0);
    
    const currentTimeEl = document.getElementById(`currentTime${deckLetter}`);
    const durationEl = document.getElementById(`duration${deckLetter}`);
    
    if (currentTimeEl) currentTimeEl.textContent = currentTime;
    if (durationEl) durationEl.textContent = duration;
}

// Format time
function formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update BPM display
function updateBPMDisplay(deckLetter, track) {
    const bpmElement = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'} .bpm-display`);
    if (!bpmElement) return;
    
    // Debug log to see what we're getting
    console.log(`🎵 BPM Debug for Deck ${deckLetter}:`, {
        track_bpm: track.bpm,
        track_metadata_bpm: track.metadata?.bpm,
        track_tempo: track.tempo,
        full_track: track
    });
    
    // Check if track has BPM metadata
    let bpm = null;
    
    // Try to get BPM from track metadata
    if (track.bpm) {
        bpm = track.bpm;
    } else if (track.metadata?.bpm) {
        bpm = track.metadata.bpm;
    } else if (track.tempo) {
        bpm = track.tempo;
    }
    
    if (bpm) {
        bpmElement.textContent = `${Math.round(bpm)} BPM`;
        console.log(`✅ BPM set to ${bpm} for Deck ${deckLetter}`);
    } else {
        // If no BPM in metadata, estimate it (placeholder for now)
        bpmElement.textContent = 'DETECTING...';
        
        // Simple BPM estimation based on genre or default
        setTimeout(() => {
            const estimatedBPM = estimateBPMFromTrack(track);
            bpmElement.textContent = `~${estimatedBPM} BPM`;
        }, 1000);
    }
}

// Estimate BPM based on track info (simple heuristic)
function estimateBPMFromTrack(track) {
    // This is a simple estimation based on common EDM BPMs
    // In a real app, you'd use audio analysis
    const title = (track.title || '').toLowerCase();
    const genre = (track.genre || '').toLowerCase();
    
    // Common BPM ranges for electronic music genres
    if (genre.includes('house') || title.includes('house')) return 128;
    if (genre.includes('techno') || title.includes('techno')) return 130;
    if (genre.includes('trance') || title.includes('trance')) return 138;
    if (genre.includes('dubstep') || title.includes('dubstep')) return 140;
    if (genre.includes('drum') || genre.includes('bass')) return 174;
    if (genre.includes('trap') || title.includes('trap')) return 140;
    if (genre.includes('future') || title.includes('future')) return 150;
    
    // Default to 128 BPM (common house tempo)
    return 128;
}

// Start main waveform animation
function startMainWaveformAnimation(deckLetter) {
    const deck = simpleDeckData[deckLetter];
    const canvas = document.getElementById(`mainWaveformCanvas${deckLetter}`);
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    function animate() {
        // Check if we should use the audio splitter's master analyser
        let analyser = null;
        
        if (window.audioSplitter && window.audioSplitter[deckLetter].masterAnalyser) {
            analyser = window.audioSplitter[deckLetter].masterAnalyser;
        } else if (deck.analyser) {
            analyser = deck.analyser;
        }
        
        if (!analyser) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        
        const width = canvas.width = canvas.offsetWidth || 280;
        const height = canvas.height = canvas.offsetHeight || 80;
        
        // Get waveform data
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = deckLetter === 'A' ? '#00d4ff' : '#ff8a00';
        ctx.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // Removed center line for cleaner look
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Store animation ID so we can stop it later if needed
    deck.waveformAnimation = animationId;
    
    animate();
}

// Show notification
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can implement a visual notification here
}

// Play both decks simultaneously - super simple version
window.playBothDecks = function() {
    console.log('🎵 PLAY BOTH DECKS clicked');
    
    // Debug log to check deck data
    console.log('SimpleDeckData:', window.simpleDeckData);
    console.log('Deck A data:', window.simpleDeckData?.A);
    console.log('Deck B data:', window.simpleDeckData?.B);
    
    // Simply trigger both deck play buttons
    const deckA = window.simpleDeckData?.A;
    const deckB = window.simpleDeckData?.B;
    
    // Check if we have tracks loaded
    const hasTrackA = deckA && deckA.track && deckA.audio;
    const hasTrackB = deckB && deckB.track && deckB.audio;
    
    console.log('Has track A:', hasTrackA, 'Audio element:', deckA?.audio);
    console.log('Has track B:', hasTrackB, 'Audio element:', deckB?.audio);
    
    if (!hasTrackA && !hasTrackB) {
        console.log('No tracks loaded in either deck');
        alert('Please load tracks in both decks first');
        return;
    }
    
    if (!hasTrackA) {
        console.log('No track in Deck A');
        alert('Please load a track in Deck A first');
        return;
    }
    
    if (!hasTrackB) {
        console.log('No track in Deck B');
        alert('Please load a track in Deck B first');
        return;
    }
    
    // If both decks have tracks, play them both
    console.log('Both decks have tracks, starting playback...');
    
    // Resume audio context if needed
    if (window.audioContext && window.audioContext.state === 'suspended') {
        console.log('Resuming audio context...');
        window.audioContext.resume();
    }
    
    // Start both decks
    if (!deckA.isPlaying) {
        console.log('Starting Deck A...');
        deckA.audio.play().then(() => {
            deckA.isPlaying = true;
            updatePlayButton('A', true);
            console.log('✅ Deck A playing');
        }).catch(err => {
            console.error('Error playing Deck A:', err);
        });
    }
    
    if (!deckB.isPlaying) {
        console.log('Starting Deck B...');
        deckB.audio.play().then(() => {
            deckB.isPlaying = true;
            updatePlayButton('B', true);
            console.log('✅ Deck B playing');
        }).catch(err => {
            console.error('Error playing Deck B:', err);
        });
    }
};

// Stop both decks
window.stopBothDecks = function() {
    console.log('⏹️ Stopping both decks...');
    
    const deckA = simpleDeckData.A;
    const deckB = simpleDeckData.B;
    
    // Stop both decks if they're playing
    if (deckA.isPlaying) {
        toggleDeckPlayback('A');
    }
    if (deckB.isPlaying) {
        toggleDeckPlayback('B');
    }
    
    console.log('✅ Stopped playback for both decks');
};

// Update deck volume
window.updateDeckVolume = function(deckLetter, value) {
    const deck = simpleDeckData[deckLetter];
    const volume = value / 100;  // Convert percentage to 0-1 range
    
    console.log(`🔊 Updating Deck ${deckLetter} volume to ${value}%`);
    
    // Store the volume
    deck.volume = volume;
    
    // Update audio element if it exists
    if (deck.audio) {
        deck.audio.volume = volume;
    }
    
    // Update volume label
    const volumeLabel = document.getElementById(`volumeLabel${deckLetter}`);
    if (volumeLabel) {
        volumeLabel.textContent = value;
    }
};

// Handle seek with proper ended state handling
window.handleSeek = function(deckLetter, value) {
    const deck = simpleDeckData[deckLetter];
    if (!deck || !deck.audio || !deck.audio.duration) return;
    
    const wasPlayingBeforeSeek = deck.isPlaying;
    const seekTime = (value / 100) * deck.audio.duration;
    
    console.log(`🎯 Seeking Deck ${deckLetter} to ${seekTime.toFixed(2)}s (${value}%)`);
    
    // Set the new time
    deck.audio.currentTime = seekTime;
    
    // If the track had ended and was playing before, resume playback
    if (deck.audio.ended && wasPlayingBeforeSeek) {
        console.log(`🔄 Track had ended, resuming playback for Deck ${deckLetter}`);
        deck.audio.play().then(() => {
            deck.isPlaying = true;
            updatePlayButton(deckLetter, true);
        }).catch(err => {
            console.error(`Error resuming playback for Deck ${deckLetter}:`, err);
        });
    }
};

// Export for global use
window.simpleDeckData = simpleDeckData;

// Override deckPlayers to use our data
window.deckPlayers = window.simpleDeckData;

// Debug main waveform
window.debugMainWaveform = function(deckLetter) {
    console.log(`=== Main Waveform Debug for Deck ${deckLetter} ===`);
    
    const canvas = document.getElementById(`mainWaveformCanvas${deckLetter}`);
    console.log('Canvas:', {
        exists: !!canvas,
        width: canvas?.width,
        height: canvas?.height,
        offsetWidth: canvas?.offsetWidth,
        offsetHeight: canvas?.offsetHeight,
        parent: canvas?.parentElement
    });
    
    const deck = simpleDeckData[deckLetter];
    console.log('Deck data:', {
        hasAudio: !!deck.audio,
        isPlaying: deck.isPlaying,
        hasAnalyser: !!deck.analyser,
        hasWaveformAnimation: !!deck.waveformAnimation
    });
    
    // Try to draw something on the canvas
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 50, 50);
        console.log('Drew red square at top-left of canvas');
    }
};

// Force redraw main waveform
window.forceMainWaveform = function(deckLetter) {
    console.log(`🔄 Forcing main waveform redraw for Deck ${deckLetter}`);
    const canvas = document.getElementById(`mainWaveformCanvas${deckLetter}`);
    if (canvas) {
        drawStaticWaveform(canvas, deckLetter);
        const deck = simpleDeckData[deckLetter];
        if (deck.audio) {
            setupWaveform(deckLetter);
        }
    }
};

// Debug function to check deck states
window.debugDeckStates = function() {
    console.log('=== DECK STATES DEBUG ===');
    console.log('Window simpleDeckData:', window.simpleDeckData);
    console.log('Deck A:', {
        hasTrack: !!window.simpleDeckData?.A?.track,
        hasAudio: !!window.simpleDeckData?.A?.audio,
        trackTitle: window.simpleDeckData?.A?.track?.title,
        audioSrc: window.simpleDeckData?.A?.audio?.src
    });
    console.log('Deck B:', {
        hasTrack: !!window.simpleDeckData?.B?.track,
        hasAudio: !!window.simpleDeckData?.B?.audio,
        trackTitle: window.simpleDeckData?.B?.track?.title,
        audioSrc: window.simpleDeckData?.B?.audio?.src
    });
};

// Force fix function to ensure our system is used
window.fixDeckSystem = function() {
    console.log('🔧 Forcing simple deck system...');
    window.deckPlayers = window.simpleDeckData;
    
    // Override any conflicting functions
    if (window.loadTrackToDeck && window.loadTrackToDeck !== window.loadTrackToSpecificDeck) {
        console.log('⚠️ Overriding conflicting loadTrackToDeck function');
        window.loadTrackToDeck = function(track, deckLetter) {
            window.loadTrackToSpecificDeck(track, deckLetter);
        };
    }
    
    console.log('✅ Deck system fixed');
};

// Auto-fix on load
setTimeout(() => {
    window.fixDeckSystem();
    
    // Initialize volume sliders to match default volume
    ['A', 'B'].forEach(deckLetter => {
        const slider = document.getElementById(`volumeSlider${deckLetter}`);
        const label = document.getElementById(`volumeLabel${deckLetter}`);
        if (slider && label) {
            slider.value = 50;  // Set to 50%
            label.textContent = '50';
        }
    });
}, 1000);

console.log('✅ Simple Deck Loader ready');
console.log('🔍 To debug deck states, run: debugDeckStates()');
console.log('🔧 To force fix deck system, run: fixDeckSystem()');