// Enhanced Hand Control Integration - Volume and Channel Control
console.log('🎛️ Enhanced Hand Control Integration loading...');

// Wait for existing hand tracking to be ready
window.addEventListener('DOMContentLoaded', function() {
    // Extend existing hand tracking with volume and channel control
    if (window.handTracker) {
        console.log('🔧 Extending existing hand tracker with enhanced controls...');
        enhanceHandTracking();
    } else {
        console.log('⏳ Waiting for hand tracker initialization...');
        // Try again after a delay
        setTimeout(() => {
            if (window.handTracker) {
                enhanceHandTracking();
            }
        }, 1000);
    }
});

function enhanceHandTracking() {
    // Store original onResults function
    const originalOnResults = window.handTracker.onResults;
    
    // Volume control state
    let volumeControlState = {
        leftHandY: null,
        rightHandY: null,
        lastVolumeUpdateTime: 0,
        volumeUpdateInterval: 100, // ms
        smoothingFactor: 0.3 // Smooth volume changes
    };
    
    // Gesture detection state
    let gestureState = {
        lastGestureTime: 0,
        gestureDebounce: 500, // ms
        lastLeftFingers: 0,
        lastRightFingers: 0
    };
    
    // Override onResults to add our enhancements
    window.handTracker.onResults = function(results) {
        // Call original function if it exists
        if (originalOnResults) {
            originalOnResults.call(window.handTracker, results);
        }
        
        // Clear canvas and redraw with enhanced visuals
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandedness) {
            results.multiHandLandmarks.forEach((landmarks, index) => {
                const handedness = results.multiHandedness[index];
                
                // Determine hand side (camera is mirrored)
                const isLeft = handedness.label === 'Right'; // Mirrored
                const color = isLeft ? '#00d4ff' : '#ff8a00';
                const deck = isLeft ? 'A' : 'B';
                
                // Draw enhanced hand visualization
                drawEnhancedHand(ctx, landmarks, color, canvas);
                
                // Handle volume control
                handleVolumeControl(landmarks, deck, isLeft, volumeControlState);
                
                // Handle finger gestures for channel control
                handleChannelGestures(landmarks, deck, isLeft, gestureState);
            });
        }
        
        ctx.restore();
    };
    
    console.log('✅ Hand tracking enhanced with volume and channel control');
}

function drawEnhancedHand(ctx, landmarks, color, canvas) {
    // Define hand connections
    const connections = [
        // Thumb
        [0, 1], [1, 2], [2, 3], [3, 4],
        // Index finger
        [0, 5], [5, 6], [6, 7], [7, 8],
        // Middle finger
        [0, 9], [9, 10], [10, 11], [11, 12],
        // Ring finger
        [0, 13], [13, 14], [14, 15], [15, 16],
        // Pinky
        [0, 17], [17, 18], [18, 19], [19, 20],
        // Palm connections
        [5, 9], [9, 13], [13, 17]
    ];
    
    // Draw sleek line connections with glow
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
    });
    
    // Reset shadow for joints
    ctx.shadowBlur = 0;
    
    // Draw joints with smaller dots
    landmarks.forEach((landmark, idx) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        
        // Smaller joints
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Highlight fingertips with white outline
        if ([4, 8, 12, 16, 20].includes(idx)) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.stroke();
        }
    });
}

function handleVolumeControl(landmarks, deck, isLeft, state) {
    const now = Date.now();
    if (now - state.lastVolumeUpdateTime < state.volumeUpdateInterval) {
        return;
    }
    
    // Get wrist Y position (normalized 0-1)
    const wristY = landmarks[0].y;
    
    // Smooth the volume change
    const targetY = 1 - wristY; // Invert so up is higher volume
    const currentY = isLeft ? state.leftHandY : state.rightHandY;
    
    let smoothedY;
    if (currentY === null) {
        smoothedY = targetY;
    } else {
        smoothedY = currentY + (targetY - currentY) * state.smoothingFactor;
    }
    
    // Update state
    if (isLeft) {
        state.leftHandY = smoothedY;
    } else {
        state.rightHandY = smoothedY;
    }
    
    // Convert to volume (0-100)
    const volume = Math.round(Math.max(0, Math.min(100, smoothedY * 100)));
    
    // Update deck volume
    if (window.updateDeckVolume) {
        window.updateDeckVolume(deck, volume);
    }
    
    // Update volume slider
    const volumeSlider = document.getElementById(`volumeSlider${deck}`);
    if (volumeSlider) {
        volumeSlider.value = volume;
    }
    
    state.lastVolumeUpdateTime = now;
}

