// MediaPipe Hand Tracking Initialization
console.log('🎯 MediaPipe Hand Tracking Initializer loading...');

window.initializeMediaPipeHands = function() {
    console.log('🚀 Initializing MediaPipe Hands...');
    
    // Check if Hands is available
    if (typeof Hands === 'undefined') {
        console.error('❌ MediaPipe Hands not loaded! Checking window object...');
        console.log('Window.Hands:', window.Hands);
        console.log('Available on window:', Object.keys(window).filter(k => k.includes('Hand') || k.includes('Media')));
        return;
    }
    
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    if (!video || !canvas) {
        console.error('Video or canvas element not found!');
        return;
    }
    
    console.log('📹 Video element:', video);
    console.log('🎨 Canvas element:', canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    function resizeCanvas() {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        console.log(`📐 Canvas resized to ${canvas.width}x${canvas.height}`);
    }
    
    video.addEventListener('loadedmetadata', resizeCanvas);
    resizeCanvas(); // Call immediately in case video is already loaded
    
    try {
        // Initialize MediaPipe Hands
        console.log('🤲 Creating Hands instance...');
        const hands = new Hands({
            locateFile: (file) => {
                const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                console.log(`📁 Loading MediaPipe file: ${file} from ${url}`);
                return url;
            }
        });
        
        console.log('⚙️ Setting Hands options...');
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });
        
        // Store hands instance globally
        window.handTracker = hands;
        
        // Process results
        console.log('🎯 Setting up onResults callback...');
        hands.onResults((results) => {
            console.log('👋 onResults called!', results);
        // Clear canvas
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandedness) {
            console.log(`👐 Detected ${results.multiHandLandmarks.length} hand(s)`);
            
            results.multiHandLandmarks.forEach((landmarks, index) => {
                const handedness = results.multiHandedness[index];
                
                // Camera is mirrored, so Right hand appears on left
                const isLeft = handedness.label === 'Right';
                const color = isLeft ? '#00d4ff' : '#ff8a00';
                const deck = isLeft ? 'A' : 'B';
                
                console.log(`Hand ${index}: ${handedness.label} (appears as ${isLeft ? 'left' : 'right'}), Deck ${deck}`);
                
                // Draw hand skeleton
                drawHandSkeleton(ctx, landmarks, color, canvas);
                
                // Process volume control
                processVolumeControl(landmarks, deck, isLeft);
                
                // Process finger gestures
                processFingerGestures(landmarks, deck, isLeft);
            });
        }
        
        ctx.restore();
    });
    
    // Check if Camera utility is available
    if (typeof Camera === 'undefined') {
        console.error('❌ MediaPipe Camera utility not loaded!');
        console.log('📸 Falling back to manual frame processing...');
        
        // Fallback: Process frames manually
        let processing = false;
        const processFrame = async () => {
            if (!processing && video.readyState === 4) {
                processing = true;
                try {
                    await hands.send({image: video});
                } catch (err) {
                    console.error('Frame processing error:', err);
                }
                processing = false;
            }
            requestAnimationFrame(processFrame);
        };
        
        // Start processing
        console.log('🎬 Starting manual frame processing...');
        processFrame();
        
    } else {
        // Use MediaPipe Camera utility
        console.log('📸 Using MediaPipe Camera utility...');
        try {
            const camera = new Camera(video, {
                onFrame: async () => {
                    if (video.readyState === 4) { // HAVE_ENOUGH_DATA
                        await hands.send({image: video});
                    }
                },
                width: 1280,
                height: 720
            });
            
            // Store camera instance
            window.mediaPipeCamera = camera;
            
            // Start processing
            camera.start().then(() => {
                console.log('✅ MediaPipe camera started successfully');
            }).catch(err => {
                console.error('❌ MediaPipe camera error:', err);
            });
        } catch (err) {
            console.error('❌ Error creating Camera:', err);
        }
    }
    
    } catch (err) {
        console.error('❌ Error initializing MediaPipe Hands:', err);
    }
};

// Hand drawing function
function drawHandSkeleton(ctx, landmarks, color, canvas) {
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],     // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8],     // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17]           // Palm
    ];
    
    // Draw connections
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
    });
    
    // Draw joints
    ctx.shadowBlur = 0;
    landmarks.forEach((landmark, idx) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Highlight fingertips
        if ([4, 8, 12, 16, 20].includes(idx)) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.stroke();
        }
    });
}

// Volume control state
const volumeState = {
    leftHandY: null,
    rightHandY: null,
    lastUpdate: 0,
    updateInterval: 50,
    smoothing: 0.3
};

