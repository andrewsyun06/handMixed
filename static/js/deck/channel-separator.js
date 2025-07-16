// Channel Separator - Audio channel separation for Bass, Drums, and Synth

console.log('🎛️ Channel Separator initialized');

// Channel configuration
const channelConfig = {
    bass: {
        name: 'Bass/Kick',
        color: '#ff6b6b',
        frequency: { low: 20, high: 250 },
        Q: 1.0
    },
    drums: {
        name: 'Drums',
        color: '#f39c12',
        frequency: { low: 200, high: 5000 },
        Q: 0.7
    },
    synth: {
        name: 'Synth',
        color: '#00d4ff',
        frequency: { low: 800, high: 20000 },
        Q: 1.0
    }
};

// Enhanced deck data with channels
const channelDeckData = {
    A: {
        channels: {
            bass: { enabled: true, gainNode: null, filter: null, analyser: null },
            drums: { enabled: true, gainNode: null, filter: null, analyser: null },
            synth: { enabled: true, gainNode: null, filter: null, analyser: null }
        },
        masterGain: null,
        source: null
    },
    B: {
        channels: {
            bass: { enabled: true, gainNode: null, filter: null, analyser: null },
            drums: { enabled: true, gainNode: null, filter: null, analyser: null },
            synth: { enabled: true, gainNode: null, filter: null, analyser: null }
        },
        masterGain: null,
        source: null
    }
};

// Setup channel separation for a deck
window.setupChannelSeparation = function(deckLetter, audioElement) {
    console.log(`🎛️ Setting up channel separation for Deck ${deckLetter}`);
    
    const deck = channelDeckData[deckLetter];
    const simpleDeck = window.simpleDeckData[deckLetter];
    
    if (!audioElement || !window.audioContext) {
        console.error('Audio element or context not available');
        return;
    }
    
    try {
        // Create media element source
        if (!deck.source) {
            deck.source = audioContext.createMediaElementSource(audioElement);
        }
        
        // Create master gain
        deck.masterGain = audioContext.createGain();
        deck.masterGain.gain.value = 0.7;
        
        // Setup each channel
        ['bass', 'drums', 'synth'].forEach(channelName => {
            setupSingleChannel(deckLetter, channelName, deck.source);
        });
        
        // Connect master to destination
        deck.masterGain.connect(audioContext.destination);
        
        // Start visualizations
        startChannelVisualizations(deckLetter);
        
        console.log(`✅ Channel separation ready for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Error setting up channel separation:`, error);
    }
};

// Setup single channel
function setupSingleChannel(deckLetter, channelName, source) {
    const deck = channelDeckData[deckLetter];
    const channel = deck.channels[channelName];
    const config = channelConfig[channelName];
    
    // Create filter
    channel.filter = audioContext.createBiquadFilter();
    
    if (channelName === 'bass') {
        channel.filter.type = 'lowpass';
        channel.filter.frequency.value = config.frequency.high;
    } else if (channelName === 'drums') {
        channel.filter.type = 'bandpass';
        channel.filter.frequency.value = (config.frequency.low + config.frequency.high) / 2;
        channel.filter.Q.value = config.Q;
    } else if (channelName === 'synth') {
        channel.filter.type = 'highpass';
        channel.filter.frequency.value = config.frequency.low;
    }
    
    // Create gain node
    channel.gainNode = audioContext.createGain();
    channel.gainNode.gain.value = channel.enabled ? 1 : 0;
    
    // Create analyser for visualization
    channel.analyser = audioContext.createAnalyser();
    channel.analyser.fftSize = 256;
    
    // Connect nodes: source -> filter -> gain -> analyser -> master
    source.connect(channel.filter);
    channel.filter.connect(channel.gainNode);
    channel.gainNode.connect(channel.analyser);
    channel.analyser.connect(deck.masterGain);
}

// Toggle channel on/off
window.toggleChannel = function(deckLetter, channelName) {
    console.log(`🎛️ Toggling ${channelName} for Deck ${deckLetter}`);
    
    const deck = channelDeckData[deckLetter];
    const channel = deck.channels[channelName];
    
    if (!channel || !channel.gainNode) {
        console.error('Channel not initialized');
        return;
    }
    
    // Toggle state
    channel.enabled = !channel.enabled;
    
    // Animate gain change
    const targetGain = channel.enabled ? 1 : 0;
    channel.gainNode.gain.linearRampToValueAtTime(targetGain, audioContext.currentTime + 0.1);
    
    // Update UI
    updateChannelButton(deckLetter, channelName, channel.enabled);
    
    console.log(`✅ ${channelName} ${channel.enabled ? 'enabled' : 'disabled'} for Deck ${deckLetter}`);
};

// Update channel button UI
function updateChannelButton(deckLetter, channelName, enabled) {
    const panel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    if (!panel) return;
    
    const button = panel.querySelector(`.channel-btn[data-channel="${channelName}"]`);
    if (button) {
        button.classList.toggle('active', enabled);
        const icon = button.querySelector('.channel-icon');
        if (icon) {
            icon.style.background = enabled ? channelConfig[channelName].color : '#333';
            icon.style.color = enabled ? '#000' : '#666';
        }
    }
}

// Start channel visualizations
function startChannelVisualizations(deckLetter) {
    const deck = channelDeckData[deckLetter];
    
    // Animation loop for waveforms
    function drawWaveforms() {
        ['bass', 'drums', 'synth'].forEach(channelName => {
            drawChannelWaveform(deckLetter, channelName);
        });
        
        requestAnimationFrame(drawWaveforms);
    }
    
    drawWaveforms();
}

// Draw individual channel waveform
function drawChannelWaveform(deckLetter, channelName) {
    const deck = channelDeckData[deckLetter];
    const channel = deck.channels[channelName];
    
    if (!channel.analyser) return;
    
    const canvas = document.getElementById(`waveform${channelName.charAt(0).toUpperCase() + channelName.slice(1)}${deckLetter}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    // Get frequency data
    const bufferLength = channel.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    channel.analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw bars
    const barWidth = width / bufferLength * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, channelConfig[channelName].color);
        gradient.addColorStop(1, channelConfig[channelName].color + '80');
        
        ctx.fillStyle = channel.enabled ? gradient : '#333';
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
    }
}

// Enhanced loadTrackToSpecificDeck to include channel separation
const originalLoadTrack = window.loadTrackToSpecificDeck;
window.loadTrackToSpecificDeck = async function(track, deckLetter) {
    // Call original function
    await originalLoadTrack(track, deckLetter);
    
    // Wait a bit for audio to be ready
    setTimeout(() => {
        const simpleDeck = window.simpleDeckData[deckLetter];
        if (simpleDeck && simpleDeck.audio) {
            setupChannelSeparation(deckLetter, simpleDeck.audio);
        }
    }, 100);
};

// Add click handlers for channel buttons
document.addEventListener('DOMContentLoaded', function() {
    // Set up channel button listeners
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const channel = this.dataset.channel;
            const deckLetter = this.closest('.deck-overlay-panel').classList.contains('left') ? 'A' : 'B';
            toggleChannel(deckLetter, channel);
        });
    });
    
    console.log('✅ Channel controls ready');
});

// Export for debugging
window.channelDeckData = channelDeckData;

console.log('✅ Channel Separator ready');