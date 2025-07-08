// static/js/audio/source-separation.js - Professional Audio Source Separation System

console.log('🎚️ Professional Audio Source Separation System Loading...');

/**
 * Professional AudioSourceSeparator - Multi-channel frequency separation
 * 
 * Separates audio into 3 professional DJ channels:
 * - Bass/Kick: Low frequency content (20-250 Hz)
 * - Drums/Percussion: Mid frequency content with transient emphasis (200-5000 Hz)  
 * - Synth/Melody: High frequency melodic content (800-20000 Hz)
 */
class ProfessionalAudioSourceSeparator {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.separatedChannels = {};
        this.isProcessing = false;
        
        // Professional frequency ranges optimized for DJ mixing
        this.frequencyRanges = {
            bass: { 
                low: 20, 
                high: 250,
                emphasis: 'low',
                description: 'Bass/Kick - Sub-bass and kick drum fundamentals'
            },
            drums: { 
                low: 200, 
                high: 5000,
                emphasis: 'transient',
                description: 'Drums/Percussion - Snares, hi-hats, percussion'
            },
            synth: { 
                low: 800, 
                high: 20000,
                emphasis: 'melodic',
                description: 'Synth/Melody - Leads, vocals, harmonic content'
            }
        };
        
        console.log('🎛️ Professional Audio Source Separator initialized');
        console.log('🎚️ Channel configuration:');
        Object.keys(this.frequencyRanges).forEach(channel => {
            const range = this.frequencyRanges[channel];
            console.log(`  - ${channel.toUpperCase()}: ${range.low}-${range.high}Hz (${range.description})`);
        });
    }

    /**
     * Separate audio into 3 professional DJ channels
     * @param {AudioBuffer} audioBuffer - The source audio buffer
     * @returns {Object} - Object containing separated audio buffers
     */
    async separateAudio(audioBuffer) {
        try {
            console.log('🔄 Starting professional audio separation...');
            console.log(`📊 Source: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz, ${audioBuffer.duration.toFixed(2)}s`);
            
            this.isProcessing = true;
            
            // Create separate buffers for each channel
            const separatedBuffers = {};
            
            // Process each channel with professional filtering
            for (const [channelType, config] of Object.entries(this.frequencyRanges)) {
                console.log(`🎚️ Processing ${channelType} channel (${config.low}-${config.high}Hz)...`);
                
                separatedBuffers[channelType] = await this.createProfessionalChannel(
                    audioBuffer, 
                    channelType, 
                    config
                );
                
                console.log(`✅ ${channelType} channel processed`);
            }
            
            console.log('✅ Professional audio separation completed');
            this.isProcessing = false;
            
            return separatedBuffers;
            
        } catch (error) {
            console.error('❌ Professional audio separation failed:', error);
            this.isProcessing = false;
            
            // Return original audio for all channels if separation fails
            return this.createFallbackChannels(audioBuffer);
        }
    }

    /**
     * Create a professional DJ channel with advanced filtering
     */
    async createProfessionalChannel(sourceBuffer, channelType, config) {
        try {
            // Create offline audio context for processing
            const offlineContext = new OfflineAudioContext(
                sourceBuffer.numberOfChannels,
                sourceBuffer.length,
                sourceBuffer.sampleRate
            );
            
            // Create source
            const source = offlineContext.createBufferSource();
            source.buffer = sourceBuffer;
            
            // Create professional filter chain
            const filterChain = this.createProfessionalFilterChain(offlineContext, channelType, config);
            
            // Connect source through filter chain to destination
            source.connect(filterChain.input);
            filterChain.output.connect(offlineContext.destination);
            
            // Start processing
            source.start(0);
            
            // Render the filtered audio
            const processedBuffer = await offlineContext.startRendering();
            
            console.log(`✅ ${channelType} channel processed: ${processedBuffer.duration.toFixed(2)}s`);
            return processedBuffer;
            
        } catch (error) {
            console.error(`❌ Filter processing failed for ${channelType}:`, error);
            return sourceBuffer; // Return original if filtering fails
        }
    }

    /**
     * Create professional filter chain for each channel type
     */
    createProfessionalFilterChain(context, channelType, config) {
        let input, output;
        
        switch (channelType) {
            case 'bass':
                // Professional bass/kick isolation
                input = this.createBassKickChain(context, config);
                output = input.output;
                break;
                
            case 'drums':
                // Professional drums/percussion isolation
                input = this.createDrumsPercussionChain(context, config);
                output = input.output;
                break;
                
            case 'synth':
                // Professional synth/melody isolation
                input = this.createSynthMelodyChain(context, config);
                output = input.output;
                break;
                
            default:
                // Pass-through
                const passThrough = context.createGain();
                passThrough.gain.value = 1.0;
                input = { input: passThrough, output: passThrough };
                output = passThrough;
        }
        
        return { input: input.input, output };
    }

    /**
     * Create professional bass/kick channel processing chain
     */
    createBassKickChain(context, config) {
        // High-pass to remove subsonic rumble
        const subsonicHP = context.createBiquadFilter();
        subsonicHP.type = 'highpass';
        subsonicHP.frequency.value = config.low;
        subsonicHP.Q.value = 0.707; // Butterworth response
        
        // Low-pass for bass isolation
        const bassLP = context.createBiquadFilter();
        bassLP.type = 'lowpass';
        bassLP.frequency.value = config.high;
        bassLP.Q.value = 0.707;
        
        // Secondary low-pass for steep rolloff
        const bassLP2 = context.createBiquadFilter();
        bassLP2.type = 'lowpass';
        bassLP2.frequency.value = config.high * 1.2; // Slightly higher for natural rolloff
        bassLP2.Q.value = 0.5;
        
        // Bass enhancement (gentle boost around 60-80Hz)
        const bassBoost = context.createBiquadFilter();
        bassBoost.type = 'peaking';
        bassBoost.frequency.value = 70;
        bassBoost.Q.value = 1.0;
        bassBoost.gain.value = 3; // +3dB boost
        
        // Dynamic range compressor for punch
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 10;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.01;
        compressor.release.value = 0.1;
        
        // Output gain
        const outputGain = context.createGain();
        outputGain.gain.value = 1.5; // Boost bass presence
        
        // Connect the chain
        subsonicHP.connect(bassLP);
        bassLP.connect(bassLP2);
        bassLP2.connect(bassBoost);
        bassBoost.connect(compressor);
        compressor.connect(outputGain);
        
        return { input: subsonicHP, output: outputGain };
    }

    /**
     * Create professional drums/percussion channel processing chain
     */
    createDrumsPercussionChain(context, config) {
        // High-pass to remove bass bleed
        const bassHP = context.createBiquadFilter();
        bassHP.type = 'highpass';
        bassHP.frequency.value = config.low;
        bassHP.Q.value = 1.0; // Steeper rolloff
        
        // Low-pass to remove harsh highs
        const trebleLP = context.createBiquadFilter();
        trebleLP.type = 'lowpass';
        trebleLP.frequency.value = config.high;
        trebleLP.Q.value = 0.707;
        
        // Snare frequency boost (around 200-400Hz)
        const snareBoost = context.createBiquadFilter();
        snareBoost.type = 'peaking';
        snareBoost.frequency.value = 250;
        snareBoost.Q.value = 1.5;
        snareBoost.gain.value = 2; // +2dB boost
        
        // Hi-hat/percussion clarity boost (2-4kHz)
        const clarityBoost = context.createBiquadFilter();
        clarityBoost.type = 'peaking';
        clarityBoost.frequency.value = 3000;
        clarityBoost.Q.value = 1.0;
        clarityBoost.gain.value = 1.5; // +1.5dB boost
        
        // Transient emphasis compressor
        const transientComp = context.createDynamicsCompressor();
        transientComp.threshold.value = -20;
        transientComp.knee.value = 5;
        transientComp.ratio.value = 3;
        transientComp.attack.value = 0.003; // Fast attack for transients
        transientComp.release.value = 0.05; // Quick release
        
        // Output gain
        const outputGain = context.createGain();
        outputGain.gain.value = 1.3; // Boost drum presence
        
        // Connect the chain
        bassHP.connect(snareBoost);
        snareBoost.connect(clarityBoost);
        clarityBoost.connect(trebleLP);
        trebleLP.connect(transientComp);
        transientComp.connect(outputGain);
        
        return { input: bassHP, output: outputGain };
    }

    /**
     * Create professional synth/melody channel processing chain
     */
    createSynthMelodyChain(context, config) {
        // High-pass to remove low-mid muddiness
        const muddyHP = context.createBiquadFilter();
        muddyHP.type = 'highpass';
        muddyHP.frequency.value = config.low;
        muddyHP.Q.value = 0.707;
        
        // Gentle high-frequency shelf
        const airShelf = context.createBiquadFilter();
        airShelf.type = 'highshelf';
        airShelf.frequency.value = 8000;
        airShelf.gain.value = 1; // +1dB for "air"
        
        // Presence boost for melody clarity (1-3kHz)
        const presenceBoost = context.createBiquadFilter();
        presenceBoost.type = 'peaking';
        presenceBoost.frequency.value = 2000;
        presenceBoost.Q.value = 1.0;
        presenceBoost.gain.value = 1.5; // +1.5dB boost
        
        // Gentle limiting for smooth dynamics
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.knee.value = 2;
        limiter.ratio.value = 8;
        limiter.attack.value = 0.005;
        limiter.release.value = 0.1;
        
        // De-esser (optional harsh frequency reduction)
        const deEsser = context.createBiquadFilter();
        deEsser.type = 'peaking';
        deEsser.frequency.value = 6000;
        deEsser.Q.value = 2.0;
        deEsser.gain.value = -2; // -2dB reduction of harsh frequencies
        
        // Output gain
        const outputGain = context.createGain();
        outputGain.gain.value = 1.2; // Boost melody presence
        
        // Connect the chain
        muddyHP.connect(presenceBoost);
        presenceBoost.connect(deEsser);
        deEsser.connect(airShelf);
        airShelf.connect(limiter);
        limiter.connect(outputGain);
        
        return { input: muddyHP, output: outputGain };
    }

    /**
     * Create fallback channels (just copy original audio)
     */
    createFallbackChannels(audioBuffer) {
        console.log('⚠️ Using fallback channels (no separation)');
        
        return {
            bass: audioBuffer,
            drums: audioBuffer,
            synth: audioBuffer
        };
    }

    /**
     * Get separation progress (for UI feedback)
     */
    getProgress() {
        return {
            isProcessing: this.isProcessing,
            method: 'professional-frequency-based',
            channels: ['bass', 'drums', 'synth'],
            description: 'Professional DJ-optimized frequency separation'
        };
    }

    /**
     * Analyze audio characteristics for optimal separation
     */
    analyzeAudioCharacteristics(audioBuffer) {
        // Basic analysis to optimize separation parameters
        const characteristics = {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            peakLevel: this.calculatePeakLevel(audioBuffer),
            dynamicRange: this.calculateDynamicRange(audioBuffer),
            estimatedGenre: this.estimateGenre(audioBuffer)
        };
        
        console.log('📊 Audio characteristics:', characteristics);
        return characteristics;
    }

    /**
     * Calculate peak level for dynamics analysis
     */
    calculatePeakLevel(audioBuffer) {
        let peak = 0;
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                peak = Math.max(peak, Math.abs(channelData[i]));
            }
        }
        return peak;
    }

    /**
     * Calculate dynamic range for processing optimization
     */
    calculateDynamicRange(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const windowSize = 1024;
        const values = [];
        
        for (let i = 0; i < channelData.length; i += windowSize) {
            let rms = 0;
            for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
                rms += channelData[i + j] * channelData[i + j];
            }
            values.push(Math.sqrt(rms / windowSize));
        }
        
        values.sort((a, b) => a - b);
        const p90 = values[Math.floor(values.length * 0.9)];
        const p10 = values[Math.floor(values.length * 0.1)];
        
        return 20 * Math.log10(p90 / p10); // Dynamic range in dB
    }

    /**
     * Estimate genre for separation optimization
     */
    estimateGenre(audioBuffer) {
        // Basic spectral analysis for genre estimation
        // This is a simplified version - real implementation would use FFT
        const characteristics = {
            bassHeavy: false,
            percussive: false,
            melodic: false
        };
        
        // Analyze first few seconds for characteristics
        const analysisLength = Math.min(audioBuffer.sampleRate * 10, audioBuffer.length);
        const channelData = audioBuffer.getChannelData(0);
        
        // Simple energy analysis in different frequency bands
        let lowEnergy = 0, midEnergy = 0, highEnergy = 0;
        
        for (let i = 0; i < analysisLength; i++) {
            const sample = Math.abs(channelData[i]);
            
            // This is a very simplified frequency analysis
            // Real implementation would use proper FFT
            if (i % 10 < 3) lowEnergy += sample;
            else if (i % 10 < 7) midEnergy += sample;
            else highEnergy += sample;
        }
        
        const total = lowEnergy + midEnergy + highEnergy;
        characteristics.bassHeavy = (lowEnergy / total) > 0.4;
        characteristics.percussive = (midEnergy / total) > 0.4;
        characteristics.melodic = (highEnergy / total) > 0.3;
        
        return characteristics;
    }
}

