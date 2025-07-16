// Advanced Audio Splitter - Splits audio into Bass, Drums, and Synth channels

console.log('🎵 Advanced Audio Splitter initialized');

// Audio splitter state
const audioSplitter = {
    A: {
        source: null,
        channels: {
            bass: { 
                enabled: true, 
                gain: null, 
                filters: [],
                analyser: null
            },
            drums: { 
                enabled: true, 
                gain: null, 
                filters: [],
                analyser: null
            },
            synth: { 
                enabled: true, 
                gain: null, 
                filters: [],
                analyser: null
            }
        },
        masterGain: null,
        masterAnalyser: null,
        isSetup: false
    },
    B: {
        source: null,
        channels: {
            bass: { 
                enabled: true, 
                gain: null, 
                filters: [],
                analyser: null
            },
            drums: { 
                enabled: true, 
                gain: null, 
                filters: [],
                analyser: null
            },
            synth: { 
                enabled: true, 
                gain: null, 
                filters: [],
                analyser: null
            }
        },
        masterGain: null,
        masterAnalyser: null,
        isSetup: false
    }
};

// Initialize audio context if needed
function initAudioContext() {
    if (!window.audioContext) {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✅ Audio context created');
    }
}

// Setup audio splitting for a deck
window.setupAudioSplitting = function(deckLetter, audioElement) {
    console.log(`🎛️ Setting up audio splitting for Deck ${deckLetter}`);
    
    initAudioContext();
    
    const deck = audioSplitter[deckLetter];
    
    // Avoid duplicate setup
    if (deck.isSetup && deck.source) {
        console.log('Audio splitting already setup for this deck');
        return;
    }
    
    try {
        // Check if audio element already has a source node
        if (audioElement._sourceNode) {
            console.log('Reusing existing source node');
            deck.source = audioElement._sourceNode;
        } else {
            // Create source from audio element
            deck.source = audioContext.createMediaElementSource(audioElement);
            audioElement._sourceNode = deck.source;
        }
        
        // Create input gain node for splitting
        deck.inputGain = audioContext.createGain();
        deck.inputGain.gain.value = 1;
        deck.source.connect(deck.inputGain);
        
        // Create master gain
        deck.masterGain = audioContext.createGain();
        deck.masterGain.gain.value = 0.8;
        
        // Create master analyser for main waveform
        deck.masterAnalyser = audioContext.createAnalyser();
        deck.masterAnalyser.fftSize = 2048;
        deck.masterAnalyser.smoothingTimeConstant = 0.8;
        
        // Setup bass channel (20-250 Hz)
        setupBassChannel(deck);
        
        // Setup drums channel (200-8000 Hz)
        setupDrumsChannel(deck);
        
        // Setup synth channel (800-20000 Hz)
        setupSynthChannel(deck);
        
        // Connect master gain to analyser then to destination
        deck.masterGain.connect(deck.masterAnalyser);
        deck.masterAnalyser.connect(audioContext.destination);
        
        // Start visualization
        startVisualization(deckLetter);
        
        deck.isSetup = true;
        console.log(`✅ Audio splitting ready for Deck ${deckLetter}`);
        
        // Debug output
        console.log('Audio splitter setup complete:', {
            deck: deckLetter,
            hasInputGain: !!deck.inputGain,
            hasMasterGain: !!deck.masterGain,
            hasMasterAnalyser: !!deck.masterAnalyser,
            channels: {
                bass: !!deck.channels.bass.analyser,
                drums: !!deck.channels.drums.analyser,
                synth: !!deck.channels.synth.analyser
            }
        });
        
    } catch (error) {
        console.error('Error setting up audio splitting:', error);
    }
};

// Setup bass channel with multiple filters for better isolation
function setupBassChannel(deck) {
    const channel = deck.channels.bass;
    
    // Create low-pass filter
    const lowPass = audioContext.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 250;
    lowPass.Q.value = 1;
    
    // Create additional low-shelf for bass boost
    const lowShelf = audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 100;
    lowShelf.gain.value = 3;
    
    // Create gain node
    channel.gain = audioContext.createGain();
    channel.gain.gain.value = channel.enabled ? 1.2 : 0; // Boost bass slightly
    
    // Create analyser
    channel.analyser = audioContext.createAnalyser();
    channel.analyser.fftSize = 512;
    channel.analyser.smoothingTimeConstant = 0.8;
    
    // Connect: inputGain -> lowPass -> lowShelf -> gain -> analyser -> master
    deck.inputGain.connect(lowPass);
    lowPass.connect(lowShelf);
    lowShelf.connect(channel.gain);
    channel.gain.connect(channel.analyser);
    channel.analyser.connect(deck.masterGain);
    
    channel.filters = [lowPass, lowShelf];
}

