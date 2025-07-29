// Integration Bridge for Hand Gesture System
// This file ensures all gesture system components work together seamlessly

console.log('🌉 Hand Gesture Integration Bridge Loading...');

// Wait for all required systems to load
function waitForSystems() {
    return new Promise((resolve) => {
        const checkSystems = () => {
            const required = [
                typeof handState !== 'undefined',
                typeof deckState !== 'undefined',
                typeof appState !== 'undefined',
                typeof window.simpleDeckData !== 'undefined',
                typeof window.toggleAudioChannel !== 'undefined',
                typeof window.updateDeckVolume !== 'undefined'
            ];
            
            if (required.every(Boolean)) {
                console.log('✅ All gesture systems loaded');
                resolve();
            } else {
                setTimeout(checkSystems, 100);
            }
        };
        checkSystems();
    });
}

// Initialize integration when systems are ready
waitForSystems().then(() => {
    console.log('🚀 Initializing hand gesture integration...');
    
    // Ensure gesture system has access to proper deck functions
    if (!window.toggleAudioChannel) {
        console.warn('⚠️ toggleAudioChannel not found, creating bridge...');
        window.toggleAudioChannel = function(deckLetter, channelType) {
            console.log(`🎛️ Gesture Bridge: Toggle ${channelType} for Deck ${deckLetter}`);
            
            // Show visual feedback
            showChannelToggleNotification(deckLetter, channelType);
            
            // Update channel button visuals
            updateChannelButtonState(deckLetter, channelType);
        };
    }
    
    // Ensure volume control integration
    if (!window.updateDeckVolume.gestureIntegrated) {
        const originalUpdateDeckVolume = window.updateDeckVolume;
        window.updateDeckVolume = function(deckLetter, value) {
            // Call original function
            if (originalUpdateDeckVolume) {
                originalUpdateDeckVolume(deckLetter, value);
            }
            
            // Update gesture system state
            if (window.simpleDeckData && window.simpleDeckData[deckLetter]) {
                window.simpleDeckData[deckLetter].volume = value / 100;
            }
            
            // Update visual indicators
            updateVolumeIndicators(deckLetter, value);
        };
        window.updateDeckVolume.gestureIntegrated = true;
    }
    
    // Enhanced gesture feedback system
    window.showGestureConfirmation = function(deckLetter, gestureType, data = {}) {
        const deckColor = deckLetter === 'A' ? '#00d4ff' : '#ff8a00';
        const deckSide = deckLetter === 'A' ? 'left' : 'right';
        
        // Create confirmation overlay
        const overlay = document.getElementById(`deck${deckLetter}Overlay`) || 
                       document.querySelector(`.deck-overlay-panel.${deckSide}`);
        
        if (!overlay) {
            console.warn(`No overlay found for Deck ${deckLetter}`);
            return;
        }
        
        const feedback = document.createElement('div');
        feedback.className = 'gesture-confirmation';
        
        let content = '';
        switch (gestureType) {
            case 'volume':
                content = `<div class="gesture-icon">🔊</div><div class="gesture-text">Volume ${data.volume}%</div>`;
                break;
            case 'channel':
                const channelEmojis = { bass: '🎵', drums: '🥁', synth: '🎹' };
                content = `<div class="gesture-icon">${channelEmojis[data.channel] || '🎚️'}</div><div class="gesture-text">${data.channel.toUpperCase()}</div>`;
                break;
            case 'fingers':
                const fingerEmojis = ['', '☝️', '✌️', '🤟', '🖐️', '✋'];
                content = `<div class="gesture-icon">${fingerEmojis[data.count] || '✋'}</div><div class="gesture-text">${data.count} Fingers</div>`;
                break;
        }
        
        feedback.innerHTML = content;
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${deckColor}20;
            border: 2px solid ${deckColor};
            border-radius: 15px;
            padding: 20px;
            color: ${deckColor};
            font-weight: bold;
            font-size: 1.2rem;
            text-align: center;
            z-index: 1000;
            animation: gestureConfirmation 1s ease-out forwards;
            pointer-events: none;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 20px ${deckColor}40;
        `;
        
        // Add animation CSS if not exists
        if (!document.getElementById('gestureConfirmationStyle')) {
            const style = document.createElement('style');
            style.id = 'gestureConfirmationStyle';
            style.textContent = `
                @keyframes gestureConfirmation {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                }
                .gesture-confirmation .gesture-icon {
                    font-size: 2rem;
                    margin-bottom: 10px;
                }
                .gesture-confirmation .gesture-text {
                    font-family: 'Orbitron', monospace;
                    letter-spacing: 1px;
                }
            `;
            document.head.appendChild(style);
        }
        
        overlay.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    };
    
    // Update MediaPipe initialization to use our gesture functions
    if (window.initializeMediaPipeHands) {
        const originalInit = window.initializeMediaPipeHands;
        window.initializeMediaPipeHands = function() {
            console.log('🤖 Initializing MediaPipe with enhanced gesture integration...');
            
            // Call original initialization
            originalInit();
            
            // Add enhanced gesture processing
            setTimeout(() => {
                if (window.handTracker) {
                    console.log('✅ MediaPipe initialized with gesture integration');
                    
                    // Override the volume control to use our enhanced version
                    window.processVolumeControl = function(landmarks, deck, isLeft) {
                        const now = Date.now();
                        const handSide = isLeft ? 'leftHand' : 'rightHand';
                        const handData = handState[handSide];
                        
                        if (!handData || now - (handData.lastUpdate || 0) < 50) return;
                        
                        // Calculate hand center Y position
                        const handCenter = calculateHandCenter(landmarks);
                        const volume = Math.round((1 - handCenter.y) * 100);
                        
                        // Update deck volume
                        if (window.updateDeckVolume) {
                            window.updateDeckVolume(deck, volume);
                        }
                        
                        // Show gesture confirmation
                        window.showGestureConfirmation(deck, 'volume', { volume });
                        
                        handData.lastUpdate = now;
                    };
                    
                    // Override finger gesture processing
                    window.processFingerGestures = function(landmarks, deck, isLeft) {
                        const fingerCount = countFingers(landmarks);
                        const now = Date.now();
                        const handSide = isLeft ? 'leftHand' : 'rightHand';
                        const handData = handState[handSide];
                        
                        if (!handData) return;
                        
                        const lastCount = handData.lastFingerCount || 0;
                        const lastGesture = handData.lastGestureTime || 0;
                        
                        if (fingerCount !== lastCount && now - lastGesture > 500 && fingerCount >= 1 && fingerCount <= 3) {
                            const channels = { 1: 'bass', 2: 'drums', 3: 'synth' };
                            const channel = channels[fingerCount];
                            
                            if (channel) {
                                console.log(`🖐️ Finger gesture: ${fingerCount} fingers -> ${channel} on Deck ${deck}`);
                                
                                // Trigger channel toggle
                                if (window.toggleAudioChannel) {
                                    window.toggleAudioChannel(deck, channel);
                                }
                                
                                // Show confirmation
                                window.showGestureConfirmation(deck, 'channel', { channel });
                                window.showGestureConfirmation(deck, 'fingers', { count: fingerCount });
                                
                                handData.lastGestureTime = now;
                            }
                        }
                        
                        handData.lastFingerCount = fingerCount;
                    };
                }
            }, 500);
        };
    }
    
    console.log('✅ Hand Gesture Integration Bridge Ready!');
});

// Helper functions
function calculateHandCenter(landmarks) {
    if (!landmarks || landmarks.length < 21) return { x: 0.5, y: 0.5 };
    
    const palmLandmarks = [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
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

function countFingers(landmarks) {
    let count = 0;
    
    // Thumb - check if tip is further from wrist than joint
    const thumbTip = landmarks[4];
    const thumbJoint = landmarks[3];
    const wrist = landmarks[0];
    
    const thumbDist = Math.sqrt(
        Math.pow(thumbTip.x - wrist.x, 2) + 
        Math.pow(thumbTip.y - wrist.y, 2)
    );
    const thumbJointDist = Math.sqrt(
        Math.pow(thumbJoint.x - wrist.x, 2) + 
        Math.pow(thumbJoint.y - wrist.y, 2)
    );
    
    if (thumbDist > thumbJointDist + 0.05) count++;
    
    // Other fingers - check if tips are above PIP joints
    const fingerPairs = [
        [8, 6],   // Index
        [12, 10], // Middle
        [16, 14], // Ring
        [20, 18]  // Pinky
    ];
    
    fingerPairs.forEach(([tip, pip]) => {
        if (landmarks[tip].y < landmarks[pip].y - 0.02) {
            count++;
        }
    });
    
    return count;
}

function showChannelToggleNotification(deckLetter, channelType) {
    const notification = document.createElement('div');
    const deckColor = deckLetter === 'A' ? '#00d4ff' : '#ff8a00';
    
    notification.innerHTML = `🎛️ ${channelType.toUpperCase()} - DECK ${deckLetter}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        ${deckLetter === 'A' ? 'left: 20px' : 'right: 20px'};
        background: ${deckColor};
        color: #000;
        padding: 10px 20px;
        border-radius: 25px;
        font-weight: bold;
        font-family: 'Orbitron', monospace;
        z-index: 10000;
        animation: slideInNotification 0.5s ease-out;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

function updateChannelButtonState(deckLetter, channelType) {
    const deckSide = deckLetter === 'A' ? 'left' : 'right';
    const channelBtn = document.querySelector(`.deck-overlay-panel.${deckSide} .channel-btn[data-channel="${channelType}"]`);
    
    if (channelBtn) {
        channelBtn.classList.toggle('active');
        const led = channelBtn.querySelector('.channel-led');
        if (led) {
            led.style.backgroundColor = channelBtn.classList.contains('active') ? '#1ed760' : '#333';
        }
    }
}

function updateVolumeIndicators(deckLetter, value) {
    const volumeLabel = document.getElementById(`volumeLabel${deckLetter}`);
    const volumeSlider = document.getElementById(`volumeSlider${deckLetter}`);
    
    if (volumeLabel) volumeLabel.textContent = Math.round(value);
    if (volumeSlider) volumeSlider.value = value;
    
    // Update volume section visual feedback
    const deckSide = deckLetter === 'A' ? 'left' : 'right';
    const volumeSection = document.querySelector(`.deck-overlay-panel.${deckSide} .volume-section`);
    if (volumeSection) {
        volumeSection.style.boxShadow = `0 0 15px ${deckLetter === 'A' ? '#00d4ff' : '#ff8a00'}40`;
        setTimeout(() => {
            volumeSection.style.boxShadow = '';
        }, 300);
    }
}

// Add slide-in animation CSS
if (!document.getElementById('slideInNotificationStyle')) {
    const style = document.createElement('style');
    style.id = 'slideInNotificationStyle';
    style.textContent = `
        @keyframes slideInNotification {
            from { 
                opacity: 0; 
                transform: translateX(${window.innerWidth > 1000 ? '-100%' : '100%'}); 
            }
            to { 
                opacity: 1; 
                transform: translateX(0); 
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Hand Gesture Integration Bridge Loaded!');