/**
 * Professional Multi-Channel Audio Player
 * Manages playback of separated professional DJ channels
 */
class ProfessionalMultiChannelPlayer {
    constructor(audioContext, separatedBuffers) {
        this.audioContext = audioContext;
        this.separatedBuffers = separatedBuffers;
        this.sources = {};
        this.gains = {};
        this.channelProcessors = {};
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.currentTime = 0;
        
        this.initializeProfessionalChannels();
    }

    initializeProfessionalChannels() {
        const channels = ['bass', 'drums', 'synth'];
        
        channels.forEach(channel => {
            // Create gain node for each channel
            this.gains[channel] = this.audioContext.createGain();
            this.gains[channel].gain.value = 1.0;
            
            // Create professional channel processor
            this.channelProcessors[channel] = this.createChannelProcessor(channel);
            
            // Connect gain through processor to master output
            this.gains[channel].connect(this.channelProcessors[channel].input);
            this.channelProcessors[channel].output.connect(this.audioContext.destination);
        });
        
        console.log('🎚️ Professional multi-channel player initialized');
        console.log(`🎛️ Channels: ${channels.join(', ')}`);
    }

    createChannelProcessor(channel) {
        // Create professional effects chain for each channel
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // EQ for each channel
        const eq = this.createChannelEQ(channel);
        
        // Connect: input -> EQ -> output
        input.connect(eq.input);
        eq.output.connect(output);
        
        return { input, output, eq };
    }

