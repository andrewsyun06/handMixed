// static/js/utils/deck-ui.js - Professional Multi-Channel Deck UI System

console.log('🎛️ Professional Multi-Channel Deck UI System Loading...');

// Update deck display with professional multi-channel information
function updateDeckDisplay(deckLetter, track) {
    const nameElement = document.getElementById(`deck${deckLetter}TrackName`);
    const artistElement = document.getElementById(`deck${deckLetter}TrackArtist`);
    const artworkElement = document.getElementById(`deck${deckLetter}Artwork`);
    const displayElement = document.getElementById(`deck${deckLetter}TrackDisplay`);
    
    if (track) {
        nameElement.textContent = track.title;
        artistElement.textContent = track.artist;
        
        if (track.artwork) {
            artworkElement.innerHTML = `<img src="${track.artwork}" alt="${track.title}" loading="lazy">`;
        } else {
            artworkElement.innerHTML = '<div class="artwork-placeholder">🎵</div>';
        }
        
        displayElement.classList.add('loaded');
        updateDeckStatus(deckLetter, 'Ready');
        
        // Set initial BPM display with professional styling
        if (track.bpm) {
            updateDeckBPM(deckLetter, `${track.bpm} BPM`);
        } else {
            updateDeckBPM(deckLetter, 'Analyzing...');
        }
        
        // Initialize professional multi-channel display
        initializeProfessionalMultiChannelDisplay(deckLetter);
        
        // Add professional loading animation
        addProfessionalLoadingAnimation(deckLetter);
        
    } else {
        nameElement.textContent = 'No track loaded';
        artistElement.textContent = 'Select track from Audius';
        artworkElement.innerHTML = '<div class="artwork-placeholder">🎵</div>';
        displayElement.classList.remove('loaded');
        updateDeckStatus(deckLetter, 'Empty');
        updateDeckBPM(deckLetter, '-- BPM');
        
        // Reset professional multi-channel display
        resetProfessionalMultiChannelDisplay(deckLetter);
    }
    
    updateDeckUI(deckLetter);
}

// Initialize professional multi-channel display elements
function initializeProfessionalMultiChannelDisplay(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.audioChannels) {
        console.warn(`⚠️ No audio channels found for Deck ${deckLetter}`);
        return;
    }
    
    // Update professional channel indicators
    updateProfessionalChannelIndicators(deckLetter);
    
    // Show professional multi-channel waveform containers
    const waveformContainers = [
        document.getElementById(`deck${deckLetter}WaveformBass`),
        document.getElementById(`deck${deckLetter}WaveformDrums`),
        document.getElementById(`deck${deckLetter}WaveformSynth`)
    ];
    
    waveformContainers.forEach((container, index) => {
        if (container) {
            container.style.display = 'block';
            container.style.opacity = '1';
            
            // Add professional channel styling
            const channelTypes = ['bass', 'drums', 'synth'];
            const channelColors = ['#ff6b6b', '#f39c12', '#00d4ff'];
            
            container.style.borderLeft = `3px solid ${channelColors[index]}`;
            container.style.background = `linear-gradient(135deg, ${channelColors[index]}10, transparent)`;
            container.style.transition = 'all 0.3s ease';
        }
    });
    
    // Add professional deck styling
    const overlay = document.getElementById(`deck${deckLetter}Overlay`);
    if (overlay) {
        overlay.classList.add('professional-mode');
        overlay.style.borderImage = 'linear-gradient(45deg, #ff6b6b, #f39c12, #00d4ff) 1';
    }
    
    console.log(`✅ Professional multi-channel display initialized for Deck ${deckLetter}`);
}

