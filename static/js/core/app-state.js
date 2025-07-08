// static/js/core/app-state.js - Professional Multi-Channel Application State

console.log('🎛️ HandMixed Pro - Professional Multi-Channel Edition Loading...');

// Global Application State
const appState = {
    isTracking: false,
    selectedDeck: null,
    currentTracks: [],
    searchQuery: '',
    audioContext: null,
    masterGain: null,
    currentPlaylist: null,
    globalPlaybackState: 'stopped', // 'stopped', 'playing', 'paused'
    
    // Professional features
    professionalMode: true,
    multiChannelEnabled: true,
    handGestureEnabled: true,
    
    // Audio processing state
    audioProcessing: {
        separationMethod: 'professional-frequency',
        quality: 'high',
        latencyMode: 'professional'
    }
};

// Enhanced hand tracking state with professional gesture detection
const handState = {
    leftHand: {
        detected: false,
        y: 0,
        landmarks: null,
        controlling: false,
        volume: 0,
        
        // Professional gesture detection
        gestures: {
            thumbIndex: false,     // Bass/Kick channel control
            thumbMiddle: false,    // Drums/Percussion channel control
            thumbRing: false,      // Synth/Melody channel control
            thumbPinky: false      // All channels control
        },
        
        // Gesture timing and feedback
        lastGesture: null,
        gestureStartTime: null,
        lastGestureTime: null,
        gestureHistory: []
    },
    rightHand: {
        detected: false,
        y: 0,
        landmarks: null,
        controlling: false,
        volume: 0,
        
        // Professional gesture detection
        gestures: {
            thumbIndex: false,     // Bass/Kick channel control
            thumbMiddle: false,    // Drums/Percussion channel control
            thumbRing: false,      // Synth/Melody channel control
            thumbPinky: false      // All channels control
        },
        
        // Gesture timing and feedback
        lastGesture: null,
        gestureStartTime: null,
        lastGestureTime: null,
        gestureHistory: []
    }
};

// MediaPipe components
let hands, camera, video, canvas, canvasCtx;

// Professional Playlist State
const playlistState = {
    playlists: [],
    activePlaylist: null,
    nextPlaylistId: 1,
    
    // Professional features
    smartPlaylists: [],
    bpmBasedPlaylists: [],
    genreBasedPlaylists: []
};