    createChannelEQ(channel) {
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // Create 3-band EQ for each channel
        const lowEQ = this.audioContext.createBiquadFilter();
        const midEQ = this.audioContext.createBiquadFilter();
        const highEQ = this.audioContext.createBiquadFilter();
        
        // Configure EQ based on channel type
        switch (channel) {
            case 'bass':
                lowEQ.type = 'lowshelf';
                lowEQ.frequency.value = 100;
                lowEQ.gain.value = 0;
                
                midEQ.type = 'peaking';
                midEQ.frequency.value = 250;
                midEQ.Q.value = 1.0;
                midEQ.gain.value = 0;
                
                highEQ.type = 'highshelf';
                highEQ.frequency.value = 1000;
                highEQ.gain.value = -3; // Reduce highs for bass channel
                break;
                
            case 'drums':
                lowEQ.type = 'highpass';
                lowEQ.frequency.value = 80;
                
                midEQ.type = 'peaking';
                midEQ.frequency.value = 1000;
                midEQ.Q.value = 0.7;
                midEQ.gain.value = 1; // Slight mid boost
                
                highEQ.type = 'peaking';
                highEQ.frequency.value = 4000;
                highEQ.Q.value = 1.0;
                highEQ.gain.value = 2; // Hi-hat clarity
                break;
                
            case 'synth':
                lowEQ.type = 'highpass';
                lowEQ.frequency.value = 200;
                
                midEQ.type = 'peaking';
                midEQ.frequency.value = 2000;
                midEQ.Q.value = 0.7;
                midEQ.gain.value = 1; // Presence boost
                
                highEQ.type = 'highshelf';
                highEQ.frequency.value = 8000;
                highEQ.gain.value = 1; // Air boost
                break;
        }
        
        // Connect EQ chain
        input.connect(lowEQ);
        lowEQ.connect(midEQ);
        midEQ.connect(highEQ);
        highEQ.connect(output);
        
        return { input, output, lowEQ, midEQ, highEQ };
    }

