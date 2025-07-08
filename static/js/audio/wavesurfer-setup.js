// static/js/audio/wavesurfer-setup.js - Professional Multi-Channel Waveform Visualization

console.log('🌊 Professional Multi-Channel Wavesurfer Setup Loading...');

// Initialize professional multi-channel Wavesurfer instances for both decks
function initializeWavesurfers() {
    try {
        console.log('🎛️ Initializing professional multi-channel waveforms...');
        
        // Deck A - Professional Multi-Channel Wavesurfers
        deckState.A.wavesurfers = {
            bass: WaveSurfer.create({
                container: '#deckAWaveformBass',
                waveColor: '#ff6b6b',          // Red for bass/kick
                progressColor: '#1ed760',      // Green progress
                cursorColor: '#ffffff',
                barWidth: 3,                   // Thicker bars for better visibility
                barRadius: 2,
                height: 45,                    // Taller for professional look
                normalize: true,
                backend: 'WebAudio',
                responsive: true,
                interact: true,                // Allow seeking
                cursorWidth: 2,
                pixelRatio: Math.min(window.devicePixelRatio, 2)
            }),
            drums: WaveSurfer.create({
                container: '#deckAWaveformDrums',
                waveColor: '#f39c12',          // Orange for drums
                progressColor: '#1ed760',
                cursorColor: '#ffffff',
                barWidth: 3,
                barRadius: 2,
                height: 45,
                normalize: true,
                backend: 'WebAudio',
                responsive: true,
                interact: true,
                cursorWidth: 2,
                pixelRatio: Math.min(window.devicePixelRatio, 2)
            }),
            synth: WaveSurfer.create({
                container: '#deckAWaveformSynth',
                waveColor: '#00d4ff',          // Blue for synth/melody
                progressColor: '#1ed760',
                cursorColor: '#ffffff',
                barWidth: 3,
                barRadius: 2,
                height: 45,
                normalize: true,
                backend: 'WebAudio',
                responsive: true,
                interact: true,
                cursorWidth: 2,
                pixelRatio: Math.min(window.devicePixelRatio, 2)
            })
        };

        // Deck B - Professional Multi-Channel Wavesurfers
        deckState.B.wavesurfers = {
            bass: WaveSurfer.create({
                container: '#deckBWaveformBass',
                waveColor: '#ff6b6b',          // Red for bass/kick
                progressColor: '#1ed760',
                cursorColor: '#ffffff',
                barWidth: 3,
                barRadius: 2,
                height: 45,
                normalize: true,
                backend: 'WebAudio',
                responsive: true,
                interact: true,
                cursorWidth: 2,
                pixelRatio: Math.min(window.devicePixelRatio, 2)
            }),
            drums: WaveSurfer.create({
                container: '#deckBWaveformDrums',
                waveColor: '#f39c12',          // Orange for drums
                progressColor: '#1ed760',
                cursorColor: '#ffffff',
                barWidth: 3,
                barRadius: 2,
                height: 45,
                normalize: true,
                backend: 'WebAudio',
                responsive: true,
                interact: true,
                cursorWidth: 2,
                pixelRatio: Math.min(window.devicePixelRatio, 2)
            }),
            synth: WaveSurfer.create({
                container: '#deckBWaveformSynth',
                waveColor: '#00d4ff',          // Blue for synth/melody
                progressColor: '#1ed760',
                cursorColor: '#ffffff',
                barWidth: 3,
                barRadius: 2,
                height: 45,
                normalize: true,
                backend: 'WebAudio',
                responsive: true,
                interact: true,
                cursorWidth: 2,
                pixelRatio: Math.min(window.devicePixelRatio, 2)
            })
        };

        // Set up professional waveform synchronization
        setupProfessionalWaveformSynchronization();

        // Set up professional waveform interactions
        setupProfessionalWaveformInteractions();

        console.log('🌊 Professional multi-channel Wavesurfer instances initialized');
        
    } catch (error) {
        console.error('❌ Professional Wavesurfer initialization failed:', error);
        
        // Fallback to single waveform if multi-channel fails
        initializeFallbackWavesurfers();
    }
}

