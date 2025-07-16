// Main Waveform Visualization with Seek Functionality
console.log('🌊 Main Waveform System Loading...');

// Waveform instances for each deck
const mainWaveforms = {
    A: {
        canvas: null,
        ctx: null,
        analyser: null,
        progressBar: null,
        seekSlider: null,
        audioData: null,
        duration: 0,
        currentTime: 0,
        isInitialized: false
    },
    B: {
        canvas: null,
        ctx: null,
        analyser: null,
        progressBar: null,
        seekSlider: null,
        audioData: null,
        duration: 0,
        currentTime: 0,
        isInitialized: false
    }
};

// Initialize main waveform for a deck
function initializeMainWaveform(deckLetter) {
    console.log(`🌊 Initializing main waveform for Deck ${deckLetter}`);
    
    try {
        const waveform = mainWaveforms[deckLetter];
        
        // Get DOM elements
        waveform.canvas = document.getElementById(`mainWaveformCanvas${deckLetter}`);
        waveform.progressBar = document.getElementById(`waveformProgress${deckLetter}`);
        waveform.seekSlider = document.getElementById(`seekSlider${deckLetter}`);
        
        if (!waveform.canvas) {
            console.warn(`Main waveform canvas not found for Deck ${deckLetter}`);
            return false;
        }
        
        // Set up canvas
        const container = waveform.canvas.parentElement;
        waveform.canvas.width = container.offsetWidth * 2; // High DPI
        waveform.canvas.height = container.offsetHeight * 2;
        waveform.canvas.style.width = container.offsetWidth + 'px';
        waveform.canvas.style.height = container.offsetHeight + 'px';
        
        waveform.ctx = waveform.canvas.getContext('2d');
        waveform.ctx.scale(2, 2); // High DPI scaling
        
        // Generate demo waveform data
        generateDemoWaveform(deckLetter);
        
        // Set up audio analysis if available
        const deck = deckPlayers[deckLetter];
        if (audioContext && deck.gainNode) {
            waveform.analyser = audioContext.createAnalyser();
            waveform.analyser.fftSize = 2048;
            waveform.analyser.smoothingTimeConstant = 0.8;
            deck.gainNode.connect(waveform.analyser);
        }
        
        waveform.isInitialized = true;
        
        // Draw initial waveform
        drawMainWaveform(deckLetter);
        
        console.log(`✅ Main waveform initialized for Deck ${deckLetter}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to initialize main waveform for Deck ${deckLetter}:`, error);
        return false;
    }
}

// Generate demo waveform data
function generateDemoWaveform(deckLetter) {
    const waveform = mainWaveforms[deckLetter];
    const width = waveform.canvas.width / 2; // Account for scaling
    const dataPoints = Math.floor(width / 2); // One data point per 2 pixels
    
    waveform.audioData = new Array(dataPoints);
    
    // Generate realistic waveform pattern
    for (let i = 0; i < dataPoints; i++) {
        const progress = i / dataPoints;
        
        // Create a dynamic pattern with peaks and valleys
        let amplitude = 0.3; // Base amplitude
        
        // Add some larger peaks
        if (Math.random() < 0.1) {
            amplitude += Math.random() * 0.6;
        }
        
        // Add some variation
        amplitude += (Math.sin(progress * Math.PI * 8) * 0.2);
        amplitude += (Math.random() - 0.5) * 0.3;
        
        // Ensure it stays in bounds
        amplitude = Math.max(0.05, Math.min(0.9, amplitude));
        
        waveform.audioData[i] = amplitude;
    }
    
    // Set demo duration
    waveform.duration = 180; // 3 minutes
    
    console.log(`Generated demo waveform with ${dataPoints} data points for Deck ${deckLetter}`);
}

// Draw main waveform
function drawMainWaveform(deckLetter) {
    const waveform = mainWaveforms[deckLetter];
    
    if (!waveform.isInitialized || !waveform.ctx || !waveform.audioData) {
        return;
    }
    
    const canvas = waveform.canvas;
    const ctx = waveform.ctx;
    const width = canvas.width / 2; // Account for scaling
    const height = canvas.height / 2;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Get colors for this deck
    const colors = {
        A: {
            waveform: '#00d4ff',
            gradient: ['#00d4ff', '#00ff88']
        },
        B: {
            waveform: '#ff8a00',
            gradient: ['#ff8a00', '#ffff00']
        }
    };
    
    const color = colors[deckLetter];
    
    // Draw waveform
    const barWidth = width / waveform.audioData.length;
    
    for (let i = 0; i < waveform.audioData.length; i++) {
        const amplitude = waveform.audioData[i];
        const barHeight = amplitude * (height * 0.8);
        const x = i * barWidth;
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, centerY - barHeight/2, 0, centerY + barHeight/2);
        gradient.addColorStop(0, color.gradient[0]);
        gradient.addColorStop(1, color.gradient[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, centerY - barHeight/2, barWidth - 0.5, barHeight);
    }
    
    // Draw progress line if playing
    if (waveform.duration > 0) {
        const progressPercent = waveform.currentTime / waveform.duration;
        const progressX = progressPercent * width;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressX, 0);
        ctx.lineTo(progressX, height);
        ctx.stroke();
    }
}

