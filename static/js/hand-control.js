// Enhanced Hand Control with MediaPipe - Volume & Channel Control
console.log('🖐️ Enhanced Hand Control System initializing...');

class EnhancedHandControl {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.hands = null;
        
        // Volume control state
        this.leftHandY = null;
        this.rightHandY = null;
        this.lastVolumeUpdateTime = 0;
        this.volumeUpdateInterval = 100; // ms
        
        // Gesture detection state
        this.lastGestureTime = 0;
        this.gestureDebounce = 500; // ms
        this.lastLeftFingers = 0;
        this.lastRightFingers = 0;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        console.log('🎬 Initializing hand control system...');
        
        // Get video and canvas elements
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        
        if (!this.video || !this.canvas) {
            console.error('Video or canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.hands.onResults(this.onResults.bind(this));
        
        // Set up camera when start button is clicked
        const startBtn = document.querySelector('.start-camera-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startCamera());
        }
    }
    
    async startCamera() {
        console.log('📷 Starting camera for hand control...');
        
        const placeholder = document.querySelector('.camera-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        // Initialize camera
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                await this.hands.send({image: this.video});
            },
            width: 1280,
            height: 720
        });
        
        await this.camera.start();
        console.log('✅ Camera started for hand tracking');
    }
    
    onResults(results) {
        // Clear canvas
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw video
        this.ctx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];
                
                // Determine hand side (mirrored)
                const isLeft = handedness.label === 'Right'; // Mirrored
                const color = isLeft ? '#00d4ff' : '#ff8a00';
                const deck = isLeft ? 'A' : 'B';
                
                // Draw stylized hand skeleton
                this.drawStylizedHand(landmarks, color);
                
                // Get wrist position for volume control
                const wristY = landmarks[0].y; // Normalized 0-1
                
                // Update volume based on hand height
                this.updateVolumeFromHand(deck, 1 - wristY); // Invert Y
                
                // Detect finger count for channel control
                const fingerCount = this.countFingers(landmarks);
                this.handleFingerGesture(deck, fingerCount, isLeft);
            }
        }
        
        this.ctx.restore();
    }
    
    drawStylizedHand(landmarks, color) {
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
        
        // Draw connections with glow effect
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        
        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
            this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
            this.ctx.stroke();
        });
        
        // Draw joints
        landmarks.forEach((landmark, idx) => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Highlight fingertips
            if ([4, 8, 12, 16, 20].includes(idx)) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 7, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
        });
    }
    
    updateVolumeFromHand(deck, normalizedHeight) {
        const now = Date.now();
        if (now - this.lastVolumeUpdateTime < this.volumeUpdateInterval) {
            return;
        }
        
        this.lastVolumeUpdateTime = now;
        
        // Convert normalized height (0-1) to volume (0-100)
        const volume = Math.round(normalizedHeight * 100);
        
        // Update deck volume
        if (window.updateDeckVolume) {
            window.updateDeckVolume(deck, volume);
        }
        
        // Update volume slider
        const volumeSlider = document.getElementById(`volumeSlider${deck}`);
        if (volumeSlider) {
            volumeSlider.value = volume;
        }
    }
    
    countFingers(landmarks) {
        let count = 0;
        
        // Thumb: tip (4) is to the right of IP joint (3)
        if (landmarks[4].x > landmarks[3].x) count++;
        
        // Other fingers: tip is above PIP joint
        const fingerTips = [8, 12, 16, 20];
        const fingerPIPs = [6, 10, 14, 18];
        
        for (let i = 0; i < fingerTips.length; i++) {
            if (landmarks[fingerTips[i]].y < landmarks[fingerPIPs[i]].y) {
                count++;
            }
        }
        
        return count;
    }
    
    handleFingerGesture(deck, fingerCount, isLeft) {
        const now = Date.now();
        if (now - this.lastGestureTime < this.gestureDebounce) {
            return;
        }
        
        // Check if finger count changed
        const lastCount = isLeft ? this.lastLeftFingers : this.lastRightFingers;
        if (fingerCount === lastCount) {
            return;
        }
        
        // Update last finger count
        if (isLeft) {
            this.lastLeftFingers = fingerCount;
        } else {
            this.lastRightFingers = fingerCount;
        }
        
        // Only trigger on specific finger counts
        if (fingerCount >= 1 && fingerCount <= 3) {
            this.lastGestureTime = now;
            
            const channelMap = {
                1: 'bass',
                2: 'drums',
                3: 'synth'
            };
            
            const channel = channelMap[fingerCount];
            if (channel && window.toggleAudioChannel) {
                console.log(`🎛️ Toggling ${channel} for Deck ${deck} (${fingerCount} fingers)`);
                window.toggleAudioChannel(deck, channel);
                
                // Visual feedback
                this.showGestureFeedback(deck, channel);
            }
        }
    }
    
    showGestureFeedback(deck, channel) {
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = 'gesture-feedback';
        feedback.textContent = `${channel.toUpperCase()} ${deck}`;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${deck === 'A' ? '#00d4ff' : '#ff8a00'};
            color: #fff;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: fadeOut 1s ease-out forwards;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    }
}

// Add fade out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
    }
`;
document.head.appendChild(style);

// Initialize hand control system
window.handControl = new HandControlSystem();
console.log('✅ Hand control system ready');