// Setup drums channel with band-pass filtering
function setupDrumsChannel(deck) {
    const channel = deck.channels.drums;
    
    // Create band-pass filter
    const bandPass = audioContext.createBiquadFilter();
    bandPass.type = 'bandpass';
    bandPass.frequency.value = 2000;
    bandPass.Q.value = 0.5;
    
    // Create high-pass to remove bass
    const highPass = audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 200;
    highPass.Q.value = 0.7;
    
    // Create low-pass to remove high synths
    const lowPass = audioContext.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 8000;
    lowPass.Q.value = 0.7;
    
    // Create gain node
    channel.gain = audioContext.createGain();
    channel.gain.gain.value = channel.enabled ? 1 : 0;
    
    // Create analyser
    channel.analyser = audioContext.createAnalyser();
    channel.analyser.fftSize = 512;
    channel.analyser.smoothingTimeConstant = 0.6;
    
    // Connect: inputGain -> highPass -> bandPass -> lowPass -> gain -> analyser -> master
    deck.inputGain.connect(highPass);
    highPass.connect(bandPass);
    bandPass.connect(lowPass);
    lowPass.connect(channel.gain);
    channel.gain.connect(channel.analyser);
    channel.analyser.connect(deck.masterGain);
    
    channel.filters = [highPass, bandPass, lowPass];
}

// Setup synth channel with high-pass filtering
function setupSynthChannel(deck) {
    const channel = deck.channels.synth;
    
    // Create high-pass filter
    const highPass = audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 800;
    highPass.Q.value = 0.7;
    
    // Create high-shelf for clarity
    const highShelf = audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3000;
    highShelf.gain.value = 2;
    
    // Create gain node
    channel.gain = audioContext.createGain();
    channel.gain.gain.value = channel.enabled ? 0.9 : 0;
    
    // Create analyser
    channel.analyser = audioContext.createAnalyser();
    channel.analyser.fftSize = 512;
    channel.analyser.smoothingTimeConstant = 0.4;
    
    // Connect: inputGain -> highPass -> highShelf -> gain -> analyser -> master
    deck.inputGain.connect(highPass);
    highPass.connect(highShelf);
    highShelf.connect(channel.gain);
    channel.gain.connect(channel.analyser);
    channel.analyser.connect(deck.masterGain);
    
    channel.filters = [highPass, highShelf];
}

// Toggle channel with smooth transition
window.toggleAudioChannel = function(deckLetter, channelName) {
    console.log(`🎛️ Toggling ${channelName} for Deck ${deckLetter}`);
    
    const deck = audioSplitter[deckLetter];
    const channel = deck.channels[channelName];
    
    if (!channel.gain) {
        console.error('Channel not initialized');
        return;
    }
    
    // Toggle state
    channel.enabled = !channel.enabled;
    
    // Smooth gain transition
    const currentTime = audioContext.currentTime;
    const targetGain = channel.enabled ? (channelName === 'bass' ? 1.2 : channelName === 'synth' ? 0.9 : 1) : 0;
    
    channel.gain.gain.cancelScheduledValues(currentTime);
    channel.gain.gain.setValueAtTime(channel.gain.gain.value, currentTime);
    channel.gain.gain.linearRampToValueAtTime(targetGain, currentTime + 0.2);
    
    // Update UI
    updateChannelUI(deckLetter, channelName, channel.enabled);
    
    console.log(`✅ ${channelName} ${channel.enabled ? 'ON' : 'OFF'} for Deck ${deckLetter}`);
};

// Update channel UI
function updateChannelUI(deckLetter, channelName, enabled) {
    const panel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    if (!panel) return;
    
    const button = panel.querySelector(`.channel-btn[data-channel="${channelName}"]`);
    if (button) {
        button.classList.toggle('active', enabled);
        const icon = button.querySelector('.channel-icon');
        if (icon) {
            const colors = {
                bass: '#ff6b6b',
                drums: '#f39c12',
                synth: '#00d4ff'
            };
            icon.style.background = enabled ? colors[channelName] : '#333';
            icon.style.color = enabled ? '#000' : '#666';
            icon.textContent = enabled ? '●' : '○';
        }
    }
}

