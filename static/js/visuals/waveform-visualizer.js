// Waveform Visualizer for Multi-Channel Audio
console.log('🌊 Waveform Visualizer Loading...');

// Waveform visualization instances
const waveformVisualizers = {
    A: {
        bass: null,
        drums: null,
        synth: null,
        analyzer: null
    },
    B: {
        bass: null,
        drums: null,
        synth: null,
        analyzer: null
    }
};

// Initialize waveform visualizers for a deck
function initializeWaveformVisualizers(deckLetter) {
    console.log(`🌊 Initializing waveform visualizers for Deck ${deckLetter}`);
    
    try {
        const deck = deckPlayers[deckLetter];
        const visualizer = waveformVisualizers[deckLetter];
        
        if (!audioContext || !deck.gainNode) {
            console.warn('Audio context or gain node not available for waveform visualization');
            return;
        }
        
        // Create analyzer node
        visualizer.analyzer = audioContext.createAnalyser();
        visualizer.analyzer.fftSize = 256;
        visualizer.analyzer.smoothingTimeConstant = 0.8;
        
        // Connect the analyzer to the deck's gain node
        deck.gainNode.connect(visualizer.analyzer);
        
        // Initialize individual channel visualizers
        initializeChannelWaveform(deckLetter, 'bass');
        initializeChannelWaveform(deckLetter, 'drums');
        initializeChannelWaveform(deckLetter, 'synth');
        
        // Start the visualization loop
        startWaveformAnimation(deckLetter);
        
        console.log(`✅ Waveform visualizers initialized for Deck ${deckLetter}`);
        
    } catch (error) {
        console.error(`❌ Failed to initialize waveform visualizers for Deck ${deckLetter}:`, error);
    }
}

// Initialize waveform for a specific channel
function initializeChannelWaveform(deckLetter, channel) {
    const containerId = `waveform${channel.charAt(0).toUpperCase() + channel.slice(1)}${deckLetter}`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`Waveform container not found: ${containerId}`);
        return;
    }
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.className = 'waveform-canvas';
    canvas.width = container.offsetWidth * 2; // High DPI
    canvas.height = container.offsetHeight * 2;
    canvas.style.width = container.offsetWidth + 'px';
    canvas.style.height = container.offsetHeight + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2); // High DPI scaling
    
    container.innerHTML = '';
    container.appendChild(canvas);
    
    // Store canvas and context
    const visualizer = waveformVisualizers[deckLetter];
    visualizer[channel] = {
        canvas: canvas,
        ctx: ctx,
        container: container,
        animationId: null
    };
    
    console.log(`Canvas created for ${deckLetter} ${channel}: ${canvas.width}x${canvas.height}`);
}

// Start waveform animation loop
function startWaveformAnimation(deckLetter) {
    const visualizer = waveformVisualizers[deckLetter];
    
    function animate() {
        if (!visualizer.analyzer) return;
        
        // Get frequency data
        const bufferLength = visualizer.analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        visualizer.analyzer.getByteFrequencyData(dataArray);
        
        // Draw each channel's waveform
        drawChannelWaveform(deckLetter, 'bass', dataArray, 0, 32);     // Low frequencies
        drawChannelWaveform(deckLetter, 'drums', dataArray, 16, 80);   // Mid frequencies  
        drawChannelWaveform(deckLetter, 'synth', dataArray, 64, 128);  // High frequencies
        
        // Continue animation if deck is playing
        const deck = deckPlayers[deckLetter];
        if (deck && deck.isPlaying) {
            visualizer.animationId = requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Draw waveform for a specific channel
function drawChannelWaveform(deckLetter, channel, dataArray, startFreq, endFreq) {
    const visualizer = waveformVisualizers[deckLetter];
    const channelVis = visualizer[channel];
    
    if (!channelVis || !channelVis.ctx) return;
    
    const canvas = channelVis.canvas;
    const ctx = channelVis.ctx;
    const width = canvas.width / 2; // Account for high DPI scaling
    const height = canvas.height / 2;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Get channel-specific color
    const colors = {
        bass: deckLetter === 'A' ? '#00d4ff' : '#ff8a00',
        drums: deckLetter === 'A' ? '#00ff88' : '#ffff00', 
        synth: deckLetter === 'A' ? '#ff0080' : '#ff6b35'
    };
    
    const color = colors[channel];
    
    // Calculate average amplitude for this frequency range
    let sum = 0;
    let count = 0;
    for (let i = startFreq; i < Math.min(endFreq, dataArray.length); i++) {
        sum += dataArray[i];
        count++;
    }
    const avgAmplitude = count > 0 ? sum / count : 0;
    
    // Draw waveform bars
    const barCount = 20;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
        // Create some variation in the bars
        const variation = Math.random() * 0.3 + 0.7;
        const barHeight = (avgAmplitude / 255) * height * variation;
        
        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '40'); // Semi-transparent top
        
        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }
    
    // Draw frequency response line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < barCount; i++) {
        const freqIndex = Math.floor(startFreq + (i / barCount) * (endFreq - startFreq));
        const amplitude = dataArray[freqIndex] || 0;
        const x = i * barWidth + barWidth / 2;
        const y = height - (amplitude / 255) * height;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
}

// Update waveform when deck state changes
function updateWaveformForDeck(deckLetter, isPlaying) {
    const visualizer = waveformVisualizers[deckLetter];
    
    if (isPlaying) {
        // Start or restart animation
        if (visualizer.animationId) {
            cancelAnimationFrame(visualizer.animationId);
        }
        startWaveformAnimation(deckLetter);
    } else {
        // Stop animation
        if (visualizer.animationId) {
            cancelAnimationFrame(visualizer.animationId);
            visualizer.animationId = null;
        }
        
        // Clear all waveforms
        ['bass', 'drums', 'synth'].forEach(channel => {
            const channelVis = visualizer[channel];
            if (channelVis && channelVis.ctx) {
                const width = channelVis.canvas.width / 2;
                const height = channelVis.canvas.height / 2;
                channelVis.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                channelVis.ctx.fillRect(0, 0, width, height);
            }
        });
    }
}

// Initialize waveforms when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for audio context to be initialized
    setTimeout(() => {
        // Check if we have the necessary containers
        const containers = ['waveformBassA', 'waveformDrumsA', 'waveformSynthA', 
                           'waveformBassB', 'waveformDrumsB', 'waveformSynthB'];
        
        const missingContainers = containers.filter(id => !document.getElementById(id));
        if (missingContainers.length > 0) {
            console.warn('Missing waveform containers:', missingContainers);
        } else {
            console.log('🌊 All waveform containers found, ready to initialize');
        }
    }, 1000);
});

// Export functions to global scope
window.initializeWaveformVisualizers = initializeWaveformVisualizers;
window.updateWaveformForDeck = updateWaveformForDeck;

console.log('✅ Waveform Visualizer Ready');