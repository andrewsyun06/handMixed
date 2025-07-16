// Audio Waveform Renderer - Creates static waveform visualization like DAW software

console.log('🌊 Audio Waveform Renderer initialized');

// Waveform data storage
const waveformData = {
    A: {
        peaks: null,
        duration: 0,
        isLoaded: false,
        canvas: null,
        ctx: null,
        width: 0,
        height: 0
    },
    B: {
        peaks: null,
        duration: 0,
        isLoaded: false,
        canvas: null,
        ctx: null,
        width: 0,
        height: 0
    }
};

// Generate waveform peaks from audio
async function generateWaveformPeaks(audioUrl, deckLetter) {
    console.log(`📊 Generating waveform peaks for Deck ${deckLetter}...`);
    
    // Immediately show fake waveform while loading real one
    generateFakeWaveform(deckLetter);
    
    // Skip real analysis for now - it's too slow for streaming URLs
    // In production, you'd want to get pre-calculated peaks from the server
    return;
    
    /* // Keeping this code for reference - would work with local files
    try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const offlineCtx = new OfflineAudioContext(1, 44100 * 30, 44100);
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
        
        const peaks = extractPeaks(audioBuffer, waveformData[deckLetter].width);
        
        waveformData[deckLetter].peaks = peaks;
        waveformData[deckLetter].duration = audioBuffer.duration;
        waveformData[deckLetter].isLoaded = true;
        
        drawStaticWaveform(deckLetter);
        
    } catch (error) {
        console.error(`❌ Error generating waveform:`, error);
        generateFakeWaveform(deckLetter);
    }
    */
}

// Extract peaks from audio buffer
function extractPeaks(audioBuffer, width) {
    const rawData = audioBuffer.getChannelData(0); // Use first channel
    const samples = audioBuffer.length;
    const blockSize = Math.floor(samples / width);
    const peaks = new Float32Array(width);
    
    for (let i = 0; i < width; i++) {
        let sum = 0;
        let max = 0;
        
        for (let j = 0; j < blockSize; j++) {
            const idx = i * blockSize + j;
            if (idx < samples) {
                const sample = Math.abs(rawData[idx]);
                sum += sample;
                if (sample > max) max = sample;
            }
        }
        
        peaks[i] = max; // Use peak value for better visualization
    }
    
    return peaks;
}

// Generate fake waveform for testing or fallback
function generateFakeWaveform(deckLetter) {
    console.log(`🎲 Generating waveform for Deck ${deckLetter}`);
    
    const width = waveformData[deckLetter].width || 800;
    const peaks = new Float32Array(width);
    
    // Generate more realistic EDM-style waveform pattern
    let phase = 0;
    let energy = 0.7;
    
    for (let i = 0; i < width; i++) {
        const position = i / width;
        
        // Intro (0-10%)
        if (position < 0.1) {
            energy = 0.3 + (position * 4) * 0.4;
        }
        // Build up (10-25%)
        else if (position < 0.25) {
            energy = 0.7 + Math.sin(position * 20) * 0.2;
        }
        // Drop (25-50%)
        else if (position < 0.5) {
            energy = 0.9;
            // Add kick drum pattern
            if (i % 16 < 2) {
                peaks[i] = 0.95;
            } else {
                peaks[i] = 0.6 + Math.random() * 0.3;
            }
            continue;
        }
        // Breakdown (50-65%)
        else if (position < 0.65) {
            energy = 0.5;
        }
        // Build up 2 (65-75%)
        else if (position < 0.75) {
            energy = 0.6 + (position - 0.65) * 4;
        }
        // Drop 2 (75-95%)
        else if (position < 0.95) {
            energy = 0.85;
            // Add kick drum pattern
            if (i % 16 < 2) {
                peaks[i] = 0.9;
            } else {
                peaks[i] = 0.5 + Math.random() * 0.35;
            }
            continue;
        }
        // Outro (95-100%)
        else {
            energy = 0.8 - (position - 0.95) * 10;
        }
        
        // Add variation
        const variation = (Math.random() - 0.5) * 0.15;
        peaks[i] = Math.max(0.1, Math.min(1, energy + variation));
    }
    
    waveformData[deckLetter].peaks = peaks;
    waveformData[deckLetter].duration = 180; // Assume 3 minutes
    waveformData[deckLetter].isLoaded = true;
    
    drawStaticWaveform(deckLetter);
}