// Professional Multi-Channel Deck State
const deckState = {
    A: {
        // Basic deck properties
        player: null,
        track: null,
        volume: 0.7,
        handVolume: 0.7,
        isPlaying: false,
        isPaused: false,
        isFinished: false,
        trackEndListener: null,
        handControlled: false,
        
        // Audio elements
        audio: null,
        gain: null,
        
        // Professional Multi-Channel Audio Properties
        audioChannels: {
            bass: { 
                enabled: true, 
                volume: 1.0, 
                solo: false, 
                mute: false,
                eq: { low: 0, mid: 0, high: 0 },
                effects: { compressor: false, gate: false, filter: 'none' }
            },
            drums: { 
                enabled: true, 
                volume: 1.0, 
                solo: false, 
                mute: false,
                eq: { low: 0, mid: 0, high: 0 },
                effects: { compressor: false, gate: false, filter: 'none' }
            },
            synth: { 
                enabled: true, 
                volume: 1.0, 
                solo: false, 
                mute: false,
                eq: { low: 0, mid: 0, high: 0 },
                effects: { compressor: false, gate: false, filter: 'none' }
            }
        },
        
        // Professional audio processing
        separatedBuffers: null,
        multiChannelPlayer: null,
        audioProcessor: null,
        
        // Professional Waveform Visualization
        wavesurfer: null,           // Single waveform (fallback)
        wavesurfers: {              // Professional multi-channel waveforms
            bass: null,
            drums: null,
            synth: null
        },
        waveformQuality: 'high',
        waveformLoaded: false,
        
        // Professional BPM and Sync Properties
        bpm: null,
        bpmDetecting: false,
        originalBPM: null,
        currentPlaybackRate: 1.0,
        isSynced: false,
        bmpConfidence: 0,
        
        // Professional channel analysis
        channelAnalysis: {
            bass: { energy: 0, peak: 0, rms: 0 },
            drums: { energy: 0, peak: 0, rms: 0 },
            synth: { energy: 0, peak: 0, rms: 0 }
        },
        
        // Professional performance metrics
        performance: {
            latency: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            dropouts: 0
        },
        
        // Legacy properties for compatibility
        isLoadedFromQueue: false
    },
    B: {
        // Basic deck properties
        player: null,
        track: null,
        volume: 0.7,
        handVolume: 0.7,
        isPlaying: false,
        isPaused: false,
        isFinished: false,
        trackEndListener: null,
        handControlled: false,
        
        // Audio elements
        audio: null,
        gain: null,
        
        // Professional Multi-Channel Audio Properties
        audioChannels: {
            bass: { 
                enabled: true, 
                volume: 1.0, 
                solo: false, 
                mute: false,
                eq: { low: 0, mid: 0, high: 0 },
                effects: { compressor: false, gate: false, filter: 'none' }
            },
            drums: { 
                enabled: true, 
                volume: 1.0, 
                solo: false, 
                mute: false,
                eq: { low: 0, mid: 0, high: 0 },
                effects: { compressor: false, gate: false, filter: 'none' }
            },
            synth: { 
                enabled: true, 
                volume: 1.0, 
                solo: false, 
                mute: false,
                eq: { low: 0, mid: 0, high: 0 },
                effects: { compressor: false, gate: false, filter: 'none' }
            }
        },
        
        // Professional audio processing
        separatedBuffers: null,
        multiChannelPlayer: null,
        audioProcessor: null,
        
        // Professional Waveform Visualization
        wavesurfer: null,           // Single waveform (fallback)
        wavesurfers: {              // Professional multi-channel waveforms
            bass: null,
            drums: null,
            synth: null
        },
        waveformQuality: 'high',
        waveformLoaded: false,
        
        // Professional BPM and Sync Properties
        bpm: null,
        bmpDetecting: false,
        originalBPM: null,
        currentPlaybackRate: 1.0,
        isSynced: false,
        bmpConfidence: 0,
        
        // Professional channel analysis
        channelAnalysis: {
            bass: { energy: 0, peak: 0, rms: 0 },
            drums: { energy: 0, peak: 0, rms: 0 },
            synth: { energy: 0, peak: 0, rms: 0 }
        },
        
        // Professional performance metrics
        performance: {
            latency: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            dropouts: 0
        },
        
        // Legacy properties for compatibility
        isLoadedFromQueue: false
    }
};

// Professional BPM Detection State
const bmpState = {
    isAnalyzing: false,
    detectionQueue: [],
    lastDetectionTime: null,
    detectionCache: new Map(),
    syncThreshold: 3, // Tighter sync for professional use
    autoSyncEnabled: false,
    
    // Professional multi-channel BPM analysis
    channelBPM: {
        A: { bass: null, drums: null, synth: null, combined: null },
        B: { bass: null, drums: null, synth: null, combined: null }
    },
    
    // Professional BPM analysis settings
    analysis: {
        method: 'professional',
        windowSize: 30, // seconds
        confidence: 0.8,
        multiChannel: true
    }
};

// Professional Audio Source Separation State
const separationState = {
    isProcessing: false,
    processingQueue: [],
    lastProcessedTrack: null,
    separationMethod: 'professional-frequency',
    
    // Professional separation settings
    settings: {
        bassRange: { low: 20, high: 250 },
        drumsRange: { low: 200, high: 5000 },
        synthRange: { low: 800, high: 20000 },
        quality: 'high',
        processing: 'real-time'
    },
    
    // Professional performance monitoring
    performance: {
        separationTime: 0,
        qualityScore: 0,
        cpuUsage: 0
    }
};

