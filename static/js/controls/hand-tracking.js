// static/js/controls/hand-tracking.js - Enhanced Multi-Channel Hand Tracking System

console.log('🖐️ Enhanced Multi-Channel Hand Tracking System Loading...');

// Check MediaPipe dependencies on load
function checkMediaPipeDependencies() {
    const requiredClasses = ['Hands', 'Camera', 'drawConnectors', 'drawLandmarks', 'HAND_CONNECTIONS'];
    const missing = [];
    
    if (typeof Hands === 'undefined') missing.push('Hands');
    if (typeof Camera === 'undefined') missing.push('Camera');
    if (typeof drawConnectors === 'undefined') missing.push('drawConnectors');
    if (typeof drawLandmarks === 'undefined') missing.push('drawLandmarks');
    if (typeof HAND_CONNECTIONS === 'undefined') missing.push('HAND_CONNECTIONS');
    
    if (missing.length > 0) {
        console.error('❌ Missing MediaPipe dependencies:', missing);
        updateStatus(`MediaPipe loading failed: ${missing.join(', ')}`, 'error');
        return false;
    }
    
    console.log('✅ All MediaPipe dependencies loaded');
    return true;
}

// Initialize MediaPipe Hand Tracking with enhanced features
async function initializeMediaPipe() {
    try {
        console.log('🖐️ Initializing Enhanced MediaPipe System...');
        
        // Check dependencies first
        if (!checkMediaPipeDependencies()) {
            throw new Error('MediaPipe dependencies not loaded');
        }
        
        // Get video and canvas elements
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        
        if (!video || !canvas) {
            throw new Error('Video or canvas element not found');
        }
        
        canvasCtx = canvas.getContext('2d');
        
        if (!canvasCtx) {
            throw new Error('Unable to get canvas 2D context');
        }

        // Set up high DPI canvas for crisp rendering
        setupHighDPICanvas();

        // Initialize MediaPipe Hands with enhanced settings
        hands = new Hands({
            locateFile: (file) => {
                const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                console.log(`📁 Loading MediaPipe file: ${url}`);
                return url;
            }
        });

        // Configure hands detection for enhanced gesture recognition
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.8,  // Higher confidence for better gesture detection
            minTrackingConfidence: 0.7
        });

        console.log('⚙️ Enhanced MediaPipe Hands configured');

        // Set up results callback with enhanced gesture processing
        hands.onResults(onEnhancedHandResults);

        // Initialize camera with optimized settings
        camera = new Camera(video, {
            onFrame: async () => {
                if (appState.isTracking && hands) {
                    try {
                        await hands.send({ image: video });
                    } catch (frameError) {
                        console.warn('⚠️ Frame processing error:', frameError);
                    }
                }
            },
            width: 1280,
            height: 720
        });

        console.log('📹 Enhanced camera initialized');
        console.log('✅ Enhanced MediaPipe initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Enhanced MediaPipe initialization failed:', error);
        updateStatus(`Enhanced hand tracking failed: ${error.message}`, 'error');
        
        // Show detailed error information
        console.error('Enhanced MediaPipe Debug Info:');
        console.error('- Video element:', !!video);
        console.error('- Canvas element:', !!canvas);
        console.error('- Hands class available:', typeof Hands !== 'undefined');
        console.error('- Camera class available:', typeof Camera !== 'undefined');
        console.error('- DrawConnectors available:', typeof drawConnectors !== 'undefined');
        
        return false;
    }
}

