// static/js/controls/hand-tracking.js - Enhanced Multi-Channel Hand Tracking System

console.log('🖐️ Enhanced Multi-Channel Hand Tracking System Loading...');

// Global variables for MediaPipe - use existing if already declared
video = video || null;
canvas = canvas || null;
canvasCtx = canvasCtx || null;
hands = hands || null;
camera = camera || null;

// Create updateStatus function if it doesn't exist
if (typeof updateStatus === 'undefined') {
    window.updateStatus = function(message, type) {
        console.log(`[${type}] ${message}`);
        // Use showNotification if available
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else if (typeof showStudioNotification === 'function') {
            showStudioNotification(message, type);
        }
    };
}

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
            console.error('Video element:', video);
            console.error('Canvas element:', canvas);
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

// Initialize hand mask renderer
let handMaskRenderer = null;

// Enhanced hand detection results processing
function onEnhancedHandResults(results) {
    if (!canvasCtx || !canvas) {
        console.warn('⚠️ Canvas not available for enhanced rendering');
        return;
    }

    try {
        // Initialize mask renderer if not already done
        if (!handMaskRenderer && window.HandMaskRenderer) {
            handMaskRenderer = new HandMaskRenderer(canvasCtx, canvas);
        }

        // Clear canvas with crisp edges
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame first (optional - comment out for transparent overlay)
        // canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        
        // Set high-quality rendering settings
        canvasCtx.imageSmoothingEnabled = true;
        canvasCtx.imageSmoothingQuality = 'high';
        canvasCtx.lineCap = 'round';
        canvasCtx.lineJoin = 'round';
        
        // Reset hand states
        resetHandStates();

        const detectedHands = [];

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
                const handLabel = isUserLeftHand ? 'Left' : 'Right';
                
                // Update enhanced hand state with proper volume calculation
                updateEnhancedHandState(handSide, landmarks);
                
                // Draw modern hand mask instead of basic landmarks
                if (handMaskRenderer) {
                    handMaskRenderer.renderHandMask(landmarks, isUserLeftHand);
                } else {
                    // Fallback to original drawing
                    drawEnhancedHandLandmarks(landmarks, isUserLeftHand);
                }
                
                // Process enhanced hand control with gesture detection
                processEnhancedHandControl(handSide, landmarks);
                
                // Add to detected hands for palm detection
                detectedHands.push({
                    label: handLabel,
                    landmarks: landmarks,
                    fingerCount: detectFingerCount(landmarks),
                    height: getHandHeight(landmarks),
                    centerY: landmarks[9].y // Middle finger base
                });
            }
        }

        // Update UI indicators with enhanced feedback
        updateEnhancedHandIndicators();
        
        // Process enhanced deck control
        processEnhancedDeckControl();
        
        // Update palm detection
        if (typeof updatePalmDetection === 'function') {
            updatePalmDetection(detectedHands);
        }
        
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

