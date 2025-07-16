// Palm Gesture Detection for Play/Pause Control

// Palm detection state
const palmState = {
    leftPalm: false,
    rightPalm: false,
    bothPalmsTime: 0,
    palmThreshold: 500, // ms to hold palms before triggering
    lastTrigger: 0,
    cooldown: 2000 // ms cooldown between triggers
};

// Check if hand is showing palm (all fingers extended)
function isPalmGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    
    // Check if all fingers are extended
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
    const fingerBases = [2, 5, 9, 13, 17]; // Base joints
    
    let extendedFingers = 0;
    
    // Check thumb (different angle)
    if (landmarks[4].x > landmarks[2].x) { // For right hand
        extendedFingers++;
    } else if (landmarks[4].x < landmarks[2].x) { // For left hand  
        extendedFingers++;
    }
    
    // Check other fingers (vertical extension)
    for (let i = 1; i < 5; i++) {
        if (landmarks[fingerTips[i]].y < landmarks[fingerBases[i]].y) {
            extendedFingers++;
        }
    }
    
    // Palm is detected if at least 4 fingers are extended
    return extendedFingers >= 4;
}

// Update palm detection state
function updatePalmDetection(hands) {
    const currentTime = Date.now();
    
    // Reset states if no hands detected
    if (!hands || hands.length === 0) {
        palmState.leftPalm = false;
        palmState.rightPalm = false;
        palmState.bothPalmsTime = 0;
        updatePalmUI(false, false);
        return;
    }
    
    // Check each hand
    let leftPalmDetected = false;
    let rightPalmDetected = false;
    
    hands.forEach(hand => {
        const isPalm = isPalmGesture(hand.landmarks);
        
        if (hand.label === 'Left') {
            leftPalmDetected = isPalm;
        } else if (hand.label === 'Right') {
            rightPalmDetected = isPalm;
        }
    });
    
    // Update states
    palmState.leftPalm = leftPalmDetected;
    palmState.rightPalm = rightPalmDetected;
    
    // Update UI
    updatePalmUI(leftPalmDetected, rightPalmDetected);
    
    // Check for both palms gesture
    if (leftPalmDetected && rightPalmDetected) {
        if (palmState.bothPalmsTime === 0) {
            palmState.bothPalmsTime = currentTime;
        } else if (currentTime - palmState.bothPalmsTime >= palmState.palmThreshold) {
            // Check cooldown
            if (currentTime - palmState.lastTrigger >= palmState.cooldown) {
                triggerPalmAction();
                palmState.lastTrigger = currentTime;
                palmState.bothPalmsTime = 0;
            }
        }
    } else {
        palmState.bothPalmsTime = 0;
    }
}

// Trigger action when both palms are detected
function triggerPalmAction() {
    console.log('🖐️🖐️ Both palms detected - triggering play action');
    
    // Check if both decks have tracks loaded
    const deckA = window.simpleDeckData?.A;
    const deckB = window.simpleDeckData?.B;
    
    if (!deckA || !deckB) {
        console.error('SimpleDeckData not available');
        return;
    }
    
    if (deckA.track && deckB.track) {
        // Use the simple deck loader's functions
        if (window.playBothDecks) {
            window.playBothDecks();
        } else {
            console.error('playBothDecks function not available');
        }
    } else {
        console.log('Load tracks in both decks first');
    }
    
    // Visual feedback
    flashPalmIndicator();
}

// Update palm detection UI
function updatePalmUI(leftPalm, rightPalm) {
    const leftHandElement = document.querySelector('.left-hand .gesture-status');
    const rightHandElement = document.querySelector('.right-hand .gesture-status');
    
    if (leftHandElement) {
        if (leftPalm) {
            leftHandElement.classList.add('active');
            leftHandElement.querySelector('.gesture-text').textContent = 'Palm detected';
            leftHandElement.querySelector('.gesture-icon').textContent = '🖐️';
        } else {
            leftHandElement.classList.remove('active');
            leftHandElement.querySelector('.gesture-text').textContent = 'Not detected';
            leftHandElement.querySelector('.gesture-icon').textContent = '✋';
        }
    }
    
    if (rightHandElement) {
        if (rightPalm) {
            rightHandElement.classList.add('active');
            rightHandElement.querySelector('.gesture-text').textContent = 'Palm detected';
            rightHandElement.querySelector('.gesture-icon').textContent = '🖐️';
        } else {
            rightHandElement.classList.remove('active');
            rightHandElement.querySelector('.gesture-text').textContent = 'Not detected';
            rightHandElement.querySelector('.gesture-icon').textContent = '✋';
        }
    }
    
    // Show combined palm indicator
    if (leftPalm && rightPalm) {
        showPalmProgress();
    } else {
        hidePalmProgress();
    }
}

// Show palm progress indicator
function showPalmProgress() {
    let indicator = document.getElementById('palmProgressIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'palmProgressIndicator';
        indicator.className = 'palm-progress-indicator';
        indicator.innerHTML = `
            <div class="palm-progress-text">Hold both palms...</div>
            <div class="palm-progress-bar">
                <div class="palm-progress-fill"></div>
            </div>
        `;
        document.querySelector('.gesture-overlay').appendChild(indicator);
    }
    
    indicator.style.display = 'block';
    const progressFill = indicator.querySelector('.palm-progress-fill');
    const elapsed = Date.now() - palmState.bothPalmsTime;
    const progress = Math.min(elapsed / palmState.palmThreshold * 100, 100);
    progressFill.style.width = progress + '%';
}

// Hide palm progress indicator
function hidePalmProgress() {
    const indicator = document.getElementById('palmProgressIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Flash palm indicator for feedback
function flashPalmIndicator() {
    const overlay = document.querySelector('.gesture-overlay');
    if (overlay) {
        overlay.style.animation = 'palmFlash 0.5s ease';
        setTimeout(() => {
            overlay.style.animation = '';
        }, 500);
    }
}

// Play both decks function - COMMENTED OUT - Using the one from simple-deck-loader.js
/*
function playBothDecks() {
    const deckA = appState.decks.A;
    const deckB = appState.decks.B;
    
    if (deckA.track && deckB.track) {
        playDeck('A');
        playDeck('B');
        showNotification('▶️ Playing both decks', 'success');
    } else {
        showNotification('Load tracks in both decks first', 'warning');
    }
}
*/

// Add CSS for palm detection
const palmStyles = document.createElement('style');
palmStyles.textContent = `
    .palm-progress-indicator {
        position: absolute;
        bottom: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 10px 20px;
        border-radius: 20px;
        display: none;
        min-width: 200px;
    }
    
    .palm-progress-text {
        text-align: center;
        font-size: 0.85rem;
        margin-bottom: 5px;
        color: var(--text-primary);
    }
    
    .palm-progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
    }
    
    .palm-progress-fill {
        height: 100%;
        background: linear-gradient(to right, var(--primary-blue), var(--primary-orange));
        width: 0%;
        transition: width 0.1s linear;
    }
    
    @keyframes palmFlash {
        0%, 100% { background: rgba(0, 212, 255, 0); }
        50% { background: rgba(0, 212, 255, 0.2); }
    }
`;

document.head.appendChild(palmStyles);

console.log('🖐️ Palm gesture detection initialized');