// Visualization
function startVisualization(deckLetter) {
    const deck = audioSplitter[deckLetter];
    console.log(`🎨 Starting visualization for Deck ${deckLetter}`);
    
    // Hide WaveSurfer containers if they exist to avoid conflicts
    const wavesurferContainers = [
        `deck${deckLetter}WaveformBass`,
        `deck${deckLetter}WaveformDrums`, 
        `deck${deckLetter}WaveformSynth`
    ];
    
    wavesurferContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            // Remove any WaveSurfer elements
            const wavesurferElements = container.querySelectorAll('wave, canvas:not(.channel-waveform-canvas)');
            wavesurferElements.forEach(el => el.remove());
        }
    });
    
    function animate() {
        // Draw bass waveform
        drawChannelWaveform(deckLetter, 'bass', '#ff6b6b');
        
        // Draw drums waveform
        drawChannelWaveform(deckLetter, 'drums', '#f39c12');
        
        // Draw synth waveform
        drawChannelWaveform(deckLetter, 'synth', '#00d4ff');
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Draw waveform for a channel
function drawChannelWaveform(deckLetter, channelName, color) {
    const deck = audioSplitter[deckLetter];
    const channel = deck.channels[channelName];
    
    if (!channel.analyser) return;
    
    // Find the correct canvas element based on our HTML structure
    const canvasId = `waveform${channelName.charAt(0).toUpperCase() + channelName.slice(1)}${deckLetter}`;
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.warn(`Canvas not found: ${canvasId} for ${channelName} on Deck ${deckLetter}`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Get canvas dimensions
    const width = canvas.width = canvas.offsetWidth || 280;
    const height = canvas.height = canvas.offsetHeight || 40;
    
    if (width === 0 || height === 0) {
        console.warn(`Canvas has no dimensions: ${canvasId}`);
        return;
    }
    
    // Get waveform data
    const bufferLength = channel.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    channel.analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas with slight fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw bars
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.9;
        
        if (channel.enabled) {
            const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + '40');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = '#333';
        }
        
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
        if (x > width) break;
    }
}

// Override the loadTrackToSpecificDeck to add audio splitting
const originalLoader = window.loadTrackToSpecificDeck;
window.loadTrackToSpecificDeck = async function(track, deckLetter) {
    console.log(`🎵 Advanced audio splitter intercepting track load for Deck ${deckLetter}`);
    await originalLoader(track, deckLetter);
    
    // Setup audio splitting after track loads
    setTimeout(() => {
        const simpleDeck = window.simpleDeckData[deckLetter];
        if (simpleDeck && simpleDeck.audio) {
            // Disable WaveSurfer for channel waveforms to avoid conflicts
            if (window.deckState && window.deckState[deckLetter] && window.deckState[deckLetter].wavesurfers) {
                console.log(`🛑 Disabling WaveSurfer for Deck ${deckLetter} channel waveforms`);
                const wavesurfers = window.deckState[deckLetter].wavesurfers;
                Object.keys(wavesurfers).forEach(channel => {
                    if (wavesurfers[channel] && typeof wavesurfers[channel].destroy === 'function') {
                        wavesurfers[channel].destroy();
                    }
                });
                delete window.deckState[deckLetter].wavesurfers;
            }
            
            setupAudioSplitting(deckLetter, simpleDeck.audio);
        }
    }, 100);
};

// Add event listeners when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
    setupEventListeners();
}

function setupEventListeners() {
    // Add click handlers for all channel buttons
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const channelName = this.getAttribute('data-channel');
            const panel = this.closest('.deck-overlay-panel');
            const deckLetter = panel.classList.contains('left') ? 'A' : 'B';
            
            console.log(`Channel button clicked: ${channelName} on Deck ${deckLetter}`);
            toggleAudioChannel(deckLetter, channelName);
        };
    });
    
    console.log('✅ Channel button listeners attached');
}

// Export for debugging
window.audioSplitter = audioSplitter;

// Debug function for waveforms
window.debugWaveforms = function(deckLetter) {
    console.log(`=== Waveform Debug for Deck ${deckLetter} ===`);
    
    // Check canvases
    const channels = ['bass', 'drums', 'synth'];
    channels.forEach(channel => {
        const canvasId = `waveform${channel.charAt(0).toUpperCase() + channel.slice(1)}${deckLetter}`;
        const canvas = document.getElementById(canvasId);
        console.log(`${channel} canvas (${canvasId}):`, {
            exists: !!canvas,
            width: canvas?.width,
            height: canvas?.height,
            parent: canvas?.parentElement?.className
        });
    });
    
    // Check audio splitter state
    const deck = audioSplitter[deckLetter];
    console.log('Audio splitter state:', {
        isSetup: deck.isSetup,
        hasSource: !!deck.source,
        hasMasterGain: !!deck.masterGain,
        channels: {
            bass: { enabled: deck.channels.bass.enabled, hasAnalyser: !!deck.channels.bass.analyser },
            drums: { enabled: deck.channels.drums.enabled, hasAnalyser: !!deck.channels.drums.analyser },
            synth: { enabled: deck.channels.synth.enabled, hasAnalyser: !!deck.channels.synth.analyser }
        }
    });
};

console.log('✅ Advanced Audio Splitter ready');