// Enhanced hand detection results processing
function onEnhancedHandResults(results) {
    if (!canvasCtx || !canvas) {
        console.warn('⚠️ Canvas not available for enhanced rendering');
        return;
    }

    try {
        // Clear canvas with crisp edges
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set high-quality rendering settings
        canvasCtx.imageSmoothingEnabled = false;
        canvasCtx.lineCap = 'round';
        canvasCtx.lineJoin = 'round';
        
        // Reset hand states
        resetHandStates();

        // Process detected hands with enhanced gesture detection
        if (results.multiHandLandmarks && results.multiHandedness) {
            console.log(`👐 Detected ${results.multiHandLandmarks.length} hands`);
            
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];
                
                if (!landmarks || !handedness) continue;
                
                // Enhanced hand mapping (corrected for camera flip)
                const isUserLeftHand = handedness.label === 'Right'; // Flipped due to camera
                const handSide = isUserLeftHand ? 'leftHand' : 'rightHand';
                
                // Update enhanced hand state with proper volume calculation
                updateEnhancedHandState(handSide, landmarks);
                
                // Draw enhanced hand landmarks and connections
                drawEnhancedHandLandmarks(landmarks, isUserLeftHand);
                
                // Process enhanced hand control with gesture detection
                processEnhancedHandControl(handSide, landmarks);
            }
        }

        // Update UI indicators with enhanced feedback
        updateEnhancedHandIndicators();
        
        // Process enhanced deck control
        processEnhancedDeckControl();
        
        canvasCtx.restore();
        
    } catch (error) {
        console.error('❌ Enhanced hand results processing error:', error);
        canvasCtx.restore();
    }
}

// Reset hand states
function resetHandStates() {
    handState.leftHand.detected = false;
    handState.rightHand.detected = false;
    handState.leftHand.controlling = false;
    handState.rightHand.controlling = false;
}

// Update enhanced hand state with proper volume calculation using hand center
function updateEnhancedHandState(handSide, landmarks) {
    const hand = handState[handSide];
    
    // Update basic hand state
    hand.detected = true;
    hand.landmarks = landmarks;
    
    // Calculate hand center for volume control (using palm center)
    const handCenter = calculateHandCenter(landmarks);
    hand.y = handCenter.y;
    
    // Check if hand is in controlling region (anywhere in frame for now)
    hand.controlling = true;
    
    // Update volume based on hand CENTER position
    // Top of screen (y=0) = max volume (1.0)
    // Bottom of screen (y=1) = min volume (0.0)
    hand.volume = calculateVolumeFromHandCenter(handCenter.y);
    
    console.log(`🖐️ ${handSide} - Center Y: ${handCenter.y.toFixed(3)}, Volume: ${(hand.volume * 100).toFixed(0)}%`);
}

// Calculate hand center (palm center) from landmarks - FIXED VERSION
function calculateHandCenter(landmarks) {
    if (!landmarks || landmarks.length < 21) return { x: 0.5, y: 0.5 };
    
    // Use multiple palm landmarks for better accuracy
    const palmLandmarks = [
        landmarks[0],  // Wrist
        landmarks[5],  // Index finger MCP (base)
        landmarks[9],  // Middle finger MCP
        landmarks[13], // Ring finger MCP
        landmarks[17]  // Pinky MCP
    ];
    
    let sumX = 0, sumY = 0;
    palmLandmarks.forEach(landmark => {
        sumX += landmark.x;
        sumY += landmark.y;
    });
    
    return {
        x: sumX / palmLandmarks.length,
        y: sumY / palmLandmarks.length
    };
}

// Calculate volume from hand CENTER position - FIXED VERSION
function calculateVolumeFromHandCenter(yPosition) {
    // MediaPipe coordinates: Y=0 at top, Y=1 at bottom
    // We want: Top of screen = max volume, Bottom = min volume
    
    // Invert the Y coordinate so top = 1.0, bottom = 0.0
    let volume = 1.0 - yPosition;
    
    // Clamp between 0 and 1
    volume = Math.max(0, Math.min(1, volume));
    
    // Add dead zones for smoother control
    if (volume < 0.05) volume = 0;
    if (volume > 0.95) volume = 1;
    
    return volume;
}

// Process enhanced hand control with multi-channel gestures
function processEnhancedHandControl(handSide, landmarks) {
    const deckLetter = handSide === 'leftHand' ? 'A' : 'B';
    const deck = deckState[deckLetter];
    const hand = handState[handSide];
    
    if (!hand.controlling) return;
    
    // Process volume control based on hand center
    processHandVolumeControl(handSide, hand.volume);
    
    // Process enhanced gesture detection
    detectAndProcessFingerGestures(handSide, landmarks);
    
    // Update visual feedback
    updateGestureDisplay(deckLetter, hand.gestures);
}