// Professional Gesture Recognition State
const gestureState = {
    recognition: {
        enabled: true,
        sensitivity: 0.05,          // Professional precision
        cooldownMs: 200,            // Professional responsiveness
        confidence: 0.8             // High confidence for professional use
    },
    
    // Professional gesture mapping to functions
    gestureMapping: {
        thumbIndex: 'toggleBassChannel',
        thumbMiddle: 'toggleDrumsChannel',
        thumbRing: 'toggleSynthChannel',
        thumbPinky: 'toggleAllChannels'
    },
    
    // Professional gesture history for pattern recognition
    gestureHistory: [],
    maxHistoryLength: 100,
    
    // Professional gesture analytics
    analytics: {
        totalGestures: 0,
        gestureAccuracy: 0,
        averageResponseTime: 0,
        mostUsedGesture: null
    }
};

// Professional Hand Connections for MediaPipe
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],          // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],          // Index finger
    [0, 9], [9, 10], [10, 11], [11, 12],     // Middle finger
    [0, 13], [13, 14], [14, 15], [15, 16],   // Ring finger
    [0, 17], [17, 18], [18, 19], [19, 20],   // Pinky
    [5, 9], [9, 13], [13, 17]                // Palm connections
];

// Professional BPM Configuration
const BPM_CONFIG = {
    minBPM: 60,
    maxBPM: 200,
    analysisLength: 30,
    cacheExpiry: 1000 * 60 * 60,    // 1 hour
    quickAnalysisLength: 15,
    
    // Professional multi-channel BPM analysis
    channelAnalysis: {
        enabled: true,
        bassWeight: 0.4,
        drumsWeight: 0.4,
        synthWeight: 0.2,
        confidence: 0.8
    },
    
    // Professional sync settings
    sync: {
        tolerance: 3,               // BPM tolerance for sync
        autoSync: false,
        syncQuality: 'high'
    }
};

// Professional Audio Context Configuration
const AUDIO_CONFIG = {
    sampleRate: 44100,
    bufferSize: 2048,
    latency: 'interactive',         // Professional low-latency
    
    // Professional multi-channel processing
    channels: {
        bass: { 
            color: '#ff6b6b', 
            label: 'Bass/Kick',
            frequency: { low: 20, high: 250 },
            priority: 'high'
        },
        drums: { 
            color: '#f39c12', 
            label: 'Drums/Percussion',
            frequency: { low: 200, high: 5000 },
            priority: 'high'
        },
        synth: { 
            color: '#00d4ff', 
            label: 'Synth/Melody',
            frequency: { low: 800, high: 20000 },
            priority: 'medium'
        }
    },
    
    // Professional frequency separation ranges
    frequencyRanges: {
        bass: { low: 20, high: 250 },
        drums: { low: 200, high: 5000 },
        synth: { low: 800, high: 20000 }
    },
    
    // Professional audio effects
    effects: {
        compressor: { enabled: false, threshold: -18, ratio: 4 },
        limiter: { enabled: true, threshold: -1, release: 0.05 },
        eq: { enabled: true, bands: 3 }
    }
};

// Professional Global Playback Controls
const globalControls = {
    playBoth: false,
    syncDecks: false,
    crossfaderPosition: 50,
    masterVolume: 0.8,
    
    // Professional features
    professionalMode: true,
    lowLatencyMode: true,
    multiChannelMixing: true,
    handGestureControl: true
};

// Professional Utility Functions

// Professional BPM Management
function cacheBPMResult(trackId, bpm, channel = null, confidence = 0) {
    const key = channel ? `${trackId}_${channel}` : trackId;
    bmpState.detectionCache.set(key, {
        bmp: bpm,
        channel: channel,
        confidence: confidence,
        timestamp: Date.now(),
        method: 'professional'
    });
    
    console.log(`💾 Cached professional BPM result: ${key} = ${bpm} BPM (confidence: ${(confidence * 100).toFixed(1)}%)`);
}