// Reset professional multi-channel display
function resetProfessionalMultiChannelDisplay(deckLetter) {
    // Reset professional channel indicators
    const channels = ['Bass', 'Drums', 'Synth'];
    channels.forEach(channel => {
        const indicator = document.getElementById(`deck${deckLetter}${channel}Channel`);
        if (indicator) {
            const statusElement = indicator.querySelector('.channel-status');
            if (statusElement) {
                statusElement.classList.remove('active', 'pulsing');
                statusElement.style.opacity = '0.3';
                statusElement.style.transform = 'scale(0.8)';
            }
        }
    });
    
    // Clear professional waveform containers
    const waveformContainers = [
        document.getElementById(`deck${deckLetter}WaveformBass`),
        document.getElementById(`deck${deckLetter}WaveformDrums`),
        document.getElementById(`deck${deckLetter}WaveformSynth`)
    ];
    
    waveformContainers.forEach(container => {
        if (container) {
            container.innerHTML = '';
            container.style.opacity = '0.3';
            container.style.borderLeft = '3px solid #333';
            container.style.background = 'rgba(0, 0, 0, 0.3)';
        }
    });
    
    // Remove professional deck styling
    const overlay = document.getElementById(`deck${deckLetter}Overlay`);
    if (overlay) {
        overlay.classList.remove('professional-mode');
        overlay.style.borderImage = 'none';
    }
    
    console.log(`🔄 Professional multi-channel display reset for Deck ${deckLetter}`);
}

// Update professional channel indicators based on current state
function updateProfessionalChannelIndicators(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.audioChannels) {
        console.warn(`⚠️ No audio channels to update for Deck ${deckLetter}`);
        return;
    }
    
    const channelMap = {
        bass: 'Bass',
        drums: 'Drums', 
        synth: 'Synth'
    };
    
    const channelColors = {
        bass: '#ff6b6b',
        drums: '#f39c12',
        synth: '#00d4ff'
    };
    
    Object.keys(deck.audioChannels).forEach(channelKey => {
        const channel = deck.audioChannels[channelKey];
        const channelName = channelMap[channelKey];
        const channelColor = channelColors[channelKey];
        const indicator = document.getElementById(`deck${deckLetter}${channelName}Channel`);
        
        if (indicator) {
            const statusElement = indicator.querySelector('.channel-status');
            const labelElement = indicator.querySelector('.channel-label');
            
            if (statusElement) {
                // Update active state with professional styling
                statusElement.classList.toggle('active', channel.enabled);
                
                // Professional visual styling based on channel state
                if (channel.enabled) {
                    statusElement.style.opacity = '1';
                    statusElement.style.filter = 'none';
                    statusElement.style.transform = 'scale(1)';
                    statusElement.style.background = `linear-gradient(135deg, ${channelColor}, ${channelColor}88)`;
                    statusElement.style.boxShadow = `0 0 15px ${channelColor}40`;
                    statusElement.style.border = `2px solid ${channelColor}`;
                } else {
                    statusElement.style.opacity = '0.3';
                    statusElement.style.filter = 'grayscale(100%)';
                    statusElement.style.transform = 'scale(0.8)';
                    statusElement.style.background = '#333';
                    statusElement.style.boxShadow = 'none';
                    statusElement.style.border = '2px solid #555';
                }
                
                // Add professional pulsing effect if channel is being controlled
                if (deck.handControlled && channel.enabled) {
                    statusElement.classList.add('pulsing');
                    statusElement.style.animation = 'professionalChannelPulse 1.5s ease-in-out infinite';
                } else {
                    statusElement.classList.remove('pulsing');
                    statusElement.style.animation = 'none';
                }
            }
            
            // Update label styling
            if (labelElement) {
                labelElement.style.color = channel.enabled ? channelColor : '#666';
                labelElement.style.fontWeight = channel.enabled ? '700' : '400';
            }
        }
    });
    
    // Update professional waveform visibility
    updateChannelWaveformVisibility(deckLetter);
    
    console.log(`🎚️ Professional channel indicators updated for Deck ${deckLetter}`);
}