// Get hand height for compatibility
function getHandHeight(landmarks) {
    if (!landmarks || landmarks.length < 21) return 0.5;
    const handCenter = calculateHandCenter(landmarks);
    return handCenter.y;
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

// Process hand volume control - Only works in "four fingers" mode
function processHandVolumeControl(handSide, volume) {
    const deckLetter = handSide === 'leftHand' ? 'A' : 'B';
    const deck = deckState[deckLetter];
    const hand = handState[handSide];
    
    // Only apply volume control if in "volume" mode (4 fingers)
    const currentMode = hand.gestures ? hand.gestures.mode : 'volume';
    
    if (currentMode !== 'volume') {
        // Not in volume control mode, skip volume adjustment
        return;
    }
    
    // Update deck volume based on hand position
    deck.handVolume = volume;
    deck.handControlled = true;
    
    // Apply volume to audio if track is loaded
    if ((deck.audio || deck.multiChannelPlayer) && deck.track) {
        updateDeckVolumeWithMode(deckLetter, volume, 'volume');
    }
    
    // Update visual indicator
    if (window.updateDeckVolumeIndicator) {
        updateDeckVolumeIndicator(deckLetter, volume * 100);
    } else {
        // Fallback: update the volume slider in the UI
        const volumeSlider = document.getElementById(`volumeSlider${deckLetter}`);
        const volumeLabel = document.getElementById(`volumeLabel${deckLetter}`);
        if (volumeSlider) volumeSlider.value = Math.round(volume * 100);
        if (volumeLabel) volumeLabel.textContent = Math.round(volume * 100);
    }
    
    console.log(`🔊 Deck ${deckLetter} volume control: ${Math.round(volume * 100)}% (4 fingers mode)`);
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
            
            // Always trigger the action when finger count changes
            triggerFingerCountAction(fingerCount, handSide, deckLetter);
            
            // Update gesture mode based on finger count
            let newMode = 'volume'; // Default to volume control
            switch (fingerCount) {
                case 0:
                    newMode = 'fist';
                    break;
                case 1:
                    newMode = 'bass';
                    break;
                case 2:
                    newMode = 'drums';
                    break;
                case 3:
                    newMode = 'synth';
                    break;
                case 4:
                    newMode = 'volume';
                    break;
                case 5:
                    newMode = 'all';
                    break;
            }
            
            hand.gestures.mode = newMode;
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

// Trigger finger count action with new control scheme
function triggerFingerCountAction(fingerCount, handSide, deckLetter) {
    console.log(`🖐️ Finger count detected: ${fingerCount} on ${handSide} (Deck ${deckLetter})`);
    
    const deck = deckState[deckLetter];
    const hand = handState[handSide];
    
    // Initialize audio channels if not exists
    if (!deck.audioChannels) {
        deck.audioChannels = {
            bass: { enabled: true, volume: 1.0, solo: false, mute: false },
            drums: { enabled: true, volume: 1.0, solo: false, mute: false },
            synth: { enabled: true, volume: 1.0, solo: false, mute: false }
        };
    }
    
    // Handle gestures based on finger count
    switch (fingerCount) {
        case 0:
            // Fist = Toggle all channels OFF/ON
            const allCurrentlyEnabled = deck.audioChannels.bass.enabled && 
                                       deck.audioChannels.drums.enabled && 
                                       deck.audioChannels.synth.enabled;
            
            // If all are currently on, turn them all off. If any are off, turn them all on.
            const newState = !allCurrentlyEnabled;
            
            console.log(`👊 Fist detected - Toggling all channels ${newState ? 'ON' : 'OFF'} for Deck ${deckLetter}`);
            deck.audioChannels.bass.enabled = newState;
            deck.audioChannels.drums.enabled = newState;
            deck.audioChannels.synth.enabled = newState;
            hand.gestureMode = 'fist';
            
            if (typeof updateStatus === 'function') {
                updateStatus(`Deck ${deckLetter}: All channels ${newState ? 'ON' : 'OFF'} (Fist) 👊`, 'info');
            }
            showFingerCountFeedback(deckLetter, fingerCount, `All ${newState ? 'ON' : 'OFF'}`, '👊');
            break;
            
        case 1:
            // Pointer finger = BASS toggle
            console.log(`☝️ Pointer finger - BASS toggle for Deck ${deckLetter}`);
            deck.audioChannels.bass.enabled = !deck.audioChannels.bass.enabled;
            hand.gestureMode = 'bass';
            if (typeof updateStatus === 'function') {
                updateStatus(`Deck ${deckLetter}: BASS ${deck.audioChannels.bass.enabled ? 'ON' : 'OFF'} ☝️`, 'info');
            }
            showFingerCountFeedback(deckLetter, fingerCount, `BASS ${deck.audioChannels.bass.enabled ? 'ON' : 'OFF'}`, '☝️');
            break;
            
        case 2:
            // Two fingers (peace sign) = DRUMS toggle
            console.log(`✌️ Two fingers - DRUMS toggle for Deck ${deckLetter}`);
            deck.audioChannels.drums.enabled = !deck.audioChannels.drums.enabled;
            hand.gestureMode = 'drums';
            if (typeof updateStatus === 'function') {
                updateStatus(`Deck ${deckLetter}: DRUMS ${deck.audioChannels.drums.enabled ? 'ON' : 'OFF'} ✌️`, 'info');
            }
            showFingerCountFeedback(deckLetter, fingerCount, `DRUMS ${deck.audioChannels.drums.enabled ? 'ON' : 'OFF'}`, '✌️');
            break;
            
        case 3:
            // Three fingers = SYNTH toggle
            console.log(`🤟 Three fingers - SYNTH toggle for Deck ${deckLetter}`);
            deck.audioChannels.synth.enabled = !deck.audioChannels.synth.enabled;
            hand.gestureMode = 'synth';
            if (typeof updateStatus === 'function') {
                updateStatus(`Deck ${deckLetter}: SYNTH ${deck.audioChannels.synth.enabled ? 'ON' : 'OFF'} 🤟`, 'info');
            }
            showFingerCountFeedback(deckLetter, fingerCount, `SYNTH ${deck.audioChannels.synth.enabled ? 'ON' : 'OFF'}`, '🤟');
            break;
            
        case 4:
            // Four fingers = Volume control mode
            console.log(`🖖 Four fingers - VOLUME control mode for Deck ${deckLetter}`);
            hand.gestureMode = 'volume';
            if (typeof updateStatus === 'function') {
                updateStatus(`Deck ${deckLetter}: Volume control mode 🖖`, 'info');
            }
            showFingerCountFeedback(deckLetter, fingerCount, 'Volume Control', '🖖');
            break;
            
        case 5:
            // High five = All channels ON
            console.log(`🖐️ High five - All channels ON for Deck ${deckLetter}`);
            deck.audioChannels.bass.enabled = true;
            deck.audioChannels.drums.enabled = true;
            deck.audioChannels.synth.enabled = true;
            hand.gestureMode = 'all';
            if (typeof updateStatus === 'function') {
                updateStatus(`Deck ${deckLetter}: All channels ON (High Five) 🖐️`, 'info');
            }
            showFingerCountFeedback(deckLetter, fingerCount, 'All ON', '🖐️');
            break;
            
        default:
            console.log(`❓ Unknown gesture with ${fingerCount} fingers`);
            return;
    }
    
    // Update audio channel settings
    if (typeof updateAudioChannelSettings === 'function') {
        updateAudioChannelSettings(deckLetter);
    }
    if (typeof updateChannelIndicators === 'function') {
        updateChannelIndicators(deckLetter);
    }
    
    // Update UI channel highlighting
    if (window.updateChannelHighlighting) {
        updateChannelHighlighting(deckLetter, hand.gestureMode);
    }
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
function showFingerCountFeedback(deckLetter, fingerCount, text, emoji) {
    // Try different overlay selectors
    let overlay = document.getElementById(`deck${deckLetter}Overlay`);
    if (!overlay) {
        overlay = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    }
    if (!overlay) {
        overlay = document.querySelector('.deck-overlay-panel');
    }
    if (!overlay) {
        console.warn(`No overlay found for deck ${deckLetter} feedback`);
        return;
    }
    
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.className = 'gesture-feedback';
    
    // Set color based on deck
    const deckColor = deckLetter === 'A' ? '#00d4ff' : '#ff8a00';
    
    feedback.innerHTML = `<span style="font-size: 2.5rem;">${emoji}</span><br><span style="font-size: 1.1rem; font-weight: bold;">${text}</span>`;
    feedback.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: ${deckColor};
        z-index: 2000;
        animation: gestureFlash 1.2s ease-out;
        pointer-events: none;
        text-shadow: 0 0 20px ${deckColor}80;
        background: rgba(0, 0, 0, 0.8);
        padding: 15px 20px;
        border-radius: 15px;
        border: 2px solid ${deckColor};
        box-shadow: 0 0 30px ${deckColor}60;
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
                15% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1.15); 
                }
                85% { 
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
    }, 1200);
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

// Draw enhanced hand landmarks with modern sleek design
function drawEnhancedHandLandmarks(landmarks, isUserLeftHand) {
    try {
        // Modern color scheme
        const handColor = isUserLeftHand ? '#00d4ff' : '#ff6b35';
        const glowColor = isUserLeftHand ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 107, 53, 0.2)';
        const accentColor = '#ffffff';
        
        // Draw modern connections
        drawModernConnections(landmarks, handColor);
        
        // Draw modern landmarks
        drawModernLandmarks(landmarks, handColor, glowColor);
        
        // Draw minimal fingertip indicators
        drawModernFingertips(landmarks, accentColor);
        
        // Draw modern hand label
        drawModernHandLabel(landmarks, isUserLeftHand, handColor);
        
    } catch (error) {
        console.error('❌ Enhanced drawing error:', error);
    }
}