// Process hand volume control - UPDATED
function processHandVolumeControl(handSide, volume) {
    const deckLetter = handSide === 'leftHand' ? 'A' : 'B';
    const deck = deckState[deckLetter];
    const hand = handState[handSide];
    
    // Update deck volume based on hand position
    deck.handVolume = volume;
    deck.handControlled = true;
    
    // Apply volume to audio if track is loaded
    if ((deck.audio || deck.multiChannelPlayer) && deck.track) {
        // Volume affects only the channels in the current mode
        const mode = hand.gestures ? hand.gestures.mode : 'all';
        updateDeckVolumeWithMode(deckLetter, volume, mode);
    }
    
    // Update visual indicator
    updateDeckVolumeIndicator(deckLetter, volume * 100);
    
    // Show mode in console
    const mode = hand.gestures ? hand.gestures.mode : 'all';
    console.log(`🔊 Deck ${deckLetter} hand volume: ${Math.round(volume * 100)}% (Mode: ${mode})`);
}

// Enhanced finger gesture detection with improved accuracy
function detectAndProcessFingerGestures(handSide, landmarks) {
    const hand = handState[handSide];
    const deckLetter = handSide === 'leftHand' ? 'A' : 'B';
    
    // Detect finger count gesture
    const fingerCount = detectFingerCount(landmarks);
    const currentTime = Date.now();
    
    // Initialize gesture state if not exists
    if (!hand.gestures) {
        hand.gestures = {
            fingerCount: 0,
            lastFingerCount: 0,
            mode: 'all' // 'all', 'main', 'bass', 'drums'
        };
    }
    
    // Check if finger count changed
    if (fingerCount !== hand.gestures.lastFingerCount) {
        // Check cooldown
        if (!hand.lastGestureTime || currentTime - hand.lastGestureTime > 300) {
            hand.gestures.fingerCount = fingerCount;
            hand.gestures.lastFingerCount = fingerCount;
            hand.lastGestureTime = currentTime;
            
            // Update mode based on finger count
            let newMode = 'all';
            switch (fingerCount) {
                case 1:
                    newMode = 'main';
                    break;
                case 2:
                    newMode = 'bass';
                    break;
                case 3:
                    newMode = 'drums';
                    break;
                case 4:
                case 5:
                    newMode = 'all';
                    break;
            }
            
            if (newMode !== hand.gestures.mode) {
                hand.gestures.mode = newMode;
                triggerFingerCountAction(fingerCount, handSide, deckLetter, newMode);
            }
        }
    }
}

// Detect number of extended fingers
function detectFingerCount(landmarks) {
    let count = 0;
    
    // Check thumb - thumb tip above thumb IP joint
    if (landmarks[4].y < landmarks[3].y) count++;
    
    // Check index finger - tip above PIP joint
    if (landmarks[8].y < landmarks[6].y) count++;
    
    // Check middle finger
    if (landmarks[12].y < landmarks[10].y) count++;
    
    // Check ring finger
    if (landmarks[16].y < landmarks[14].y) count++;
    
    // Check pinky
    if (landmarks[20].y < landmarks[18].y) count++;
    
    return count;
}

// Trigger finger count action with enhanced feedback
function triggerFingerCountAction(fingerCount, handSide, deckLetter, mode) {
    console.log(`🖐️ Finger count detected: ${fingerCount} on ${handSide} (Deck ${deckLetter}) - Mode: ${mode}`);
    
    const deck = deckState[deckLetter];
    
    // Update deck's active mode
    if (!deck.activeMode) {
        deck.activeMode = 'all';
    }
    deck.activeMode = mode;
    
    // Update channel states based on mode
    switch (mode) {
        case 'main':
            // Only main/synth channel active
            if (deck.audioChannels) {
                deck.audioChannels.bass.enabled = false;
                deck.audioChannels.drums.enabled = false;
                deck.audioChannels.synth.enabled = true;
            }
            updateStatus(`Deck ${deckLetter}: Main track only (1 finger)`, 'info');
            break;
            
        case 'bass':
            // Only bass channel active
            if (deck.audioChannels) {
                deck.audioChannels.bass.enabled = true;
                deck.audioChannels.drums.enabled = false;
                deck.audioChannels.synth.enabled = false;
            }
            updateStatus(`Deck ${deckLetter}: Bass only (2 fingers)`, 'info');
            break;
            
        case 'drums':
            // Only drums channel active
            if (deck.audioChannels) {
                deck.audioChannels.bass.enabled = false;
                deck.audioChannels.drums.enabled = true;
                deck.audioChannels.synth.enabled = false;
            }
            updateStatus(`Deck ${deckLetter}: Drums only (3 fingers)`, 'info');
            break;
            
        case 'all':
            // All channels active
            if (deck.audioChannels) {
                deck.audioChannels.bass.enabled = true;
                deck.audioChannels.drums.enabled = true;
                deck.audioChannels.synth.enabled = true;
            }
            updateStatus(`Deck ${deckLetter}: All channels (open hand)`, 'info');
            break;
    }
    
    // Update audio channel settings
    updateAudioChannelSettings(deckLetter);
    updateChannelIndicators(deckLetter);
    
    // Visual feedback
    showFingerCountFeedback(deckLetter, fingerCount, mode);
}