// Update deck BPM display with professional styling
function updateDeckBPM(deckLetter, bpmText) {
    console.log(`🎵 Updating Deck ${deckLetter} BPM: ${bpmText}`);
    
    const bmpElement = document.getElementById(`deck${deckLetter}BPM`);
    
    if (!bmpElement) {
        console.error(`❌ BPM element not found: deck${deckLetter}BPM`);
        return;
    }
    
    bmpElement.textContent = bpmText;
    
    // Remove all BPM state classes
    bmpElement.classList.remove('detecting', 'detected', 'error', 'synced');
    
    // Add appropriate class and professional styling based on BPM text
    if (bpmText.includes('Analyzing') || bpmText.includes('Detecting') || bpmText.includes('~')) {
        bmpElement.classList.add('detecting');
        bmpElement.style.color = '#f39c12';
        bmpElement.style.background = 'linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(230, 126, 34, 0.2))';
        bmpElement.style.animation = 'professionalBPMPulse 1.5s ease-in-out infinite';
        bmpElement.style.boxShadow = '0 0 10px rgba(243, 156, 18, 0.3)';
    } else if (bpmText.includes('BPM') && !bpmText.includes('--')) {
        bmpElement.classList.add('detected');
        bmpElement.style.color = '#1ed760';
        bmpElement.style.background = 'linear-gradient(135deg, rgba(30, 215, 96, 0.2), rgba(46, 204, 113, 0.2))';
        bmpElement.style.animation = 'none';
        bmpElement.style.boxShadow = '0 0 15px rgba(30, 215, 96, 0.4)';
        
        // Check if decks are in sync for professional sync indicator
        if (areDecksInSync()) {
            bmpElement.classList.add('synced');
            bmpElement.style.animation = 'professionalSyncPulse 2s ease-in-out infinite';
            bmpElement.style.border = '2px solid #1ed760';
        }
    } else {
        bmpElement.classList.add('error');
        bmpElement.style.color = '#666';
        bmpElement.style.background = 'rgba(0, 0, 0, 0.6)';
        bmpElement.style.animation = 'none';
        bmpElement.style.boxShadow = 'none';
    }
    
    // Add professional text styling
    bmpElement.style.borderRadius = '8px';
    bmpElement.style.padding = '6px 12px';
    bmpElement.style.fontFamily = "'Orbitron', monospace";
    bmpElement.style.fontWeight = '700';
    bmpElement.style.textAlign = 'center';
    bmpElement.style.transition = 'all 0.3s ease';
}

// Update deck status with professional multi-channel info
function updateDeckStatus(deckLetter, status) {
    const statusElement = document.getElementById(`deck${deckLetter}TrackStatus`);
    if (!statusElement) return;
    
    let statusText = status;
    
    // Add professional multi-channel info if available
    const deck = deckState[deckLetter];
    if (deck.separatedBuffers && status !== 'Empty') {
        statusText += ' • Professional Multi-Channel';
    }
    
    // Add BPM info if available
    if (deck.bpm && status !== 'Empty') {
        statusText += ` • ${deck.bpm} BPM`;
    }
    
    // Add hand control indicator
    if (deck.handControlled && status !== 'Empty') {
        statusText += ' • 🖐️ Hand Controlled';
    }
    
    statusElement.textContent = statusText;
    
    // Add professional status styling
    statusElement.style.color = getStatusColor(status);
    statusElement.style.fontFamily = "'Orbitron', monospace";
    statusElement.style.fontSize = '0.75rem';
}

// Get professional status color
function getStatusColor(status) {
    const statusColors = {
        'Ready': '#00d4ff',
        'Playing': '#1ed760',
        'Paused': '#f39c12',
        'Stopped': '#666',
        'Finished': '#9b59b6',
        'Empty': '#666',
        'Loading': '#f39c12'
    };
    
    return statusColors[status] || '#e0e0e0';
}

// Update deck UI with professional styling
function updateDeckUI(deckLetter) {
    const deck = deckState[deckLetter];
    
    // Update global playback controls
    updateGlobalPlaybackState();
    
    // Update professional deck overlay classes
    const overlay = document.getElementById(`deck${deckLetter}Overlay`);
    if (overlay) {
        overlay.classList.toggle('loaded', !!deck.track);
        overlay.classList.toggle('playing', deck.isPlaying);
        overlay.classList.toggle('professional-multi-channel', !!deck.separatedBuffers);
        overlay.classList.toggle('hand-controlled', deck.handControlled);
        
        // Add professional glow effect when playing
        if (deck.isPlaying) {
            const deckColor = deckLetter === 'A' ? '#00d4ff' : '#f39c12';
            overlay.style.boxShadow = `0 0 25px ${deckColor}40`;
        } else {
            overlay.style.boxShadow = '';
        }
    }
    
    // Update professional track display styling
    const trackDisplay = document.getElementById(`deck${deckLetter}TrackDisplay`);
    if (trackDisplay) {
        if (deck.track) {
            trackDisplay.style.border = '2px solid rgba(30, 215, 96, 0.6)';
            trackDisplay.style.background = 'linear-gradient(135deg, rgba(30, 215, 96, 0.2), rgba(0, 212, 255, 0.2))';
        } else {
            trackDisplay.style.border = '2px solid rgba(255, 255, 255, 0.2)';
            trackDisplay.style.background = 'rgba(0, 0, 0, 0.3)';
        }
    }
}