// Draw modern connections with sleek lines
function drawModernConnections(landmarks, color) {
    if (typeof drawConnectors === 'undefined' || typeof HAND_CONNECTIONS === 'undefined') {
        return;
    }
    
    // Draw subtle glow
    canvasCtx.save();
    canvasCtx.globalAlpha = 0.3;
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: color,
        lineWidth: 4
    });
    canvasCtx.restore();
    
    // Draw main connections with thin lines
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: color,
        lineWidth: 1.5
    });
}

// Draw modern landmarks with minimal style
function drawModernLandmarks(landmarks, color, glowColor) {
    if (typeof drawLandmarks === 'undefined') return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    canvasCtx.save();
    
    landmarks.forEach((landmark, index) => {
        const x = Math.round(landmark.x * canvasWidth);
        const y = Math.round(landmark.y * canvasHeight);
        
        // Minimal sizes
        let radius = 2;
        if ([4, 8, 12, 16, 20].includes(index)) {
            radius = 3; // Fingertips slightly larger
        }
        
        // Draw subtle glow only for fingertips
        if ([4, 8, 12, 16, 20].includes(index)) {
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, radius + 4, 0, 2 * Math.PI);
            canvasCtx.fillStyle = glowColor;
            canvasCtx.fill();
        }
        
        // Draw main landmark
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
        canvasCtx.fillStyle = color;
        canvasCtx.fill();
    });
    
    canvasCtx.restore();
}