// PLACEHOLDER FUNCTIONS - These will be called when gestures are detected
function onThumbIndexGesture(handSide, deckLetter) {
    console.log(`👆 Thumb-Index gesture on ${handSide} (Deck ${deckLetter})`);
    updateStatus(`Deck ${deckLetter}: Bass/Kick channel toggled 👆`, 'info');
    
    // TODO: Implement bass/kick channel control
    toggleAudioChannel(deckLetter, 'bass');
}

function onThumbMiddleGesture(handSide, deckLetter) {
    console.log(`🖕 Thumb-Middle gesture on ${handSide} (Deck ${deckLetter})`);
    updateStatus(`Deck ${deckLetter}: Drums channel toggled 🖕`, 'info');
    
    // TODO: Implement drums/percussion channel control
    toggleAudioChannel(deckLetter, 'drums');
}

function onThumbRingGesture(handSide, deckLetter) {
    console.log(`💍 Thumb-Ring gesture on ${handSide} (Deck ${deckLetter})`);
    updateStatus(`Deck ${deckLetter}: Synth channel toggled 💍`, 'info');
    
    // TODO: Implement synth/melody channel control
    toggleAudioChannel(deckLetter, 'synth');
}

function onThumbPinkyGesture(handSide, deckLetter) {
    console.log(`🤙 Thumb-Pinky gesture on ${handSide} (Deck ${deckLetter})`);
    updateStatus(`Deck ${deckLetter}: All channels toggled 🤙`, 'info');
    
    // TODO: Implement all channels control
    toggleAllAudioChannels(deckLetter);
}

// Show visual feedback for finger count
function showFingerCountFeedback(deckLetter, fingerCount, mode) {
    const overlay = document.getElementById(`deck${deckLetter}Overlay`);
    if (!overlay) return;
    
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.className = 'gesture-feedback';
    
    let emoji = '✋';
    let text = '';
    switch (fingerCount) {
        case 1:
            emoji = '☝️';
            text = 'MAIN';
            break;
        case 2:
            emoji = '✌️';
            text = 'BASS';
            break;
        case 3:
            emoji = '🤟';
            text = 'DRUMS';
            break;
        case 4:
        case 5:
            emoji = '🖐️';
            text = 'ALL';
            break;
    }
    
    feedback.innerHTML = `<span style="font-size: 2rem;">${emoji}</span><br><span style="font-size: 1rem; font-weight: bold;">${text}</span>`;
    feedback.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #00d4ff;
        z-index: 1000;
        animation: gestureFlash 0.8s ease-out;
        pointer-events: none;
        text-shadow: 0 0 20px rgba(0, 212, 255, 0.8);
    `;
    
    // Add CSS animation if not exists
    if (!document.getElementById('gestureFlashStyle')) {
        const style = document.createElement('style');
        style.id = 'gestureFlashStyle';
        style.textContent = `
            @keyframes gestureFlash {
                0% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.5); 
                }
                20% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1.2); 
                }
                80% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1); 
                }
                100% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.9); 
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    overlay.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 800);
}

// Get emoji for gesture
function getGestureEmoji(gestureKey) {
    const emojis = {
        thumbIndex: '👆',
        thumbMiddle: '🖕',
        thumbRing: '💍',
        thumbPinky: '🤙'
    };
    return emojis[gestureKey] || '✋';
}