// Update deck volume indicator with professional visuals
function updateDeckVolumeIndicator(deckLetter, volumePercent) {
    const volumeFill = document.getElementById(`deck${deckLetter}VolumeFill`);
    const volumeText = document.getElementById(`deck${deckLetter}VolumeText`);
    
    if (volumeFill && volumeText) {
        // Professional smooth animation for volume changes
        volumeFill.style.transition = 'width 0.1s ease, box-shadow 0.3s ease';
        volumeFill.style.width = `${volumePercent}%`;
        
        // Professional color-coded volume levels
        const volumeColor = getVolumeColor(volumePercent);
        volumeFill.style.background = `linear-gradient(90deg, ${volumeColor}, ${volumeColor}88)`;
        
        // Update text with professional hand control indicator
        const deck = deckState[deckLetter];
        let volumeTextContent = `Volume: ${Math.round(volumePercent)}%`;
        
        if (deck.handControlled) {
            volumeTextContent += ' 🖐️ Hand Control';
        }
        
        volumeText.textContent = volumeTextContent;
        volumeText.style.color = volumeColor;
        volumeText.style.fontFamily = "'Orbitron', monospace";
        volumeText.style.fontWeight = '600';
        
        // Professional visual feedback based on volume level
        if (volumePercent > 80) {
            volumeFill.style.boxShadow = `0 0 15px ${volumeColor}60`;
            volumeFill.style.animation = 'professionalVolumeHigh 2s ease-in-out infinite';
        } else if (volumePercent > 50) {
            volumeFill.style.boxShadow = `0 0 10px ${volumeColor}40`;
            volumeFill.style.animation = 'none';
        } else {
            volumeFill.style.boxShadow = 'none';
            volumeFill.style.animation = 'none';
        }
    }
}

// Get professional volume color based on level
function getVolumeColor(volumePercent) {
    if (volumePercent > 80) return '#ff6b6b';      // Red for high volume
    if (volumePercent > 60) return '#f39c12';      // Orange for medium-high
    if (volumePercent > 40) return '#1ed760';      // Green for medium
    if (volumePercent > 20) return '#00d4ff';      // Blue for low-medium
    return '#9b59b6';                              // Purple for low
}

// Add professional loading animation
function addProfessionalLoadingAnimation(deckLetter) {
    const overlay = document.getElementById(`deck${deckLetter}Overlay`);
    if (!overlay) return;
    
    overlay.classList.add('loading-animation');
    
    setTimeout(() => {
        overlay.classList.remove('loading-animation');
        overlay.classList.add('loaded-animation');
        
        setTimeout(() => {
            overlay.classList.remove('loaded-animation');
        }, 1000);
    }, 2000);
}

// Create professional visual feedback for multi-channel processing
function showMultiChannelProcessingFeedback(deckLetter, show = true) {
    const overlay = document.getElementById(`deck${deckLetter}Overlay`);
    
    if (!overlay) return;
    
    const existingIndicator = overlay.querySelector('.professional-processing-indicator');
    
    if (show) {
        if (!existingIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'professional-processing-indicator';
            indicator.innerHTML = `
                <div class="processing-spinner-professional"></div>
                <div class="processing-text-professional">Processing Professional Multi-Channel Audio...</div>
                <div class="processing-channels">
                    <span class="channel-bass">Bass/Kick</span>
                    <span class="channel-drums">Drums</span>
                    <span class="channel-synth">Synth</span>
                </div>
            `;
            overlay.appendChild(indicator);
        }
    } else {
        if (existingIndicator) {
            existingIndicator.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                existingIndicator.remove();
            }, 500);
        }
    }
}