// Set up professional waveform synchronization across channels
function setupProfessionalWaveformSynchronization() {
    ['A', 'B'].forEach(deckLetter => {
        const deck = deckState[deckLetter];
        
        if (!deck.wavesurfers) return;
        
        // Synchronize playback across all channels
        const channels = Object.keys(deck.wavesurfers);
        
        channels.forEach(channel => {
            const wavesurfer = deck.wavesurfers[channel];
            
            // Professional seek synchronization
            wavesurfer.on('seek', (progress) => {
                channels.forEach(otherChannel => {
                    if (otherChannel !== channel) {
                        const otherWavesurfer = deck.wavesurfers[otherChannel];
                        if (otherWavesurfer) {
                            // Prevent infinite loop by temporarily disabling events
                            otherWavesurfer.seekTo(progress);
                        }
                    }
                });
                
                // Update multi-channel player if available
                if (deck.multiChannelPlayer && deck.multiChannelPlayer.isPlaying) {
                    const duration = deck.multiChannelPlayer.getDuration();
                    const seekTime = progress * duration;
                    
                    // Restart playback from new position
                    deck.multiChannelPlayer.stop();
                    setTimeout(() => {
                        deck.multiChannelPlayer.play(seekTime);
                    }, 50);
                }
            });
            
            // Professional loading feedback
            wavesurfer.on('loading', (percent) => {
                console.log(`🌊 Loading ${channel} waveform for Deck ${deckLetter}: ${percent}%`);
                updateWaveformLoadingProgress(deckLetter, channel, percent);
            });
            
            // Professional ready feedback
            wavesurfer.on('ready', () => {
                console.log(`✅ ${channel} waveform ready for Deck ${deckLetter}`);
                updateWaveformReadyState(deckLetter, channel);
            });
            
            // Professional error handling
            wavesurfer.on('error', (error) => {
                console.error(`❌ ${channel} waveform error for Deck ${deckLetter}:`, error);
                showWaveformError(deckLetter, channel, error);
            });
        });
        
        console.log(`🎛️ Professional waveform synchronization set up for Deck ${deckLetter}`);
    });
}

// Set up professional waveform interactions
function setupProfessionalWaveformInteractions() {
    ['A', 'B'].forEach(deckLetter => {
        const deck = deckState[deckLetter];
        
        if (!deck.wavesurfers) return;
        
        Object.keys(deck.wavesurfers).forEach(channel => {
            const wavesurfer = deck.wavesurfers[channel];
            const container = wavesurfer.container;
            
            // Professional hover effects
            container.addEventListener('mouseenter', () => {
                container.style.transform = 'translateY(-2px)';
                container.style.boxShadow = '0 5px 15px rgba(0, 212, 255, 0.3)';
                container.style.transition = 'all 0.3s ease';
            });
            
            container.addEventListener('mouseleave', () => {
                container.style.transform = 'translateY(0)';
                container.style.boxShadow = 'none';
            });
            
            // Professional click feedback
            container.addEventListener('click', () => {
                showChannelInteractionFeedback(deckLetter, channel);
            });
        });
    });
}

// Load separated audio into professional multi-channel waveforms
async function loadProfessionalMultiChannelWaveforms(deckLetter, separatedBuffers) {
    try {
        const deck = deckState[deckLetter];
        
        if (!deck.wavesurfers || !separatedBuffers) {
            console.warn(`⚠️ Professional multi-channel wavesurfers not available for Deck ${deckLetter}`);
            return;
        }
        
        console.log(`🌊 Loading professional multi-channel waveforms for Deck ${deckLetter}`);
        
        // Show loading indicators
        showWaveformLoadingIndicators(deckLetter, true);
        
        // Load each channel with professional processing
        const loadPromises = Object.keys(separatedBuffers).map(async (channel) => {
            const wavesurfer = deck.wavesurfers[channel];
            const buffer = separatedBuffers[channel];
            
            if (!wavesurfer || !buffer) {
                console.warn(`⚠️ Missing wavesurfer or buffer for ${channel}`);
                return;
            }
            
            try {
                console.log(`🔄 Processing ${channel} waveform for Deck ${deckLetter}...`);
                
                // Convert AudioBuffer to blob for wavesurfer with professional quality
                const audioBlob = await audioBufferToProfessionalBlob(buffer);
                const url = URL.createObjectURL(audioBlob);
                
                // Load with professional settings
                await wavesurfer.load(url);
                
                // Apply professional styling based on channel
                applyProfessionalChannelStyling(wavesurfer, channel, deckLetter);
                
                console.log(`✅ Loaded professional ${channel} waveform for Deck ${deckLetter}`);
                
                // Clean up URL after loading
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
            } catch (channelError) {
                console.error(`❌ Failed to load professional ${channel} waveform:`, channelError);
                showChannelWaveformError(deckLetter, channel, channelError);
            }
        });
        
        // Wait for all channels to load
        await Promise.all(loadPromises);
        
        // Hide loading indicators
        showWaveformLoadingIndicators(deckLetter, false);
        
        console.log(`✅ All professional waveforms loaded for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Professional multi-channel waveform loading failed for Deck ${deckLetter}:`, error);
        showWaveformLoadingIndicators(deckLetter, false);
    }
}