    async play(startTime = 0) {
        if (this.isPlaying) {
            this.stop();
        }
        
        try {
            this.startTime = this.audioContext.currentTime - startTime;
            this.isPlaying = true;
            
            // Create and start sources for each channel
            Object.keys(this.separatedBuffers).forEach(channel => {
                if (this.separatedBuffers[channel] && this.gains[channel]) {
                    const source = this.audioContext.createBufferSource();
                    source.buffer = this.separatedBuffers[channel];
                    source.connect(this.gains[channel]);
                    source.start(0, startTime);
                    
                    this.sources[channel] = source;
                }
            });
            
            console.log('▶️ Professional multi-channel playback started');
            
        } catch (error) {
            console.error('❌ Professional multi-channel playback failed:', error);
            this.isPlaying = false;
        }
    }

    pause() {
        if (!this.isPlaying) return;
        
        this.pauseTime = this.audioContext.currentTime - this.startTime;
        this.stop();
        
        console.log('⏸️ Professional multi-channel playback paused');
    }

    resume() {
        if (this.isPlaying) return;
        
        this.play(this.pauseTime);
        
        console.log('▶️ Professional multi-channel playback resumed');
    }

    stop() {
        if (!this.isPlaying) return;
        
        Object.values(this.sources).forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch (error) {
                // Source might already be stopped
            }
        });
        
        this.sources = {};
        this.isPlaying = false;
        this.pauseTime = 0;
        
        console.log('⏹️ Professional multi-channel playback stopped');
    }

    setChannelVolume(channel, volume) {
        if (this.gains[channel]) {
            this.gains[channel].gain.value = Math.max(0, Math.min(1, volume));
            console.log(`🔊 ${channel} volume: ${Math.round(volume * 100)}%`);
        }
    }

    setChannelEnabled(channel, enabled) {
        if (this.gains[channel]) {
            this.gains[channel].gain.value = enabled ? 1.0 : 0.0;
            console.log(`🎚️ ${channel} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    setChannelEQ(channel, band, gain) {
        const processor = this.channelProcessors[channel];
        if (processor && processor.eq) {
            switch (band) {
                case 'low':
                    processor.eq.lowEQ.gain.value = gain;
                    break;
                case 'mid':
                    processor.eq.midEQ.gain.value = gain;
                    break;
                case 'high':
                    processor.eq.highEQ.gain.value = gain;
                    break;
            }
            console.log(`🎛️ ${channel} ${band} EQ: ${gain > 0 ? '+' : ''}${gain.toFixed(1)}dB`);
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.pauseTime;
        return this.audioContext.currentTime - this.startTime;
    }

    getDuration() {
        if (!this.separatedBuffers.bass) return 0;
        return this.separatedBuffers.bass.duration;
    }

    getChannelInfo() {
        return {
            channels: Object.keys(this.separatedBuffers),
            isPlaying: this.isPlaying,
            currentTime: this.getCurrentTime(),
            duration: this.getDuration()
        };
    }
}

// Export classes for use in other modules
window.ProfessionalAudioSourceSeparator = ProfessionalAudioSourceSeparator;
window.ProfessionalMultiChannelPlayer = ProfessionalMultiChannelPlayer;

// Utility functions with professional naming
window.createProfessionalMultiChannelPlayer = function(audioContext, separatedBuffers) {
    return new ProfessionalMultiChannelPlayer(audioContext, separatedBuffers);
};

window.separateAudioSourceProfessional = async function(audioBuffer, audioContext) {
    const separator = new ProfessionalAudioSourceSeparator(audioContext);
    return await separator.separateAudio(audioBuffer);
};

// Legacy compatibility
window.AudioSourceSeparator = ProfessionalAudioSourceSeparator;
window.MultiChannelPlayer = ProfessionalMultiChannelPlayer;
window.createMultiChannelPlayer = window.createProfessionalMultiChannelPlayer;
window.separateAudioSource = window.separateAudioSourceProfessional;

console.log('✅ Professional Audio Source Separation System Ready');
console.log('🎚️ Professional 3-channel separation: Bass/Kick, Drums/Percussion, Synth/Melody');
console.log('🎛️ Advanced filtering with professional EQ and dynamics processing');
console.log('🔊 Optimized for professional DJ mixing workflows');