// Enhanced BPM sync indicator with professional styling
function updateBPMSyncIndicator() {
    if (!haveBothDecksBPM()) return;
    
    const syncStatus = getBPMSyncStatus();
    
    // Update individual deck BPM displays with professional sync status
    ['A', 'B'].forEach(deckLetter => {
        const bmpElement = document.getElementById(`deck${deckLetter}BPM`);
        if (bmpElement) {
            if (syncStatus.synced) {
                bmpElement.classList.add('synced');
                bmpElement.style.borderColor = '#1ed760';
                bmpElement.style.animation = 'professionalSyncPulse 2s ease-in-out infinite';
            } else {
                bmpElement.classList.remove('synced');
                bmpElement.style.borderColor = '';
                bmpElement.style.animation = 'none';
            }
        }
    });
    
    // Update global sync status if there's a sync indicator
    const globalSyncIndicator = document.getElementById('globalSyncIndicator');
    if (globalSyncIndicator) {
        globalSyncIndicator.textContent = `${syncStatus.status} (${syncStatus.difference?.toFixed(1)} BPM diff)`;
        globalSyncIndicator.style.color = syncStatus.synced ? '#1ed760' : '#f39c12';
        globalSyncIndicator.style.fontFamily = "'Orbitron', monospace";
        globalSyncIndicator.style.fontWeight = '600';
    }
    
    console.log(`🎵 Professional BPM Sync Status: ${syncStatus.status} (${syncStatus.difference?.toFixed(1)} BPM difference)`);
}

// Enhanced deck display with professional multi-channel information
function updateDeckDisplayEnhanced(deckLetter, track) {
    updateDeckDisplay(deckLetter, track);
    
    if (track) {
        // Add professional processing status
        const deck = deckState[deckLetter];
        if (isSeparationProcessing && isSeparationProcessing(deckLetter)) {
            updateDeckStatus(deckLetter, 'Loading');
            showMultiChannelProcessingFeedback(deckLetter, true);
        } else if (deck.separatedBuffers) {
            updateDeckStatus(deckLetter, 'Ready');
            showMultiChannelProcessingFeedback(deckLetter, false);
        }
        
        // Update BPM with professional channel information
        if (track.bpm) {
            const statusElement = document.getElementById(`deck${deckLetter}TrackStatus`);
            if (statusElement && !statusElement.textContent.includes('BPM')) {
                statusElement.textContent += ` • ${track.bpm} BPM`;
            }
        }
    }
    
    // Update professional sync indicator if both decks have tracks
    if (deckState.A.track && deckState.B.track) {
        updateBPMSyncIndicator();
    }
}