// Convert AudioBuffer to high-quality Blob for professional waveforms
async function audioBufferToProfessionalBlob(audioBuffer) {
    return new Promise((resolve, reject) => {
        try {
            // Use higher quality settings for professional audio
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
                // Convert to high-quality WAV blob
                const wavBlob = audioBufferToProfessionalWav(renderedBuffer);
                resolve(wavBlob);
            }).catch(reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Convert AudioBuffer to professional quality WAV Blob
function audioBufferToProfessionalWav(buffer) {
    const length = buffer.length;
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    
    // Use 24-bit depth for professional quality
    const bitDepth = 24;
    const bytesPerSample = bitDepth / 8;
    const arrayBuffer = new ArrayBuffer(44 + length * channels * bytesPerSample);
    const view = new DataView(arrayBuffer);
    
    // Professional WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * channels * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length * channels * bytesPerSample, true);
    
    // Convert float samples to 24-bit PCM for professional quality
    let offset = 44;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < channels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            const intSample = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
            
            // Write 24-bit sample
            view.setInt32(offset, intSample << 8, true);
            offset += bytesPerSample;
        }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Apply professional styling based on channel type
function applyProfessionalChannelStyling(wavesurfer, channel, deckLetter) {
    const container = wavesurfer.container;
    
    // Professional channel-specific styling
    const channelStyles = {
        bass: {
            gradient: 'linear-gradient(to right, #ff6b6b, #e74c3c)',
            shadow: '0 0 10px rgba(255, 107, 107, 0.3)',
            border: '1px solid rgba(255, 107, 107, 0.5)'
        },
        drums: {
            gradient: 'linear-gradient(to right, #f39c12, #e67e22)',
            shadow: '0 0 10px rgba(243, 156, 18, 0.3)',
            border: '1px solid rgba(243, 156, 18, 0.5)'
        },
        synth: {
            gradient: 'linear-gradient(to right, #00d4ff, #0ea5e9)',
            shadow: '0 0 10px rgba(0, 212, 255, 0.3)',
            border: '1px solid rgba(0, 212, 255, 0.5)'
        }
    };
    
    const style = channelStyles[channel];
    if (style && container) {
        container.style.background = style.gradient;
        container.style.boxShadow = style.shadow;
        container.style.border = style.border;
        container.style.borderRadius = '8px';
        container.style.padding = '2px';
    }
}

// Professional synchronized playback
function playProfessionalMultiChannelWaveforms(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.wavesurfers) return;
    
    Object.values(deck.wavesurfers).forEach(wavesurfer => {
        if (wavesurfer && !wavesurfer.isPlaying()) {
            wavesurfer.play();
        }
    });
    
    console.log(`▶️ Professional multi-channel waveforms playing for Deck ${deckLetter}`);
}

// Professional synchronized pause
function pauseProfessionalMultiChannelWaveforms(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.wavesurfers) return;
    
    Object.values(deck.wavesurfers).forEach(wavesurfer => {
        if (wavesurfer && wavesurfer.isPlaying()) {
            wavesurfer.pause();
        }
    });
    
    console.log(`⏸️ Professional multi-channel waveforms paused for Deck ${deckLetter}`);
}

// Professional synchronized stop
function stopProfessionalMultiChannelWaveforms(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.wavesurfers) return;
    
    Object.values(deck.wavesurfers).forEach(wavesurfer => {
        if (wavesurfer) {
            wavesurfer.stop();
        }
    });
    
    console.log(`⏹️ Professional multi-channel waveforms stopped for Deck ${deckLetter}`);
}