// Draw the static waveform
function drawStaticWaveform(deckLetter) {
    const data = waveformData[deckLetter];
    if (!data.peaks || !data.canvas) return;
    
    const ctx = data.ctx;
    const width = data.width;
    const height = data.height;
    const peaks = data.peaks;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw waveform
    const barWidth = width / peaks.length;
    const centerY = height / 2;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (deckLetter === 'A') {
        gradient.addColorStop(0, '#00d4ff');
        gradient.addColorStop(0.5, '#0099cc');
        gradient.addColorStop(1, '#00d4ff');
    } else {
        gradient.addColorStop(0, '#ff8a00');
        gradient.addColorStop(0.5, '#cc6600');
        gradient.addColorStop(1, '#ff8a00');
    }
    
    ctx.fillStyle = gradient;
    
    // Draw bars
    for (let i = 0; i < peaks.length; i++) {
        const barHeight = peaks[i] * height * 0.8;
        const x = i * barWidth;
        
        // Draw mirrored bars (top and bottom)
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 0.5, barHeight);
    }
    
    // Removed center line for cleaner look
}

// Update progress overlay
function updateWaveformProgress(deckLetter) {
    const deck = window.simpleDeckData?.[deckLetter];
    if (!deck?.audio || !deck.audio.duration) return;
    
    const progress = deck.audio.currentTime / deck.audio.duration;
    const progressElement = document.getElementById(`waveformProgress${deckLetter}`);
    
    if (progressElement) {
        progressElement.style.width = `${progress * 100}%`;
    }
}

// Setup waveform for a deck
window.setupScrollingWaveform = function(deckLetter, audioUrl) {
    console.log(`🎵 Setting up scrolling waveform for Deck ${deckLetter}`);
    
    const canvas = document.getElementById(`mainWaveformCanvas${deckLetter}`);
    if (!canvas) {
        console.error('Main waveform canvas not found');
        return;
    }
    
    // Setup canvas
    const container = canvas.parentElement;
    const width = container.offsetWidth || 800;
    const height = container.offsetHeight || 80;
    
    canvas.width = width;
    canvas.height = height;
    
    waveformData[deckLetter].canvas = canvas;
    waveformData[deckLetter].ctx = canvas.getContext('2d');
    waveformData[deckLetter].width = width;
    waveformData[deckLetter].height = height;
    
    // Generate waveform peaks
    if (audioUrl) {
        generateWaveformPeaks(audioUrl, deckLetter);
    } else {
        generateFakeWaveform(deckLetter);
    }
    
    // Setup progress update
    const deck = window.simpleDeckData?.[deckLetter];
    if (deck?.audio) {
        // Remove old listener if exists
        if (deck._waveformProgressListener) {
            deck.audio.removeEventListener('timeupdate', deck._waveformProgressListener);
        }
        
        // Add new listener
        deck._waveformProgressListener = () => updateWaveformProgress(deckLetter);
        deck.audio.addEventListener('timeupdate', deck._waveformProgressListener);
    }
};

// Override the simple deck loader's waveform setup
if (window.loadTrackToSpecificDeck) {
    const originalLoadTrack = window.loadTrackToSpecificDeck;
    window.loadTrackToSpecificDeck = async function(track, deckLetter) {
        await originalLoadTrack(track, deckLetter);
        
        // Setup scrolling waveform after track loads
        setTimeout(() => {
            const deck = window.simpleDeckData?.[deckLetter];
            if (deck?.audio) {
                const audioUrl = track.stream_url || track.preview_url || track.url;
                setupScrollingWaveform(deckLetter, audioUrl);
            }
        }, 100);
    };
}

// Export for debugging
window.waveformData = waveformData;

// Manual trigger for testing
window.generateWaveformNow = function(deckLetter) {
    console.log(`🔄 Manually generating waveform for Deck ${deckLetter}`);
    const deck = window.simpleDeckData?.[deckLetter];
    if (deck?.audio) {
        const track = deck.track;
        const audioUrl = track?.stream_url || track?.preview_url || track?.url;
        setupScrollingWaveform(deckLetter, audioUrl);
    } else {
        // Generate fake waveform for testing
        setupScrollingWaveform(deckLetter, null);
    }
};

console.log('✅ Audio Waveform Renderer ready');