// Add professional CSS animations and styles
function addProfessionalDeckStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .professional-processing-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(26, 26, 26, 0.95));
            backdrop-filter: blur(20px);
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            z-index: 1000;
            border: 2px solid rgba(0, 212, 255, 0.5);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9);
            animation: fadeIn 0.5s ease-out;
        }
        
        .processing-spinner-professional {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0, 212, 255, 0.2);
            border-top: 4px solid #00d4ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        .processing-text-professional {
            color: #00d4ff;
            font-size: 0.9rem;
            font-family: 'Orbitron', monospace;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        
        .processing-channels {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .processing-channels span {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-family: 'Orbitron', monospace;
            font-weight: 600;
        }
        
        .channel-bass {
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
            border: 1px solid rgba(255, 107, 107, 0.4);
        }
        
        .channel-drums {
            background: rgba(243, 156, 18, 0.2);
            color: #f39c12;
            border: 1px solid rgba(243, 156, 18, 0.4);
        }
        
        .channel-synth {
            background: rgba(0, 212, 255, 0.2);
            color: #00d4ff;
            border: 1px solid rgba(0, 212, 255, 0.4);
        }
        
        .professional-mode {
            border-image: linear-gradient(45deg, #ff6b6b, #f39c12, #00d4ff) 1;
            border-image-slice: 1;
        }
        
        .loading-animation {
            animation: professionalLoadPulse 2s ease-in-out infinite;
        }
        
        .loaded-animation {
            animation: professionalLoadComplete 1s ease-out;
        }
        
        @keyframes professionalLoadPulse {
            0%, 100% { 
                transform: scale(1);
                opacity: 1;
            }
            50% { 
                transform: scale(1.02);
                opacity: 0.9;
            }
        }
        
        @keyframes professionalLoadComplete {
            0% { 
                transform: scale(1.05);
                filter: brightness(1.2);
            }
            100% { 
                transform: scale(1);
                filter: brightness(1);
            }
        }
        
        @keyframes professionalChannelPulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
            }
            50% {
                transform: scale(1.1);
                box-shadow: 0 0 25px rgba(0, 212, 255, 0.8);
            }
        }
        
        @keyframes professionalBPMPulse {
            0%, 100% {
                box-shadow: 0 0 10px rgba(243, 156, 18, 0.3);
            }
            50% {
                box-shadow: 0 0 20px rgba(243, 156, 18, 0.6);
            }
        }
        
        @keyframes professionalSyncPulse {
            0%, 100% {
                box-shadow: 0 0 15px rgba(30, 215, 96, 0.4);
                border-color: #1ed760;
            }
            50% {
                box-shadow: 0 0 25px rgba(30, 215, 96, 0.8);
                border-color: #2ecc71;
            }
        }
        
        @keyframes professionalVolumeHigh {
            0%, 100% {
                box-shadow: 0 0 15px rgba(255, 107, 107, 0.6);
            }
            50% {
                box-shadow: 0 0 25px rgba(255, 107, 107, 0.8);
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .artwork-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            background: linear-gradient(135deg, #00d4ff, #f39c12);
            border-radius: 6px;
        }
        
        .hand-controlled {
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.5) !important;
        }
        
        .professional-multi-channel {
            border-style: solid;
            border-width: 3px;
        }
    `;
    document.head.appendChild(style);
}

// Initialize professional deck UI enhancements
function initializeProfessionalDeckUIEnhancements() {
    addProfessionalDeckStyles();
    console.log('✅ Professional deck UI enhancements initialized');
}

// Helper functions for compatibility
function updateChannelIndicators(deckLetter) {
    updateProfessionalChannelIndicators(deckLetter);
}

// BPM-related utility functions (unchanged)
function getDeckBPM(deckLetter) {
    const deck = deckState[deckLetter];
    return deck.bpm || 120;
}

function haveBothDecksBPM() {
    return deckState.A.bpm && deckState.B.bpm;
}

function getBPMDifference() {
    if (!haveBothDecksBPM()) return 0;
    
    const bpmA = getDeckBPM('A');
    const bpmB = getDeckBPM('B');
    
    return Math.abs(bpmA - bpmB);
}

function getBPMSyncRatio() {
    if (!haveBothDecksBPM()) return 1;
    
    const bpmA = getDeckBPM('A');
    const bpmB = getDeckBPM('B');
    
    return bpmA / bpmB;
}

function getBPMSyncStatus() {
    if (!deckState.A.bpm || !deckState.B.bpm) {
        return {
            synced: false,
            difference: null,
            status: 'No BPM data available'
        };
    }
    
    const bpmA = deckState.A.bpm;
    const bpmB = deckState.B.bpm;
    const difference = Math.abs(bpmA - bpmB);
    
    let status = '';
    let synced = false;
    
    if (difference <= 1) {
        status = 'Perfect sync';
        synced = true;
    } else if (difference <= 3) {
        status = 'Very close';
        synced = true;
    } else if (difference <= 5) {
        status = 'Close enough';
        synced = false;
    } else {
        status = 'Needs adjustment';
        synced = false;
    }
    
    return {
        synced,
        difference,
        status,
        bpmA,
        bpmB
    };
}

function areDecksInSync() {
    if (!deckState.A.bpm || !deckState.B.bpm) return false;
    
    const difference = Math.abs(deckState.A.bpm - deckState.B.bpm);
    return difference <= 3; // 3 BPM tolerance for sync
}

// Initialize the professional deck UI system
initializeProfessionalDeckUIEnhancements();

console.log('✅ Professional Multi-Channel Deck UI System Ready');
console.log('🎛️ Enhanced visual feedback for professional multi-channel audio');
console.log('🖐️ Advanced gesture-based channel control indicators');
console.log('🌊 Professional waveform visualization support');
console.log('🎚️ Real-time BPM sync indicators with professional styling');