function handleChannelGestures(landmarks, deck, isLeft, state) {
    const fingerCount = countExtendedFingers(landmarks);
    const now = Date.now();
    
    // Check if enough time has passed since last gesture
    if (now - state.lastGestureTime < state.gestureDebounce) {
        return;
    }
    
    // Check if finger count changed
    const lastCount = isLeft ? state.lastLeftFingers : state.lastRightFingers;
    if (fingerCount === lastCount) {
        return;
    }
    
    // Update last finger count
    if (isLeft) {
        state.lastLeftFingers = fingerCount;
    } else {
        state.lastRightFingers = fingerCount;
    }
    
    // Handle specific finger counts (1, 2, or 3)
    if (fingerCount >= 1 && fingerCount <= 3) {
        state.lastGestureTime = now;
        
        const channelMap = {
            1: 'bass',
            2: 'drums',
            3: 'synth'
        };
        
        const channel = channelMap[fingerCount];
        if (channel && window.toggleAudioChannel) {
            console.log(`🎛️ Finger gesture: ${fingerCount} - Toggling ${channel} for Deck ${deck}`);
            window.toggleAudioChannel(deck, channel);
            
            // Visual feedback
            showChannelGestureFeedback(deck, channel, fingerCount);
        }
    }
}

function countExtendedFingers(landmarks) {
    let count = 0;
    
    // Thumb: check if tip is away from palm
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const palmBase = landmarks[0];
    
    // Thumb is extended if tip is far from palm
    const thumbDist = Math.sqrt(
        Math.pow(thumbTip.x - palmBase.x, 2) + 
        Math.pow(thumbTip.y - palmBase.y, 2)
    );
    if (thumbDist > 0.15) count++;
    
    // Other fingers: tip should be above PIP joint
    const fingerTips = [8, 12, 16, 20];
    const fingerPIPs = [6, 10, 14, 18];
    
    for (let i = 0; i < fingerTips.length; i++) {
        if (landmarks[fingerTips[i]].y < landmarks[fingerPIPs[i]].y - 0.02) {
            count++;
        }
    }
    
    return count;
}

function showChannelGestureFeedback(deck, channel, fingerCount) {
    // Create visual feedback
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 60%;
        ${deck === 'A' ? 'left: 20%' : 'right: 20%'};
        transform: translateX(${deck === 'A' ? '-50%' : '50%'});
        background: ${deck === 'A' ? '#00d4ff' : '#ff8a00'};
        color: #fff;
        padding: 15px 30px;
        border-radius: 10px;
        font-size: 20px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: channelFeedback 0.8s ease-out forwards;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // Add finger icon and channel name
    const fingerIcons = ['☝️', '✌️', '🤟'];
    feedback.innerHTML = `
        <span style="font-size: 30px;">${fingerIcons[fingerCount - 1]}</span>
        <span>${channel.toUpperCase()}</span>
    `;
    
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 800);
}

// Add animation for feedback
if (!document.getElementById('channelFeedbackStyle')) {
    const style = document.createElement('style');
    style.id = 'channelFeedbackStyle';
    style.textContent = `
        @keyframes channelFeedback {
            0% { 
                opacity: 0; 
                transform: translateX(var(--translate-x)) translateY(20px) scale(0.8);
            }
            50% { 
                opacity: 1; 
                transform: translateX(var(--translate-x)) translateY(0) scale(1.1);
            }
            100% { 
                opacity: 0; 
                transform: translateX(var(--translate-x)) translateY(-20px) scale(0.9);
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Enhanced hand control integration ready');