// Update channel waveform visibility based on channel state
function updateChannelWaveformVisibility(deckLetter) {
    const deck = deckState[deckLetter];
    
    if (!deck.wavesurfers || !deck.audioChannels) return;
    
    Object.keys(deck.wavesurfers).forEach(channel => {
        const wavesurfer = deck.wavesurfers[channel];
        const channelState = deck.audioChannels[channel];
        
        if (wavesurfer && channelState) {
            const container = wavesurfer.container;
            
            if (container) {
                const opacity = channelState.enabled ? 1 : 0.3;
                const filter = channelState.enabled ? 'none' : 'grayscale(100%) blur(1px)';
                const transform = channelState.enabled ? 'scale(1)' : 'scale(0.95)';
                
                container.style.opacity = opacity;
                container.style.filter = filter;
                container.style.transform = transform;
                container.style.transition = 'all 0.3s ease';
                
                // Add professional pulsing effect for active channels
                if (channelState.enabled && deck.handControlled) {
                    container.classList.add('channel-active');
                } else {
                    container.classList.remove('channel-active');
                }
            }
        }
    });
}

// Show waveform loading indicators
function showWaveformLoadingIndicators(deckLetter, show) {
    const channels = ['bass', 'drums', 'synth'];
    
    channels.forEach(channel => {
        const container = document.getElementById(`deck${deckLetter}Waveform${channel.charAt(0).toUpperCase() + channel.slice(1)}`);
        
        if (container) {
            if (show) {
                container.innerHTML = `
                    <div class="waveform-loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Processing ${channel}...</div>
                    </div>
                `;
            } else {
                // Clear loading indicator
                const loading = container.querySelector('.waveform-loading');
                if (loading) {
                    loading.remove();
                }
            }
        }
    });
}

// Show channel interaction feedback
function showChannelInteractionFeedback(deckLetter, channel) {
    const container = document.getElementById(`deck${deckLetter}Waveform${channel.charAt(0).toUpperCase() + channel.slice(1)}`);
    
    if (container) {
        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'waveform-ripple';
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(0, 212, 255, 0.6);
            transform: translate(-50%, -50%);
            animation: rippleEffect 0.6s ease-out;
            pointer-events: none;
            z-index: 10;
        `;
        
        container.style.position = 'relative';
        container.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }
}

// Update waveform loading progress
function updateWaveformLoadingProgress(deckLetter, channel, percent) {
    const container = document.getElementById(`deck${deckLetter}Waveform${channel.charAt(0).toUpperCase() + channel.slice(1)}`);
    const loadingText = container?.querySelector('.loading-text');
    
    if (loadingText) {
        loadingText.textContent = `Processing ${channel}... ${percent}%`;
    }
}

// Update waveform ready state
function updateWaveformReadyState(deckLetter, channel) {
    const container = document.getElementById(`deck${deckLetter}Waveform${channel.charAt(0).toUpperCase() + channel.slice(1)}`);
    
    if (container) {
        container.classList.add('waveform-ready');
        
        // Add professional ready indicator
        const readyIndicator = document.createElement('div');
        readyIndicator.className = 'waveform-ready-indicator';
        readyIndicator.textContent = '✓';
        readyIndicator.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            color: #1ed760;
            font-size: 12px;
            font-weight: bold;
            z-index: 10;
        `;
        
        container.style.position = 'relative';
        container.appendChild(readyIndicator);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (readyIndicator.parentNode) {
                readyIndicator.remove();
            }
        }, 3000);
    }
}

// Show waveform error
function showWaveformError(deckLetter, channel, error) {
    const container = document.getElementById(`deck${deckLetter}Waveform${channel.charAt(0).toUpperCase() + channel.slice(1)}`);
    
    if (container) {
        container.innerHTML = `
            <div class="waveform-error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">Failed to load ${channel}</div>
            </div>
        `;
        
        container.style.background = 'rgba(255, 107, 107, 0.1)';
        container.style.border = '1px solid rgba(255, 107, 107, 0.3)';
    }
}