// Draw enhanced hand landmarks with improved visual effects
function drawEnhancedHandLandmarks(landmarks, isUserLeftHand) {
    try {
        // Enhanced color scheme
        const handColor = isUserLeftHand ? '#00d4ff' : '#f39c12';
        const glowColor = isUserLeftHand ? 'rgba(0, 212, 255, 0.4)' : 'rgba(243, 156, 18, 0.4)';
        const accentColor = isUserLeftHand ? '#ffffff' : '#ffff00';
        
        // Draw enhanced connections
        drawEnhancedConnections(landmarks, handColor);
        
        // Draw enhanced landmarks
        drawEnhancedLandmarks(landmarks, handColor, glowColor);
        
        // Draw fingertip highlights
        drawFingertipHighlights(landmarks, accentColor);
        
        // Draw enhanced hand mask
        drawEnhancedHandMask(landmarks, isUserLeftHand, handColor, glowColor);
        
    } catch (error) {
        console.error('❌ Enhanced drawing error:', error);
    }
}

// Draw enhanced connections with glow effects
function drawEnhancedConnections(landmarks, color) {
    if (typeof drawConnectors === 'undefined' || typeof HAND_CONNECTIONS === 'undefined') {
        return;
    }
    
    // Draw glow effect
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: color,
        lineWidth: 6
    });
    
    // Draw main connections
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: color,
        lineWidth: 3
    });
}

// Draw enhanced landmarks with different sizes
function drawEnhancedLandmarks(landmarks, color, glowColor) {
    if (typeof drawLandmarks === 'undefined') return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    canvasCtx.save();
    
    landmarks.forEach((landmark, index) => {
        const x = Math.round(landmark.x * canvasWidth);
        const y = Math.round(landmark.y * canvasHeight);
        
        // Different sizes for different landmark types
        let radius = 3;
        if ([4, 8, 12, 16, 20].includes(index)) {
            radius = 5; // Fingertips
        } else if ([0].includes(index)) {
            radius = 6; // Wrist
        }
        
        // Draw glow
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, radius + 2, 0, 2 * Math.PI);
        canvasCtx.fillStyle = glowColor;
        canvasCtx.fill();
        
        // Draw main landmark
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();
        
        // Draw border
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = '#ffffff';
        canvasCtx.lineWidth = 1;
        canvasCtx.stroke();
    });
    
    canvasCtx.restore();
}

// Draw fingertip highlights
function drawFingertipHighlights(landmarks, accentColor) {
    const fingertips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    canvasCtx.save();
    
    fingertips.forEach(index => {
        const landmark = landmarks[index];
        const x = Math.round(landmark.x * canvasWidth);
        const y = Math.round(landmark.y * canvasHeight);
        
        // Draw highlight ring
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 8, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = accentColor;
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
    });
    
    canvasCtx.restore();
}

// Draw enhanced hand mask with gesture indicators
function drawEnhancedHandMask(landmarks, isUserLeftHand, handColor, glowColor) {
    if (!landmarks || landmarks.length === 0) return;

    try {
        // Get canvas dimensions
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        // Get wrist position for deck label
        const wrist = landmarks[0];
        const wristX = Math.round(wrist.x * canvasWidth);
        const wristY = Math.round(wrist.y * canvasHeight);

        // Draw stylized deck label near wrist
        const deckLabel = isUserLeftHand ? 'DECK A' : 'DECK B';
        
        canvasCtx.save();
        
        // Create gradient for text
        const gradient = canvasCtx.createLinearGradient(wristX - 40, wristY, wristX + 40, wristY);
        gradient.addColorStop(0, handColor);
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, handColor);
        
        // Flip canvas for text
        canvasCtx.scale(-1, 1);
        const flippedX = -wristX;
        
        // Draw glowing text effect
        canvasCtx.font = 'bold 16px Orbitron, monospace';
        canvasCtx.textAlign = 'center';
        canvasCtx.textBaseline = 'middle';
        
        // Multiple shadow layers for glow
        canvasCtx.shadowColor = handColor;
        canvasCtx.shadowBlur = 20;
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillText(deckLabel, flippedX, wristY + 30);
        
        // Second pass for stronger glow
        canvasCtx.shadowBlur = 10;
        canvasCtx.fillStyle = '#ffffff';
        canvasCtx.fillText(deckLabel, flippedX, wristY + 30);
        
        canvasCtx.restore();
        
        // Draw gesture indicator if active
        const hand = handState[isUserLeftHand ? 'leftHand' : 'rightHand'];
        if (hand && hand.gestures && hand.gestures.mode) {
            const gestureText = getGestureText(hand);
            
            if (gestureText) {
                canvasCtx.save();
                canvasCtx.scale(-1, 1);
                
                canvasCtx.font = 'bold 14px Orbitron, monospace';
                canvasCtx.textAlign = 'center';
                canvasCtx.textBaseline = 'middle';
                canvasCtx.fillStyle = '#00ff88';
                canvasCtx.shadowColor = '#00ff88';
                canvasCtx.shadowBlur = 10;
                
                canvasCtx.fillText(gestureText, flippedX, wristY + 50);
                canvasCtx.restore();
            }
        }
        
    } catch (error) {
        console.error('❌ Enhanced hand mask drawing error:', error);
    }
}