function getCachedBPM(trackId, channel = null) {
    const key = channel ? `${trackId}_${channel}` : trackId;
    const cached = bmpState.detectionCache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > BPM_CONFIG.cacheExpiry) {
        bmpState.detectionCache.delete(key);
        return null;
    }
    
    return cached.bpm;
}

// Professional Multi-Channel Management
function getChannelState(deckLetter, channel) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels || !deck.audioChannels[channel]) {
        return null;
    }
    return deck.audioChannels[channel];
}

function setChannelState(deckLetter, channel, property, value) {
    const deck = deckState[deckLetter];
    if (!deck.audioChannels || !deck.audioChannels[channel]) {
        return false;
    }
    
    deck.audioChannels[channel][property] = value;
    
    // Update audio if playing
    if (deck.multiChannelPlayer && deck.isPlaying) {
        updateDeckVolume(deckLetter);
    }
    
    // Update professional visual indicators
    updateProfessionalChannelIndicators(deckLetter);
    
    // Log professional change
    console.log(`🎛️ Professional: Deck ${deckLetter} ${channel} ${property} = ${value}`);
    
    return true;
}

// Professional Deck State Management
function getDeckState(deckLetter) {
    return deckState[deckLetter];
}

function setBothDecksState(property, value) {
    deckState.A[property] = value;
    deckState.B[property] = value;
    console.log(`🎛️ Professional: Both decks ${property} = ${value}`);
}

function areBothDecksReady() {
    return deckState.A.track && deckState.B.track;
}

function areBothDecksPlaying() {
    return deckState.A.isPlaying && deckState.B.isPlaying;
}

function areBothDecksLoaded() {
    return deckState.A.separatedBuffers && deckState.B.separatedBuffers;
}

// Professional Global Playback State Management
function updateGlobalPlaybackState() {
    const previousState = appState.globalPlaybackState;
    
    if (areBothDecksPlaying()) {
        appState.globalPlaybackState = 'playing';
    } else if (deckState.A.isPlaying || deckState.B.isPlaying) {
        appState.globalPlaybackState = 'playing';
    } else {
        appState.globalPlaybackState = 'stopped';
    }
    
    // Update UI if state changed
    if (previousState !== appState.globalPlaybackState) {
        updateGlobalPlaybackUI();
        console.log(`🎛️ Professional: Global playback state: ${appState.globalPlaybackState}`);
    }
}

function updateGlobalPlaybackUI() {
    const globalPlayBtn = document.getElementById('globalPlayBtn');
    const globalPauseBtn = document.getElementById('globalPauseBtn');
    
    if (globalPlayBtn && globalPauseBtn) {
        if (appState.globalPlaybackState === 'playing') {
            globalPlayBtn.style.display = 'none';
            globalPauseBtn.style.display = 'block';
        } else {
            globalPlayBtn.style.display = 'block';
            globalPauseBtn.style.display = 'none';
        }
    }
}

// Professional BPM Sync Functions
function areDecksInSync() {
    if (!deckState.A.bpm || !deckState.B.bpm) return false;
    
    const difference = Math.abs(deckState.A.bmp - deckState.B.bpm);
    return difference <= bmpState.syncThreshold;
}

function getProfessionalBPMSyncStatus() {
    if (!deckState.A.bpm || !deckState.B.bpm) {
        return {
            synced: false,
            difference: null,
            status: 'No BPM data available',
            quality: 'unknown'
        };
    }
    
    const bpmA = deckState.A.bpm;
    const bmpB = deckState.B.bpm;
    const difference = Math.abs(bpmA - bmpB);
    
    let status = '';
    let synced = false;
    let quality = 'poor';
    
    if (difference <= 0.5) {
        status = 'Perfect professional sync';
        synced = true;
        quality = 'perfect';
    } else if (difference <= 1) {
        status = 'Excellent sync';
        synced = true;
        quality = 'excellent';
    } else if (difference <= 2) {
        status = 'Good sync';
        synced = true;
        quality = 'good';
    } else if (difference <= 3) {
        status = 'Acceptable sync';
        synced = false;
        quality = 'acceptable';
    } else {
        status = 'Needs adjustment';
        synced = false;
        quality = 'poor';
    }
    
    return {
        synced,
        difference,
        status,
        quality,
        bpmA,
        bmpB,
        confidenceA: deckState.A.bmpConfidence || 0,
        confidenceB: deckState.B.bmpConfidence || 0
    };
}