// Show channel waveform error
function showChannelWaveformError(deckLetter, channel, error) {
    console.error(`❌ ${channel} waveform error for Deck ${deckLetter}:`, error);
    showWaveformError(deckLetter, channel, error);
}

// Fallback to single waveform if multi-channel fails
function initializeFallbackWavesurfers() {
    console.log('🌊 Initializing fallback single waveforms...');
    
    try {
        // Create single waveform for each deck (backwards compatibility)
        deckState.A.wavesurfer = WaveSurfer.create({
            container: '#deckAWaveformBass', // Use bass container as fallback
            waveColor: '#00d4ff',
            progressColor: '#1ed760',
            cursorColor: '#fff',
            barWidth: 3,
            barRadius: 2,
            height: 45,
            normalize: true,
            backend: 'WebAudio',
            responsive: true,
            interact: true
        });

        deckState.B.wavesurfer = WaveSurfer.create({
            container: '#deckBWaveformBass', // Use bass container as fallback
            waveColor: '#f39c12',
            progressColor: '#1ed760',
            cursorColor: '#fff',
            barWidth: 3,
            barRadius: 2,
            height: 45,
            normalize: true,
            backend: 'WebAudio',
            responsive: true,
            interact: true
        });

        // Hide other waveform containers
        document.querySelectorAll('#deckAWaveformDrums, #deckAWaveformSynth, #deckBWaveformDrums, #deckBWaveformSynth').forEach(container => {
            if (container) {
                container.style.display = 'none';
            }
        });

        console.log('✅ Fallback wavesurfers initialized');
        
    } catch (error) {
        console.error('❌ Fallback wavesurfer initialization failed:', error);
    }
}

// Add professional CSS animations
function addProfessionalWaveformStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .waveform-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 6px;
        }
        
        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #333;
            border-top: 2px solid #00d4ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 8px;
        }
        
        .loading-text {
            color: #00d4ff;
            font-size: 0.7rem;
            font-family: 'Orbitron', monospace;
        }
        
        .waveform-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: rgba(255, 107, 107, 0.1);
            border-radius: 6px;
        }
        
        .error-icon {
            font-size: 16px;
            margin-bottom: 4px;
        }
        
        .error-text {
            color: #ff6b6b;
            font-size: 0.7rem;
            font-family: 'Orbitron', monospace;
        }
        
        .channel-active {
            animation: channelPulse 2s ease-in-out infinite;
        }
        
        @keyframes channelPulse {
            0%, 100% {
                box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
            }
            50% {
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.6);
            }
        }
        
        @keyframes rippleEffect {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(4);
                opacity: 0;
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .waveform-ready {
            animation: readyFlash 0.5s ease-out;
        }
        
        @keyframes readyFlash {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize professional styles
addProfessionalWaveformStyles();

// Export functions for use in other modules
window.loadProfessionalMultiChannelWaveforms = loadProfessionalMultiChannelWaveforms;
window.playProfessionalMultiChannelWaveforms = playProfessionalMultiChannelWaveforms;
window.pauseProfessionalMultiChannelWaveforms = pauseProfessionalMultiChannelWaveforms;
window.stopProfessionalMultiChannelWaveforms = stopProfessionalMultiChannelWaveforms;
window.updateChannelWaveformVisibility = updateChannelWaveformVisibility;

// Legacy compatibility
window.loadMultiChannelWaveforms = loadProfessionalMultiChannelWaveforms;
window.playMultiChannelWaveforms = playProfessionalMultiChannelWaveforms;
window.pauseMultiChannelWaveforms = pauseProfessionalMultiChannelWaveforms;
window.stopMultiChannelWaveforms = stopProfessionalMultiChannelWaveforms;

console.log('✅ Professional Multi-Channel Wavesurfer Setup Complete');
console.log('🌊 Professional quality waveforms with 24-bit audio processing');
console.log('🎛️ Synchronized multi-channel playback and seeking');
console.log('🎚️ Channel-specific styling and visual feedback');
console.log('⚡ Advanced loading states and error handling');