// Draw modern fingertip indicators
function drawModernFingertips(landmarks, accentColor) {
    const fingertips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    canvasCtx.save();
    canvasCtx.globalAlpha = 0.5;
    
    fingertips.forEach(index => {
        const landmark = landmarks[index];
        const x = Math.round(landmark.x * canvasWidth);
        const y = Math.round(landmark.y * canvasHeight);
        
        // Draw subtle circle only
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 6, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = accentColor;
        canvasCtx.lineWidth = 1;
        canvasCtx.stroke();
    });
    
    canvasCtx.restore();
}

// Draw modern hand label
function drawModernHandLabel(landmarks, isUserLeftHand, handColor) {
    if (!landmarks || landmarks.length === 0) return;

    try {
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        // Get wrist position
        const wrist = landmarks[0];
        const wristX = Math.round(wrist.x * canvasWidth);
        const wristY = Math.round(wrist.y * canvasHeight);

        // Deck label
        const deckLabel = isUserLeftHand ? 'DECK A' : 'DECK B';
        
        canvasCtx.save();
        canvasCtx.scale(-1, 1);
        const flippedX = -wristX;
        
        // Modern minimal text style
        canvasCtx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        canvasCtx.textAlign = 'center';
        canvasCtx.textBaseline = 'middle';
        canvasCtx.letterSpacing = '2px';
        
        // Subtle shadow
        canvasCtx.shadowColor = handColor;
        canvasCtx.shadowBlur = 8;
        canvasCtx.fillStyle = handColor;
        canvasCtx.fillText(deckLabel, flippedX, wristY + 25);
        
        canvasCtx.restore();
        
        // Draw mode indicator if active
        const hand = handState[isUserLeftHand ? 'leftHand' : 'rightHand'];
        if (hand && hand.gestures && hand.gestures.mode && hand.gestures.mode !== 'all') {
            const modeText = hand.gestures.mode.toUpperCase();
            
            canvasCtx.save();
            canvasCtx.scale(-1, 1);
            
            // Mode indicator with modern style
            canvasCtx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            canvasCtx.textAlign = 'center';
            canvasCtx.textBaseline = 'middle';
            
            // Background pill
            const textWidth = canvasCtx.measureText(modeText).width;
            canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            canvasCtx.roundRect(flippedX - textWidth/2 - 8, wristY + 38, textWidth + 16, 20, 10);
            canvasCtx.fill();
            
            // Text
            canvasCtx.fillStyle = '#00ff88';
            canvasCtx.fillText(modeText, flippedX, wristY + 48);
            
            canvasCtx.restore();
        }
        
    } catch (error) {
        console.error('❌ Modern hand label drawing error:', error);
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

// Enhanced start hand tracking - works with existing camera
async function startHandTracking() {
    if (appState.isTracking) {
        console.log('⚠️ Enhanced hand tracking already active');
        return;
    }

    try {
        if (typeof updateStatus === 'function') {
            updateStatus('Initializing enhanced hand tracking...', 'info');
        }
        console.log('🚀 Starting enhanced hand tracking...');
        
        // Get video and canvas elements
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        
        if (!video || !canvas) {
            throw new Error('Video or canvas element not found');
        }
        
        console.log('📹 Using existing video stream');
        console.log('Video element:', video);
        console.log('Canvas element:', canvas);
        
        // Set up canvas context
        canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) {
            throw new Error('Unable to get canvas 2D context');
        }

        // Set up high DPI canvas for crisp rendering
        setupHighDPICanvas();

        // Initialize MediaPipe Hands
        console.log('🖐️ Initializing MediaPipe Hands...');
        hands = new Hands({
            locateFile: (file) => {
                const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                console.log(`📁 Loading MediaPipe file: ${url}`);
                return url;
            }
        });

        // Configure hands detection
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.8,
            minTrackingConfidence: 0.7
        });

        console.log('⚙️ Enhanced MediaPipe Hands configured');

        // Set up results callback
        hands.onResults(onEnhancedHandResults);

        // Start processing frames from existing video
        console.log('🎬 Starting frame processing...');
        
        // Update state
        appState.isTracking = true;
        
        // Start the frame processing loop
        let processing = false;
        const processFrame = async () => {
            if (appState.isTracking && video.readyState === 4 && hands) {
                if (!processing) {
                    processing = true;
                    try {
                        await hands.send({image: video});
                    } catch (frameError) {
                        console.warn('⚠️ Frame processing error:', frameError);
                    }
                    processing = false;
                }
            }
            if (appState.isTracking) {
                requestAnimationFrame(processFrame);
            }
        };
        
        processFrame();
        
        console.log('✅ Enhanced hand tracking started successfully');
        if (typeof updateStatus === 'function') {
            updateStatus('Enhanced hand tracking active - Use gestures to control multi-channel audio!', 'success');
        }
        
    } catch (error) {
        console.error('❌ Failed to start enhanced hand tracking:', error);
        
        let errorMessage = 'Failed to start enhanced hand tracking: ' + error.message;
        
        if (typeof updateStatus === 'function') {
            updateStatus(errorMessage, 'error');
        }
        
        // Reset state on error
        appState.isTracking = false;
    }
}