// Professional Gesture History Management
function addGestureToHistory(gesture, handSide, timestamp, metadata = {}) {
    const entry = {
        gesture,
        handSide,
        timestamp: timestamp || Date.now(),
        deckLetter: handSide === 'leftHand' ? 'A' : 'B',
        metadata: {
            confidence: metadata.confidence || 1.0,
            duration: metadata.duration || 0,
            accuracy: metadata.accuracy || 1.0,
            ...metadata
        }
    };
    
    gestureState.gestureHistory.push(entry);
    gestureState.analytics.totalGestures++;
    
    // Keep history within professional limits
    if (gestureState.gestureHistory.length > gestureState.maxHistoryLength) {
        gestureState.gestureHistory.shift();
    }
    
    // Update professional analytics
    updateGestureAnalytics(entry);
}

function updateGestureAnalytics(gestureEntry) {
    const analytics = gestureState.analytics;
    
    // Update accuracy
    const recentGestures = getRecentGestures(5000); // Last 5 seconds
    if (recentGestures.length > 0) {
        analytics.averageResponseTime = recentGestures.reduce((sum, g) => sum + (g.metadata.duration || 0), 0) / recentGestures.length;
        analytics.gestureAccuracy = recentGestures.reduce((sum, g) => sum + (g.metadata.accuracy || 1), 0) / recentGestures.length;
    }
    
    // Find most used gesture
    const gestureCounts = {};
    gestureState.gestureHistory.forEach(entry => {
        gestureCounts[entry.gesture] = (gestureCounts[entry.gesture] || 0) + 1;
    });
    
    let maxCount = 0;
    Object.keys(gestureCounts).forEach(gesture => {
        if (gestureCounts[gesture] > maxCount) {
            maxCount = gestureCounts[gesture];
            analytics.mostUsedGesture = gesture;
        }
    });
}

function getRecentGestures(timeWindowMs = 5000) {
    const now = Date.now();
    return gestureState.gestureHistory.filter(entry => 
        now - entry.timestamp <= timeWindowMs
    );
}

// Professional Audio Separation State Management
function setSeparationProcessing(deckLetter, isProcessing) {
    separationState.isProcessing = isProcessing;
    
    if (isProcessing) {
        separationState.processingQueue.push(deckLetter);
        console.log(`🔄 Professional: Starting separation for Deck ${deckLetter}`);
    } else {
        const index = separationState.processingQueue.indexOf(deckLetter);
        if (index !== -1) {
            separationState.processingQueue.splice(index, 1);
        }
        console.log(`✅ Professional: Completed separation for Deck ${deckLetter}`);
    }
}

function isSeparationProcessing(deckLetter = null) {
    if (deckLetter) {
        return separationState.processingQueue.includes(deckLetter);
    }
    return separationState.isProcessing;
}

// Professional Performance Monitoring
function updatePerformanceMetrics(deckLetter, metrics) {
    const deck = deckState[deckLetter];
    if (deck.performance) {
        Object.assign(deck.performance, metrics);
        
        // Log performance issues
        if (metrics.latency > 50) {
            console.warn(`⚠️ Professional: High latency detected on Deck ${deckLetter}: ${metrics.latency}ms`);
        }
        if (metrics.dropouts > 0) {
            console.warn(`⚠️ Professional: Audio dropouts detected on Deck ${deckLetter}: ${metrics.dropouts}`);
        }
    }
}

