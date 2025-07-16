// Modern Sleek Hand Mask Renderer

class HandMaskRenderer {
    constructor(canvasCtx, canvas) {
        this.ctx = canvasCtx;
        this.canvas = canvas;
        this.maskEffects = {
            glow: true,
            particles: true,
            trails: true,
            wireframe: true
        };
        this.particles = [];
        this.trails = { left: [], right: [] };
        this.maxTrailLength = 15;
    }

    // Render modern hand mask with effects
    renderHandMask(landmarks, isLeftHand) {
        if (!landmarks || landmarks.length < 21) return;

        const handColor = isLeftHand ? '#00d4ff' : '#ff8a00';
        const glowColor = isLeftHand ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 138, 0, 0.4)';
        
        // Add to trails
        this.updateTrails(landmarks, isLeftHand);
        
        // Draw effects in order
        if (this.maskEffects.trails) {
            this.drawTrails(isLeftHand);
        }
        
        if (this.maskEffects.glow) {
            this.drawHandGlow(landmarks, glowColor);
        }
        
        if (this.maskEffects.wireframe) {
            this.drawWireframeMask(landmarks, handColor);
        }
        
        // Draw main hand mask
        this.drawModernHandMask(landmarks, handColor, isLeftHand);
        
        if (this.maskEffects.particles) {
            this.updateAndDrawParticles(landmarks, handColor);
        }
        
        // Draw fingertip effects
        this.drawFingertipEffects(landmarks, handColor);
    }

    // Draw modern hand mask
    drawModernHandMask(landmarks, color, isLeftHand) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        // Create gradient fill
        const centerPoint = this.getHandCenter(landmarks);
        const centerX = centerPoint.x * this.canvas.width / scaleX;
        const centerY = centerPoint.y * this.canvas.height / scaleY;
        
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 150
        );
        
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + '88');
        gradient.addColorStop(1, 'transparent');

        // Draw palm area
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = gradient;
        
        // Create palm polygon
        const palmPoints = [0, 1, 5, 9, 13, 17]; // Wrist and finger bases
        this.ctx.beginPath();
        
        palmPoints.forEach((index, i) => {
            const point = landmarks[index];
            const x = point.x * this.canvas.width / scaleX;
            const y = point.y * this.canvas.height / scaleY;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Draw finger segments with gradient
        this.drawFingerSegments(landmarks, color, scaleX, scaleY);
    }

    // Draw finger segments
    drawFingerSegments(landmarks, color, scaleX, scaleY) {
        const fingers = [
            [0, 1, 2, 3, 4],     // Thumb
            [0, 5, 6, 7, 8],     // Index
            [0, 9, 10, 11, 12],  // Middle
            [0, 13, 14, 15, 16], // Ring
            [0, 17, 18, 19, 20]  // Pinky
        ];

        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;

        fingers.forEach(finger => {
            this.ctx.beginPath();
            finger.forEach((pointIndex, i) => {
                const point = landmarks[pointIndex];
                const x = point.x * this.canvas.width / scaleX;
                const y = point.y * this.canvas.height / scaleY;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            this.ctx.stroke();
        });

        this.ctx.restore();
    }

    // Draw wireframe mask
    drawWireframeMask(landmarks, color) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        this.ctx.save();
        this.ctx.strokeStyle = color + '44';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        // Draw connections between all adjacent landmarks
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ];

        connections.forEach(([start, end]) => {
            const p1 = landmarks[start];
            const p2 = landmarks[end];
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * this.canvas.width / scaleX, p1.y * this.canvas.height / scaleY);
            this.ctx.lineTo(p2.x * this.canvas.width / scaleX, p2.y * this.canvas.height / scaleY);
            this.ctx.stroke();
        });

        this.ctx.restore();
    }

    // Draw hand glow effect
    drawHandGlow(landmarks, glowColor) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const center = this.getHandCenter(landmarks);
        const centerX = center.x * this.canvas.width / scaleX;
        const centerY = center.y * this.canvas.height / scaleY;

        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        
        // Multiple glow layers
        for (let i = 3; i > 0; i--) {
            const radius = 80 * i;
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius
            );
            
            gradient.addColorStop(0, glowColor);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    // Draw fingertip effects
    drawFingertipEffects(landmarks, color) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const fingertips = [4, 8, 12, 16, 20];
        
        this.ctx.save();
        
        fingertips.forEach(index => {
            const point = landmarks[index];
            const x = point.x * this.canvas.width / scaleX;
            const y = point.y * this.canvas.height / scaleY;
            
            // Outer ring
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Inner glow
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 10);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Center dot
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }

    // Update and draw particles
    updateAndDrawParticles(landmarks, color) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        // Generate new particles at fingertips
        const fingertips = [4, 8, 12, 16, 20];
        fingertips.forEach(index => {
            if (Math.random() > 0.7) {
                const point = landmarks[index];
                this.particles.push({
                    x: point.x * this.canvas.width / scaleX,
                    y: point.y * this.canvas.height / scaleY,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1.0,
                    color: color
                });
            }
        });

        // Update and draw particles
        this.ctx.save();
        
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            
            if (particle.life <= 0) return false;
            
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            return true;
        });
        
        this.ctx.restore();
    }

    // Update trails
    updateTrails(landmarks, isLeftHand) {
        const center = this.getHandCenter(landmarks);
        const trail = isLeftHand ? this.trails.left : this.trails.right;
        
        trail.push({
            x: center.x,
            y: center.y,
            opacity: 1.0
        });
        
        if (trail.length > this.maxTrailLength) {
            trail.shift();
        }
        
        // Update opacity
        trail.forEach((point, i) => {
            point.opacity = (i + 1) / trail.length * 0.5;
        });
    }

    // Draw trails
    drawTrails(isLeftHand) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const trail = isLeftHand ? this.trails.left : this.trails.right;
        const color = isLeftHand ? '#00d4ff' : '#ff8a00';
        
        if (trail.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineCap = 'round';
        
        for (let i = 1; i < trail.length; i++) {
            const p1 = trail[i - 1];
            const p2 = trail[i];
            
            this.ctx.globalAlpha = p2.opacity;
            this.ctx.lineWidth = (i / trail.length) * 5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x * this.canvas.width / scaleX, p1.y * this.canvas.height / scaleY);
            this.ctx.lineTo(p2.x * this.canvas.width / scaleX, p2.y * this.canvas.height / scaleY);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    // Get hand center
    getHandCenter(landmarks) {
        const palmLandmarks = [0, 5, 9, 13, 17];
        let sumX = 0, sumY = 0;
        
        palmLandmarks.forEach(index => {
            sumX += landmarks[index].x;
            sumY += landmarks[index].y;
        });
        
        return {
            x: sumX / palmLandmarks.length,
            y: sumY / palmLandmarks.length
        };
    }

    // Toggle effects
    toggleEffect(effectName) {
        if (this.maskEffects.hasOwnProperty(effectName)) {
            this.maskEffects[effectName] = !this.maskEffects[effectName];
        }
    }

    // Clear trails and particles
    reset() {
        this.particles = [];
        this.trails.left = [];
        this.trails.right = [];
    }
}

// Export for use
window.HandMaskRenderer = HandMaskRenderer;