// Alias for compatibility
function initializeHandTracking() {
    return startHandTracking();
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
        
        // Update UI - Support both old and new layouts
        const video = document.getElementById('video');
        const videoPlaceholder = document.getElementById('videoPlaceholder') || document.getElementById('cameraPlaceholder');
        const startBtn = document.getElementById('startBtn') || document.getElementById('startCameraBtn');
        const stopBtn = document.getElementById('stopBtn');
        const videoContainer = document.getElementById('videoContainer');
        
        if (video) video.style.display = 'none';
        if (videoPlaceholder) videoPlaceholder.style.display = 'flex';
        if (startBtn) {
            if (startBtn.id === 'startCameraBtn') {
                startBtn.textContent = 'Start Camera';
            } else {
                startBtn.style.display = 'block';
            }
        }
        if (stopBtn) stopBtn.style.display = 'none';
        if (videoContainer) videoContainer.classList.remove('hand-tracking');
        
        // Clear canvas
        if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Update indicators
        updateEnhancedHandIndicators();
        
        // Reset deck overlays
        const deckAOverlay = document.getElementById('deckAOverlay');
        const deckBOverlay = document.getElementById('deckBOverlay');
        if (deckAOverlay) deckAOverlay.classList.remove('hand-active');
        if (deckBOverlay) deckBOverlay.classList.remove('hand-active');
        
        console.log('✅ Enhanced hand tracking stopped');
        if (typeof updateStatus === 'function') {
            updateStatus('Enhanced hand tracking stopped', 'info');
        }
        if (typeof showNotification === 'function') {
            showNotification('Hand tracking stopped', 'info');
        }
        
    } catch (error) {
        console.error('❌ Error stopping enhanced hand tracking:', error);
        if (typeof updateStatus === 'function') {
            updateStatus('Error stopping enhanced hand tracking', 'error');
        }
        if (typeof showNotification === 'function') {
            showNotification('Error stopping hand tracking', 'error');
        }
    }
}

