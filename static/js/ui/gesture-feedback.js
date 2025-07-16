// Gesture Feedback and Channel Highlighting

// Update channel highlighting based on gesture mode
function updateChannelHighlighting(deckLetter, mode) {
    const deckPanel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    if (!deckPanel) return;
    
    const channelButtons = deckPanel.querySelectorAll('.channel-btn');
    
    // Reset all channels
    channelButtons.forEach(btn => {
        btn.classList.remove('active', 'gesture-controlled');
    });
    
    // Highlight based on mode
    switch(mode) {
        case 'main':
            const synthBtn = deckPanel.querySelector('[data-channel="synth"]');
            if (synthBtn) {
                synthBtn.classList.add('active', 'gesture-controlled');
                createChannelPulse(synthBtn, deckLetter === 'A' ? '#00d4ff' : '#ff8a00');
            }
            break;
            
        case 'bass':
            const bassBtn = deckPanel.querySelector('[data-channel="bass"]');
            if (bassBtn) {
                bassBtn.classList.add('active', 'gesture-controlled');
                createChannelPulse(bassBtn, deckLetter === 'A' ? '#00d4ff' : '#ff8a00');
            }
            break;
            
        case 'drums':
            const drumsBtn = deckPanel.querySelector('[data-channel="drums"]');
            if (drumsBtn) {
                drumsBtn.classList.add('active', 'gesture-controlled');
                createChannelPulse(drumsBtn, deckLetter === 'A' ? '#00d4ff' : '#ff8a00');
            }
            break;
            
        case 'all':
            channelButtons.forEach(btn => {
                btn.classList.add('active', 'gesture-controlled');
                createChannelPulse(btn, deckLetter === 'A' ? '#00d4ff' : '#ff8a00');
            });
            break;
    }
    
    // Show mode indicator
    showModeIndicator(deckLetter, mode);
}

// Create channel pulse effect
function createChannelPulse(element, color) {
    // Remove existing pulse
    const existingPulse = element.querySelector('.channel-pulse');
    if (existingPulse) existingPulse.remove();
    
    // Create new pulse
    const pulse = document.createElement('div');
    pulse.className = 'channel-pulse';
    pulse.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        background: ${color};
        border-radius: 10px;
        transform: translate(-50%, -50%);
        animation: channelPulse 1s ease-out;
        pointer-events: none;
        z-index: -1;
    `;
    
    element.style.position = 'relative';
    element.appendChild(pulse);
    
    // Remove after animation
    setTimeout(() => pulse.remove(), 1000);
}

// Show mode indicator
function showModeIndicator(deckLetter, mode) {
    const deckPanel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    if (!deckPanel) return;
    
    // Remove existing indicator
    const existingIndicator = deckPanel.querySelector('.mode-indicator');
    if (existingIndicator) existingIndicator.remove();
    
    // Create mode indicator
    const indicator = document.createElement('div');
    indicator.className = 'mode-indicator';
    
    let modeText = '';
    let modeIcon = '';
    
    switch(mode) {
        case 'main':
            modeText = 'MAIN CHANNEL';
            modeIcon = '☝️';
            break;
        case 'bass':
            modeText = 'BASS CHANNEL';
            modeIcon = '✌️';
            break;
        case 'drums':
            modeText = 'DRUMS CHANNEL';
            modeIcon = '🤟';
            break;
        case 'all':
            modeText = 'ALL CHANNELS';
            modeIcon = '🖐️';
            break;
    }
    
    indicator.innerHTML = `
        <span class="mode-icon">${modeIcon}</span>
        <span class="mode-text">${modeText}</span>
    `;
    
    indicator.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 15px 25px;
        border-radius: 20px;
        border: 2px solid ${deckLetter === 'A' ? '#00d4ff' : '#ff8a00'};
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 100;
        animation: modeIndicatorShow 0.5s ease;
        font-weight: 700;
        letter-spacing: 1px;
    `;
    
    deckPanel.appendChild(indicator);
    
    // Remove after delay
    setTimeout(() => {
        indicator.style.animation = 'modeIndicatorHide 0.3s ease';
        setTimeout(() => indicator.remove(), 300);
    }, 2000);
}

// Enhance deck activation with gesture feedback
function enhanceDeckActivation(deckLetter, isActive) {
    const deckPanel = document.querySelector(`.deck-overlay-panel.${deckLetter === 'A' ? 'left' : 'right'}`);
    if (!deckPanel) return;
    
    if (isActive) {
        // Add enhanced activation effects
        deckPanel.classList.add('gesture-active');
        
        // Create energy field effect
        createEnergyField(deckPanel, deckLetter === 'A' ? '#00d4ff' : '#ff8a00');
        
        // Add scan line effect
        createScanLine(deckPanel);
    } else {
        deckPanel.classList.remove('gesture-active');
    }
}

// Create energy field effect
function createEnergyField(element, color) {
    const field = document.createElement('div');
    field.className = 'energy-field';
    field.style.cssText = `
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border: 2px solid ${color};
        border-radius: 22px;
        opacity: 0;
        animation: energyField 2s ease-in-out infinite;
        pointer-events: none;
        z-index: -1;
    `;
    
    element.appendChild(field);
    
    // Clean up old fields
    const oldFields = element.querySelectorAll('.energy-field');
    if (oldFields.length > 3) {
        oldFields[0].remove();
    }
}

// Create scan line effect
function createScanLine(element) {
    const scanLine = document.createElement('div');
    scanLine.className = 'scan-line';
    scanLine.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8), transparent);
        animation: scanLine 2s linear infinite;
        pointer-events: none;
    `;
    
    element.appendChild(scanLine);
    
    // Remove after animation
    setTimeout(() => scanLine.remove(), 2000);
}

// Add CSS animations
const gestureFeedbackStyles = document.createElement('style');
gestureFeedbackStyles.textContent = `
    @keyframes channelPulse {
        0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
        }
    }
    
    @keyframes modeIndicatorShow {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    @keyframes modeIndicatorHide {
        from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
    }
    
    @keyframes energyField {
        0%, 100% {
            opacity: 0;
            transform: scale(1);
        }
        50% {
            opacity: 0.6;
            transform: scale(1.02);
        }
    }
    
    @keyframes scanLine {
        from {
            top: 0;
        }
        to {
            top: 100%;
        }
    }
    
    .channel-btn {
        overflow: visible;
        transition: all 0.3s;
    }
    
    .channel-btn.gesture-controlled {
        transform: scale(1.1);
        box-shadow: 0 0 20px currentColor;
    }
    
    .gesture-active {
        overflow: hidden;
    }
    
    .mode-icon {
        font-size: 1.5rem;
    }
    
    .mode-text {
        font-size: 0.9rem;
        color: #fff;
    }
`;

document.head.appendChild(gestureFeedbackStyles);

// Export functions
window.updateChannelHighlighting = updateChannelHighlighting;
window.enhanceDeckActivation = enhanceDeckActivation;