// Professional Channel Analysis
function updateChannelAnalysis(deckLetter, channel, analysis) {
    const deck = deckState[deckLetter];
    if (deck.channelAnalysis && deck.channelAnalysis[channel]) {
        Object.assign(deck.channelAnalysis[channel], analysis);
    }
}

// Professional Cleanup Functions
function cleanupBPMCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of bmpState.detectionCache.entries()) {
        const age = now - cached.timestamp;
        if (age > BMP_CONFIG.cacheExpiry) {
            bmpState.detectionCache.delete(key);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`🧹 Professional: Cleaned ${cleaned} expired BPM cache entries`);
    }
}

function cleanupGestureHistory() {
    const cutoffTime = Date.now() - (1000 * 60 * 10); // 10 minutes for professional use
    const beforeCount = gestureState.gestureHistory.length;
    gestureState.gestureHistory = gestureState.gestureHistory.filter(
        entry => entry.timestamp > cutoffTime
    );
    const afterCount = gestureState.gestureHistory.length;
    
    if (beforeCount !== afterCount) {
        console.log(`🧹 Professional: Cleaned ${beforeCount - afterCount} old gesture entries`);
    }
}

function cleanupProfessionalResources() {
    // Clean up audio contexts
    ['A', 'B'].forEach(deckLetter => {
        const deck = deckState[deckLetter];
        if (deck.audioProcessor && typeof deck.audioProcessor.cleanup === 'function') {
            deck.audioProcessor.cleanup();
        }
    });
    
    // Clean up separation resources
    if (separationState.processingQueue.length === 0) {
        separationState.lastProcessedTrack = null;
    }
    
    console.log('🧹 Professional: Resources cleaned up');
}

// Professional Debug Functions
function debugProfessionalState() {
    console.log('🔍 Professional State Debug:');
    console.log('- App State:', appState);
    console.log('- Deck A State:', deckState.A);
    console.log('- Deck B State:', deckState.B);
    console.log('- Hand State:', handState);
    console.log('- Gesture Analytics:', gestureState.analytics);
    console.log('- BPM State:', bmpState);
    console.log('- Separation State:', separationState);
    console.log('- Performance A:', deckState.A.performance);
    console.log('- Performance B:', deckState.B.performance);
}

function getProfessionalSystemStatus() {
    return {
        multiChannelEnabled: appState.multiChannelEnabled,
        handGestureEnabled: appState.handGestureEnabled,
        professionalMode: appState.professionalMode,
        decksReady: areBothDecksReady(),
        decksPlaying: areBothDecksPlaying(),
        decksInSync: areDecksInSync(),
        separationActive: separationState.isProcessing,
        gestureAccuracy: gestureState.analytics.gestureAccuracy,
        averageLatency: (deckState.A.performance.latency + deckState.B.performance.latency) / 2
    };
}

// Set up professional periodic cleanup
setInterval(cleanupBPMCache, 1000 * 60 * 15);        // Clean BPM cache every 15 minutes
setInterval(cleanupGestureHistory, 1000 * 60 * 5);   // Clean gesture history every 5 minutes
setInterval(cleanupProfessionalResources, 1000 * 60 * 30); // Deep cleanup every 30 minutes

// Export debug functions to global scope
window.debugProfessionalState = debugProfessionalState;
window.getProfessionalSystemStatus = getProfessionalSystemStatus;
window.debugState = debugProfessionalState; // Legacy compatibility

console.log('✅ Professional Multi-Channel App State Initialized');
console.log('🎛️ Professional multi-channel audio system ready');
console.log('🖐️ Advanced gesture recognition with analytics');
console.log('🌊 Professional waveform visualization ready');
console.log('🎵 Professional BPM detection and sync ready');
console.log('⚡ Performance monitoring and optimization active');
console.log('🎚️ Professional DJ features fully loaded!');