// Get gesture text description
function getGestureText(hand) {
    if (!hand || !hand.gestures) return '';
    
    switch (hand.gestures.mode) {
        case 'main':
            return 'MAIN';
        case 'bass':
            return 'BASS';
        case 'drums':
            return 'DRUMS';
        case 'all':
            return 'ALL';
        default:
            return '';
    }
}

// Enhanced deck control processing
function processEnhancedDeckControl() {
    const leftHandDetected = handState.leftHand.detected && handState.leftHand.controlling;
    const rightHandDetected = handState.rightHand.detected && handState.rightHand.controlling;
    
    // Deck A (Left Hand)
    if (leftHandDetected) {
        const deck = deckState.A;
        document.getElementById('deckAOverlay').classList.add('hand-active');
        deck.handControlled = true;
    } else {
        const deck = deckState.A;
        deck.handControlled = false;
        document.getElementById('deckAOverlay').classList.remove('hand-active');
    }

    // Deck B (Right Hand)
    if (rightHandDetected) {
        const deck = deckState.B;
        document.getElementById('deckBOverlay').classList.add('hand-active');
        deck.handControlled = true;
    } else {
        const deck = deckState.B;
        deck.handControlled = false;
        document.getElementById('deckBOverlay').classList.remove('hand-active');
    }
}

// Enhanced hand indicators update
function updateEnhancedHandIndicators() {
    const leftStatus = document.getElementById('leftHandStatus');
    const rightStatus = document.getElementById('rightHandStatus');

    if (!leftStatus || !rightStatus) {
        console.warn('⚠️ Enhanced hand indicator elements not found');
        return;
    }

    // Enhanced left hand indicator
    updateHandIndicator(leftStatus, handState.leftHand);
    
    // Enhanced right hand indicator
    updateHandIndicator(rightStatus, handState.rightHand);
}

// Update individual hand indicator with enhanced feedback
function updateHandIndicator(statusElement, handState) {
    if (handState.detected) {
        if (handState.controlling) {
            statusElement.className = 'hand-status controlling';
            statusElement.style.background = '#00d4ff';
            statusElement.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.8)';
        } else {
            statusElement.className = 'hand-status detected';
            statusElement.style.background = '#1ed760';
            statusElement.style.boxShadow = '0 0 10px rgba(30, 215, 96, 0.6)';
        }
    } else {
        statusElement.className = 'hand-status';
        statusElement.style.background = '#333';
        statusElement.style.boxShadow = 'none';
    }
}