// Process volume control
function processVolumeControl(landmarks, deck, isLeft) {
    const now = Date.now();
    if (now - volumeState.lastUpdate < volumeState.updateInterval) return;
    
    // Get wrist Y position (0 = top, 1 = bottom)
    const wristY = landmarks[0].y;
    const normalizedVolume = 1 - wristY; // Invert so raising hand increases volume
    
    // Smooth the value
    const currentY = isLeft ? volumeState.leftHandY : volumeState.rightHandY;
    const smoothedY = currentY === null ? 
        normalizedVolume : 
        currentY + (normalizedVolume - currentY) * volumeState.smoothing;
    
    if (isLeft) {
        volumeState.leftHandY = smoothedY;
    } else {
        volumeState.rightHandY = smoothedY;
    }
    
    // Convert to 0-100 range
    const volume = Math.round(Math.max(0, Math.min(100, smoothedY * 100)));
    
    // Update deck volume
    if (window.updateDeckVolume) {
        window.updateDeckVolume(deck, volume);
    }
    
    // Update slider
    const slider = document.getElementById(`volumeSlider${deck}`);
    if (slider) {
        slider.value = volume;
    }
    
    // Add visual indicator
    const volumeSection = document.querySelector(`.deck-overlay-panel.${isLeft ? 'left' : 'right'} .volume-section`);
    if (volumeSection) {
        volumeSection.classList.add('hand-controlled');
        setTimeout(() => volumeSection.classList.remove('hand-controlled'), 1000);
    }
    
    volumeState.lastUpdate = now;
}

// Finger gesture state
const gestureState = {
    lastLeftFingers: 0,
    lastRightFingers: 0,
    lastGesture: 0,
    gestureDebounce: 500
};

// Count extended fingers
function countFingers(landmarks) {
    let count = 0;
    
    // Thumb - check horizontal extension
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const wrist = landmarks[0];
    
    const thumbDist = Math.sqrt(
        Math.pow(thumbTip.x - wrist.x, 2) + 
        Math.pow(thumbTip.y - wrist.y, 2)
    );
    if (thumbDist > 0.2) count++;
    
    // Other fingers - check vertical extension
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    
    for (let i = 0; i < 4; i++) {
        if (landmarks[tips[i]].y < landmarks[pips[i]].y - 0.03) {
            count++;
        }
    }
    
    return count;
}

// Process finger gestures
function processFingerGestures(landmarks, deck, isLeft) {
    const now = Date.now();
    if (now - gestureState.lastGesture < gestureState.gestureDebounce) return;
    
    const fingerCount = countFingers(landmarks);
    const lastCount = isLeft ? gestureState.lastLeftFingers : gestureState.lastRightFingers;
    
    // Only trigger if finger count changed and is 1-3
    if (fingerCount !== lastCount && fingerCount >= 1 && fingerCount <= 3) {
        const channels = {1: 'bass', 2: 'drums', 3: 'synth'};
        const channel = channels[fingerCount];
        
        if (channel && window.toggleAudioChannel) {
            console.log(`🎛️ Finger gesture detected: ${fingerCount} fingers - Toggling ${channel} on Deck ${deck}`);
            window.toggleAudioChannel(deck, channel);
            
            // Show feedback
            showGestureFeedback(deck, channel, fingerCount);
            
            gestureState.lastGesture = now;
        }
    }
    
    // Update last count
    if (isLeft) {
        gestureState.lastLeftFingers = fingerCount;
    } else {
        gestureState.lastRightFingers = fingerCount;
    }
}

// Show gesture feedback
function showGestureFeedback(deck, channel, fingers) {
    const feedback = document.createElement('div');
    const emojis = ['☝️', '✌️', '🤟'];
    
    feedback.style.cssText = `
        position: fixed;
        top: 70%;
        ${deck === 'A' ? 'left: 20%' : 'right: 20%'};
        transform: translateX(${deck === 'A' ? '-50%' : '50%'});
        background: ${deck === 'A' ? '#00d4ff' : '#ff8a00'};
        color: #fff;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 18px;
        font-weight: bold;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: gestureFeedback 0.8s ease-out forwards;
    `;
    
    feedback.innerHTML = `
        <span style="font-size: 24px;">${emojis[fingers - 1]}</span>
        <span>${channel.toUpperCase()}</span>
    `;
    
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 800);
}

// Add animation
if (!document.getElementById('gestureFeedbackStyle')) {
    const style = document.createElement('style');
    style.id = 'gestureFeedbackStyle';
    style.textContent = `
        @keyframes gestureFeedback {
            0% { opacity: 0; transform: translateY(10px) scale(0.8); }
            50% { opacity: 1; transform: translateY(0) scale(1.05); }
            100% { opacity: 0; transform: translateY(-10px) scale(0.9); }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ MediaPipe Hand Tracking Initializer ready');