// Alias for compatibility
function stopMediaPipeHands() {
    stopHandTracking();
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

// Polyfill for roundRect if not supported
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Check MediaPipe status on window load
window.addEventListener('load', () => {
    console.log('🔍 Checking Enhanced MediaPipe on window load...');
    setTimeout(checkMediaPipeDependencies, 1000);
});

// Export enhanced functions to global scope
window.startHandTracking = startHandTracking;
window.stopHandTracking = stopHandTracking;
window.initializeHandTracking = initializeHandTracking;
window.stopMediaPipeHands = stopMediaPipeHands;
window.initializeMediaPipe = initializeMediaPipe;

// Export individual functions for debugging
window.toggleAudioChannel = toggleAudioChannel;
window.toggleAllAudioChannels = toggleAllAudioChannels;
window.updateAudioChannelSettings = updateAudioChannelSettings;
window.updateChannelIndicators = updateChannelIndicators;

// Helper function to update deck volume indicators
function updateDeckVolumeIndicator(deckLetter, volumePercent) {
    const volumeSlider = document.getElementById(`volumeSlider${deckLetter}`);
    const volumeLabel = document.getElementById(`volumeLabel${deckLetter}`);
    
    if (volumeSlider) {
        volumeSlider.value = volumePercent;
    }
    if (volumeLabel) {
        volumeLabel.textContent = Math.round(volumePercent);
    }
    
    console.log(`📊 Volume indicator updated: Deck ${deckLetter} = ${Math.round(volumePercent)}%`);
}

// Helper function to update channel highlighting
function updateChannelHighlighting(deckLetter, mode) {
    const deckPanel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    if (!deckPanel) return;
    
    const channelButtons = deckPanel.querySelectorAll('.channel-btn');
    
    channelButtons.forEach(btn => {
        const channel = btn.getAttribute('data-channel');
        if (channel) {
            // Remove all mode classes
            btn.classList.remove('mode-active', 'mode-inactive', 'mode-volume', 'mode-fist');
            
            // Add appropriate class based on mode
            switch (mode) {
                case 'volume':
                    btn.classList.add('mode-volume');
                    break;
                case 'fist':
                    btn.classList.add('mode-fist');
                    break;
                case 'all':
                    btn.classList.add('mode-active');
                    break;
                case 'bass':
                case 'drums':
                case 'synth':
                    if (mode === channel) {
                        btn.classList.add('mode-active');
                    } else {
                        btn.classList.add('mode-inactive');
                    }
                    break;
                default:
                    btn.classList.add('mode-inactive');
            }
        }
    });
    
    console.log(`🎨 Channel highlighting updated: Deck ${deckLetter} mode ${mode}`);
}

// Simple debug function to test MediaPipe availability
function debugMediaPipeStatus() {
    console.log('=== MEDIAPIPE DEBUG STATUS ===');
    console.log('Hands class available:', typeof Hands !== 'undefined');
    console.log('Camera class available:', typeof Camera !== 'undefined');  
    console.log('drawConnectors available:', typeof drawConnectors !== 'undefined');
    console.log('drawLandmarks available:', typeof drawLandmarks !== 'undefined');
    console.log('HAND_CONNECTIONS available:', typeof HAND_CONNECTIONS !== 'undefined');
    console.log('Video element:', document.getElementById('video'));
    console.log('Canvas element:', document.getElementById('canvas'));
    console.log('App state tracking:', appState?.isTracking);
    console.log('Hands instance:', !!hands);
    console.log('================================');
}

// Export enhanced functions to global scope
window.startHandTracking = startHandTracking;
window.stopHandTracking = stopHandTracking;
window.initializeHandTracking = initializeHandTracking;
window.stopMediaPipeHands = stopMediaPipeHands;
window.initializeMediaPipe = initializeMediaPipe;
window.debugMediaPipeStatus = debugMediaPipeStatus;

// Note: toggleAudioChannel and related functions are exported from hand-gestures.js

// Export the helper functions
window.updateDeckVolumeIndicator = updateDeckVolumeIndicator;
window.updateChannelHighlighting = updateChannelHighlighting;

console.log('✅ Enhanced Multi-Channel Hand Tracking System Ready');
console.log('🖐️ Advanced finger gesture detection enabled');
console.log('🎚️ Multi-channel audio control ready');
console.log('🌟 Enhanced visual feedback system loaded');
console.log('🌐 Functions exported to global scope:');
console.log('  - window.startHandTracking()');
console.log('  - window.stopHandTracking()');
console.log('  - window.toggleAudioChannel()');
console.log('  - window.toggleAllAudioChannels()');