// Enhanced start hand tracking
async function startHandTracking() {
    if (appState.isTracking) {
        console.log('⚠️ Enhanced hand tracking already active');
        return;
    }

    try {
        updateStatus('Initializing enhanced hand tracking...', 'info');
        console.log('🚀 Starting enhanced hand tracking...');
        
        // Check HTTPS requirement
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            throw new Error('Camera access requires HTTPS or localhost');
        }
        
        // Initialize MediaPipe if not already done
        if (!hands) {
            const success = await initializeMediaPipe();
            if (!success) {
                throw new Error('Enhanced MediaPipe initialization failed');
            }
        }

        // Check camera permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        
        console.log('📷 Camera permissions granted');

        // Set up canvas
        setupHighDPICanvas();

        // Start camera
        console.log('📹 Starting enhanced camera...');
        await camera.start();
        
        // Update state
        appState.isTracking = true;
        
        // Update UI
        document.getElementById('video').style.display = 'block';
        document.getElementById('videoPlaceholder').style.display = 'none';
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'block';
        document.getElementById('videoContainer').classList.add('hand-tracking');
        
        console.log('✅ Enhanced hand tracking started successfully');
        updateStatus('Enhanced hand tracking active - Use gestures to control multi-channel audio!', 'success');
        
    } catch (error) {
        console.error('❌ Failed to start enhanced hand tracking:', error);
        
        let errorMessage = 'Failed to start enhanced hand tracking: ' + error.message;
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Camera not supported in this browser.';
        }
        
        updateStatus(errorMessage, 'error');
        
        // Reset UI on error
        document.getElementById('video').style.display = 'none';
        document.getElementById('videoPlaceholder').style.display = 'block';
        document.getElementById('startBtn').style.display = 'block';
        document.getElementById('stopBtn').style.display = 'none';
    }
}

// Enhanced stop hand tracking
function stopHandTracking() {
    if (!appState.isTracking) {
        console.log('⚠️ Enhanced hand tracking not active');
        return;
    }

    try {
        console.log('🛑 Stopping enhanced hand tracking...');
        
        // Stop camera
        if (camera) {
            camera.stop();
        }
        
        // Update state
        appState.isTracking = false;
        
        // Reset enhanced hand states
        Object.keys(handState).forEach(handKey => {
            const hand = handState[handKey];
            hand.detected = false;
            hand.controlling = false;
            hand.volume = 0;
            hand.gestures = {
                thumbIndex: false,
                thumbMiddle: false,
                thumbRing: false,
                thumbPinky: false
            };
        });
        
        // Reset deck hand control
        ['A', 'B'].forEach(deckLetter => {
            const deck = deckState[deckLetter];
            deck.handControlled = false;
            
            // Reset visual effects
            const overlay = document.getElementById(`deck${deckLetter}Overlay`);
            if (overlay) {
                overlay.style.boxShadow = '';
            }
        });
        
        // Update UI
        document.getElementById('video').style.display = 'none';
        document.getElementById('videoPlaceholder').style.display = 'block';
        document.getElementById('startBtn').style.display = 'block';
        document.getElementById('stopBtn').style.display = 'none';
        document.getElementById('videoContainer').classList.remove('hand-tracking');
        
        // Clear canvas
        if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Update indicators
        updateEnhancedHandIndicators();
        
        // Reset deck overlays
        document.getElementById('deckAOverlay').classList.remove('hand-active');
        document.getElementById('deckBOverlay').classList.remove('hand-active');
        
        console.log('✅ Enhanced hand tracking stopped');
        updateStatus('Enhanced hand tracking stopped', 'info');
        
    } catch (error) {
        console.error('❌ Error stopping enhanced hand tracking:', error);
        updateStatus('Error stopping enhanced hand tracking', 'error');
    }
}

// Set up high DPI canvas (enhanced version)
function setupHighDPICanvas() {
    try {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        console.log(`📺 Setting up enhanced canvas: ${rect.width}x${rect.height}, DPR: ${dpr}`);
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        canvasCtx.scale(dpr, dpr);
        
        // Enhanced rendering settings
        canvasCtx.imageSmoothingEnabled = true;
        canvasCtx.imageSmoothingQuality = 'high';
        canvasCtx.textRendering = 'optimizeLegibility';
        
        console.log(`✅ Enhanced canvas setup complete: ${canvas.width}x${canvas.height}`);
    } catch (error) {
        console.error('❌ Enhanced canvas setup failed:', error);
        throw error;
    }
}

// Calculate distance between two landmarks (enhanced precision)
function calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = (point1.z || 0) - (point2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Check MediaPipe status on window load
window.addEventListener('load', () => {
    console.log('🔍 Checking Enhanced MediaPipe on window load...');
    setTimeout(checkMediaPipeDependencies, 1000);
});

console.log('✅ Enhanced Multi-Channel Hand Tracking System Ready');
console.log('🖐️ Advanced finger gesture detection enabled');
console.log('🎚️ Multi-channel audio control ready');
console.log('🌟 Enhanced visual feedback system loaded');