// Update waveform progress
function updateMainWaveformProgress(deckLetter, currentTime, duration) {
    const waveform = mainWaveforms[deckLetter];
    
    if (!waveform.isInitialized) return;
    
    waveform.currentTime = currentTime;
    waveform.duration = duration;
    
    // Update progress bar
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    if (waveform.progressBar) {
        waveform.progressBar.style.width = `${progressPercent}%`;
    }
    
    // Update seek slider
    if (waveform.seekSlider) {
        waveform.seekSlider.value = progressPercent;
    }
    
    // Update time display
    updateTimeDisplay(deckLetter, currentTime, duration);
    
    // Redraw waveform with new progress
    drawMainWaveform(deckLetter);
}

// Update time display
function updateTimeDisplay(deckLetter, currentTime, duration) {
    const currentTimeElement = document.getElementById(`currentTime${deckLetter}`);
    const durationElement = document.getElementById(`duration${deckLetter}`);
    
    if (currentTimeElement) {
        currentTimeElement.textContent = formatTime(currentTime);
    }
    
    if (durationElement) {
        durationElement.textContent = formatTime(duration);
    }
}

// Format time in MM:SS format
function formatTime(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Seek to position in track
function seekToPosition(deckLetter, percentage) {
    console.log(`Seeking Deck ${deckLetter} to ${percentage}%`);
    
    const waveform = mainWaveforms[deckLetter];
    const deck = deckPlayers[deckLetter];
    
    if (!deck || !waveform.duration) {
        console.warn(`Cannot seek - no track loaded in Deck ${deckLetter}`);
        return;
    }
    
    const targetTime = (percentage / 100) * waveform.duration;
    
    try {
        // Seek audio element if available
        if (deck.audio) {
            deck.audio.currentTime = targetTime;
            console.log(`✅ Seeked audio element to ${targetTime.toFixed(1)}s`);
        }
        
        // Update visual progress
        updateMainWaveformProgress(deckLetter, targetTime, waveform.duration);
        
    } catch (error) {
        console.error(`❌ Failed to seek Deck ${deckLetter}:`, error);
    }
}

// Initialize waveforms when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Check if containers exist
        const containersA = document.getElementById('mainWaveformCanvasA');
        const containersB = document.getElementById('mainWaveformCanvasB');
        
        if (containersA && containersB) {
            console.log('🌊 Main waveform containers found, initializing...');
            // Will be initialized when tracks are loaded
        } else {
            console.warn('Main waveform containers not found');
        }
    }, 1000);
});

// Start progress tracking for playing tracks
function startProgressTracking(deckLetter) {
    const deck = deckPlayers[deckLetter];
    const waveform = mainWaveforms[deckLetter];
    
    if (!deck || !waveform.isInitialized) return;
    
    // Clear any existing tracking
    if (waveform.progressInterval) {
        clearInterval(waveform.progressInterval);
    }
    
    waveform.progressInterval = setInterval(() => {
        if (deck.isPlaying) {
            let currentTime = 0;
            let duration = waveform.duration || 180;
            
            if (deck.audio && deck.audio.duration) {
                currentTime = deck.audio.currentTime || 0;
                duration = deck.audio.duration;
            } else if (deck.bufferSource) {
                // Estimate time for buffer sources (they don't have currentTime)
                currentTime = ((Date.now() - (deck.startTime || Date.now())) / 1000) % duration;
            }
            
            updateMainWaveformProgress(deckLetter, currentTime, duration);
        }
    }, 100); // Update every 100ms for smooth progress
}

// Stop progress tracking
function stopProgressTracking(deckLetter) {
    const waveform = mainWaveforms[deckLetter];
    if (waveform && waveform.progressInterval) {
        clearInterval(waveform.progressInterval);
        waveform.progressInterval = null;
    }
}

// Export functions to global scope
window.initializeMainWaveform = initializeMainWaveform;
window.updateMainWaveformProgress = updateMainWaveformProgress;
window.seekToPosition = seekToPosition;
window.startProgressTracking = startProgressTracking;
window.stopProgressTracking = stopProgressTracking;

console.log('✅ Main Waveform System Ready');