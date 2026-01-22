// Guitar Learning App - Main Application Logic

// Note names and their positions
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const GUITAR_STRINGS = ['E', 'A', 'D', 'G', 'B', 'E']; // Standard tuning
const FRETS = 16; // Number of frets to display

// Note color mapping - consistent colors for each note regardless of key
const NOTE_COLORS = {
    'C': '#3498db',   // Blue
    'C#': '#9b59b6',  // Purple
    'D': '#32cd32',   // Green
    'D#': '#00ced1',  // Cyan
    'E': '#ffa500',   // Orange
    'F': '#e91e63',   // Magenta
    'F#': '#ff69b4',  // Pink
    'G': '#ffd700',   // Gold
    'G#': '#8b4513',  // Brown
    'A': '#e74c3c',   // Red (matching root)
    'A#': '#ff6b6b',  // Light red/pink
    'B': '#1abc9c'    // Teal
};

// Scale intervals (semitones from root)
const SCALE_INTERVALS = {
    ionian: [0, 2, 4, 5, 7, 9, 11], // Major
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    aeolian: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
    locrian: [0, 1, 3, 5, 6, 8, 10],
    majorPentatonic: [0, 2, 4, 7, 9], // Major Pentatonic
    minorPentatonic: [0, 3, 5, 7, 10] // Minor Pentatonic
};

// Interval names
const INTERVAL_NAMES = ['R', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];

// Interval color mapping
const INTERVAL_COLORS = {
    0: 'root',      // Root
    1: 'flat2',     // b2
    2: 'second',    // 2
    3: 'flat3',     // b3
    4: 'third',     // 3
    5: 'fourth',    // 4
    6: 'sharp4',    // #4
    7: 'fifth',     // 5
    8: 'flat6',     // b6
    9: 'sixth',     // 6
    10: 'flat7',    // b7
    11: 'seventh'   // 7
};

// Chord intervals (semitones from root)
const CHORD_INTERVALS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
    dominant7: [0, 4, 7, 10],
    diminished7: [0, 3, 6, 9]
};

class GuitarApp {
    constructor() {
        this.currentMode = 'scales';
        this.currentDisplay = 'notes';
        this.audioContext = null;
        this.init();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    init() {
        this.initAudio();
        this.setupEventListeners();
        this.renderFretboard();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Type selection (scales/chords)
        document.getElementById('type-select').addEventListener('change', () => {
            this.currentMode = document.getElementById('type-select').value;
            this.updateModeUI();
            this.updateDisplay();
        });

        // Display toggle (notes/intervals)
        document.getElementById('display-select').addEventListener('change', () => {
            this.currentDisplay = document.getElementById('display-select').value;
            this.updateDisplayUI();
            this.updateDisplay();
        });

        // Scale options
        document.getElementById('scale-key').addEventListener('change', () => this.updateDisplay());
        document.getElementById('scale-mode').addEventListener('change', () => this.updateDisplay());
        document.getElementById('scale-position').addEventListener('change', () => this.updateDisplay());

        // Chord options
        document.getElementById('chord-note').addEventListener('change', () => this.updateDisplay());
        document.getElementById('chord-variation').addEventListener('change', () => this.updateDisplay());

        // Chord checkboxes
        for (let i = 1; i <= 7; i++) {
            document.getElementById(`chord-checkbox-${i}`).addEventListener('change', () => {
                this.updateChordFretboards();
            });
        }

        // Position checkboxes (now for chords)
        for (let i = 1; i <= 7; i++) {
            document.getElementById(`position-checkbox-${i}`).addEventListener('change', () => {
                // Get the current scale intervals to determine number of degrees
                const key = document.getElementById('scale-key').value;
                const mode = document.getElementById('scale-mode').value;
                const intervals = SCALE_INTERVALS[mode];
                // For pentatonic scales, show 7 chord fretboards (matching parent scale)
                const isPentatonicScale = intervals.length === 5;
                const numDegrees = isPentatonicScale ? 7 : intervals.length;
                this.updatePositionFretboards(numDegrees);
            });
        }

        // Pentatonic checkboxes
        for (let i = 1; i <= 7; i++) {
            document.getElementById(`pentatonic-checkbox-${i}`).addEventListener('change', () => {
                this.updatePentatonicFretboards();
            });
        }
    }

    updateModeUI() {
        const typeSelect = document.getElementById('type-select');
        const scaleOptions = document.getElementById('scale-options');
        const chordOptions = document.getElementById('chord-options');

        // Update dropdown value
        typeSelect.value = this.currentMode;

        if (this.currentMode === 'scales') {
            scaleOptions.style.display = 'flex';
            chordOptions.style.display = 'none';
        } else {
            scaleOptions.style.display = 'none';
            chordOptions.style.display = 'flex';
        }
    }

    updateDisplayUI() {
        const displaySelect = document.getElementById('display-select');
        // Update dropdown value
        displaySelect.value = this.currentDisplay;
    }

    renderFretboard() {
        const fretboard = document.getElementById('fretboard');
        fretboard.innerHTML = '';
        this.renderFretboardStructure(fretboard);

        // Also render chord fretboards
        for (let i = 1; i <= 7; i++) {
            const chordFretboard = document.querySelector(`#chord-fretboard-${i} .chord-fretboard`);
            if (chordFretboard) {
                chordFretboard.innerHTML = '';
                this.renderFretboardStructure(chordFretboard);
            }
        }

        // Also render position fretboards (now for chords)
        this.ensurePositionFretboardsRendered();
    }

    ensurePositionFretboardsRendered() {
        for (let i = 1; i <= 7; i++) {
            const positionFretboard = document.querySelector(`#position-fretboard-${i} .position-fretboard`);
            if (positionFretboard && positionFretboard.children.length === 0) {
                this.renderFretboardStructure(positionFretboard);
            }
        }
    }

    ensurePentatonicFretboardsRendered() {
        for (let i = 1; i <= 7; i++) {
            const pentatonicFretboard = document.querySelector(`#pentatonic-fretboard-${i} .position-fretboard`);
            if (pentatonicFretboard && pentatonicFretboard.children.length === 0) {
                this.renderFretboardStructure(pentatonicFretboard);
            }
        }
    }

    renderFretboardStructure(container) {
        // Create strings - reverse order so low E (thickest) is at bottom
        [...GUITAR_STRINGS].reverse().forEach((stringNote, reversedIndex) => {
            const stringIndex = GUITAR_STRINGS.length - 1 - reversedIndex;
            const stringDiv = document.createElement('div');
            stringDiv.className = 'string';
            const stringColor = this.getNoteColor(stringNote);
            const stringColorDark = this.darkenColor(stringColor);
            stringDiv.style.setProperty('--string-color', stringColor);
            stringDiv.style.setProperty('--string-color-dark', stringColorDark);
            
            // String label
            const label = document.createElement('div');
            label.className = 'string-label';
            label.textContent = stringNote;
            label.style.color = stringColor;
            stringDiv.appendChild(label);

            // Create frets
            for (let fret = 0; fret <= FRETS; fret++) {
                const fretDiv = document.createElement('div');
                fretDiv.className = 'fret';
                fretDiv.dataset.string = stringIndex;
                fretDiv.dataset.fret = fret;

                // Fret number label (only on top string - high E)
                if (reversedIndex === 0) {
                    const fretNumber = document.createElement('div');
                    fretNumber.className = 'fret-number';
                    fretNumber.textContent = fret;
                    fretDiv.appendChild(fretNumber);
                }

                stringDiv.appendChild(fretDiv);
            }

            container.appendChild(stringDiv);
        });
    }

    getNoteAtPosition(stringIndex, fret) {
        const openStringNote = GUITAR_STRINGS[stringIndex];
        const openStringIndex = NOTES.indexOf(openStringNote);
        const noteIndex = (openStringIndex + fret) % 12;
        return NOTES[noteIndex];
    }

    getIntervalFromRoot(note, rootNote) {
        const noteIndex = NOTES.indexOf(note);
        const rootIndex = NOTES.indexOf(rootNote);
        const interval = (noteIndex - rootIndex + 12) % 12;
        return interval;
    }

    getIntervalClass(interval) {
        return INTERVAL_COLORS[interval] || 'scale';
    }

    getNoteColor(note) {
        return NOTE_COLORS[note] || '#3498db';
    }

    darkenColor(color) {
        // Convert hex to RGB, darken by 20%, and convert back
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const darkenedR = Math.max(0, Math.floor(r * 0.8));
        const darkenedG = Math.max(0, Math.floor(g * 0.8));
        const darkenedB = Math.max(0, Math.floor(b * 0.8));
        return `rgb(${darkenedR}, ${darkenedG}, ${darkenedB})`;
    }

    getAvailableNotes() {
        let notes = [];
        if (this.currentMode === 'scales') {
            const key = document.getElementById('scale-key').value;
            const mode = document.getElementById('scale-mode').value;
            const intervals = SCALE_INTERVALS[mode];
            const keyIndex = NOTES.indexOf(key);
            notes = intervals.map(interval => {
                const noteIndex = (keyIndex + interval) % 12;
                return NOTES[noteIndex];
            });
        } else {
            const chordNote = document.getElementById('chord-note').value;
            const variation = document.getElementById('chord-variation').value;
            const intervals = CHORD_INTERVALS[variation];
            const chordNoteIndex = NOTES.indexOf(chordNote);
            notes = intervals.map(interval => {
                const noteIndex = (chordNoteIndex + interval) % 12;
                return NOTES[noteIndex];
            });
        }
        return notes;
    }

    getAvailablePositions(notes) {
        // Get all fret positions that match the available notes
        const positions = [];
        let minFret = 0;
        let maxFret = FRETS;

        if (this.currentMode === 'scales') {
            const position = parseInt(document.getElementById('scale-position').value);
            const key = document.getElementById('scale-key').value;
            const mode = document.getElementById('scale-mode').value;
            const intervals = SCALE_INTERVALS[mode];
            const keyIndex = NOTES.indexOf(key);
            
            // Find the starting fret for this position on the low E string
            const startingScaleDegree = position - 1; // 0-indexed
            const startingInterval = intervals[startingScaleDegree % intervals.length];
            const startingNote = NOTES[(keyIndex + startingInterval) % 12];
            
            // Find where this note appears on the low E string
            const lowEStringNote = GUITAR_STRINGS[0]; // 'E'
            const lowEIndex = NOTES.indexOf(lowEStringNote);
            const startingNoteIndex = NOTES.indexOf(startingNote);
            let startingFret = (startingNoteIndex - lowEIndex + 12) % 12;
            
            minFret = startingFret;
            maxFret = Math.min(startingFret + 4, FRETS);
        }

        GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
            for (let fret = minFret; fret <= maxFret; fret++) {
                const note = this.getNoteAtPosition(stringIndex, fret);
                if (notes.includes(note)) {
                    positions.push({ stringIndex, fret, note });
                }
            }
        });

        return positions;
    }

    getFrequency(stringIndex, fret) {
        // Base frequencies for open strings (E2, A2, D3, G3, B3, E4)
        const openFrequencies = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
        const baseFreq = openFrequencies[stringIndex];
        // Each fret is a semitone, so multiply by 2^(fret/12)
        return baseFreq * Math.pow(2, fret / 12);
    }

    playNote(stringIndex, fret) {
        if (!this.audioContext) {
            this.initAudio();
        }
        if (!this.audioContext) return;

        const frequency = this.getFrequency(stringIndex, fret);
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    updateDisplay() {
        this.clearFretboard();

            if (this.currentMode === 'scales') {
                this.displayScale();
            } else {
                this.displayChord();
        }
    }

    clearFretboard() {
        const frets = document.querySelectorAll('#fretboard .fret');
        frets.forEach(fret => {
            const existingNote = fret.querySelector('.note');
            if (existingNote) {
                existingNote.remove();
            }
            // Reset visibility - will be updated by updateFretboardVisibility if needed
            fret.style.display = '';
        });
    }

    updateFretboardVisibility(minFret, maxFret, fretboardElement = null) {
        // If no specific fretboard is provided, use the main fretboard
        const fretboard = fretboardElement || document.getElementById('fretboard');
        if (!fretboard) return;
        
        const allFrets = fretboard.querySelectorAll('.fret');
        
        allFrets.forEach(fretDiv => {
            const fret = parseInt(fretDiv.dataset.fret);
            if (fret < minFret || fret > maxFret) {
                fretDiv.style.display = 'none';
            } else {
                fretDiv.style.display = 'flex';
            }
        });
        
        // Also update the fretboard container to scroll to the visible range (only for main fretboard)
        if (!fretboardElement) {
            const fretboardContainer = document.querySelector('.fretboard-container');
            if (fretboardContainer && minFret > 0) {
                // Calculate approximate scroll position to center the visible range
                const fretWidth = 60; // Approximate width of each fret
                const scrollPosition = minFret * fretWidth;
                fretboardContainer.scrollLeft = Math.max(0, scrollPosition - 100);
            } else if (fretboardContainer && minFret === 0) {
                fretboardContainer.scrollLeft = 0;
            }
        }
    }

    getChordQuality(scaleIntervals, degreeIndex) {
        // Get the intervals for a chord built on this scale degree
        // degreeIndex: 0 = I, 1 = ii, 2 = iii, etc.
        const rootInterval = scaleIntervals[degreeIndex % scaleIntervals.length];
        const thirdInterval = scaleIntervals[(degreeIndex + 2) % scaleIntervals.length];
        const fifthInterval = scaleIntervals[(degreeIndex + 4) % scaleIntervals.length];
        
        // Calculate intervals relative to root
        const third = (thirdInterval - rootInterval + 12) % 12;
        const fifth = (fifthInterval - rootInterval + 12) % 12;
        
        // Determine chord quality
        if (third === 3 && fifth === 6) return 'diminished';
        if (third === 3 && fifth === 7) return 'minor';
        if (third === 4 && fifth === 7) return 'major';
        if (third === 4 && fifth === 8) return 'augmented';
        return 'major'; // default
    }

    getDegreeLabel(degreeIndex) {
        // Get the scale degree label (I, ii, iii, IV, V, vi, vii°)
        const labels = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
        return labels[degreeIndex] || '';
    }

    getChordName(rootNote, chordQuality) {
        // Get the full chord name (e.g., "D Minor", "C Major")
        const qualityNames = {
            'major': 'Major',
            'minor': 'Minor',
            'diminished': 'Diminished',
            'augmented': 'Augmented'
        };
        const qualityName = qualityNames[chordQuality] || 'Major';
        return `${rootNote} ${qualityName}`;
    }

    getPentatonicName(rootNote, isMajor) {
        // Get the pentatonic scale name (e.g., "A Minor Pentatonic", "C Major Pentatonic")
        const type = isMajor ? 'Major Pentatonic' : 'Minor Pentatonic';
        return `${rootNote} ${type}`;
    }

    getPositionFretRange(key, intervals, position) {
        // Standard position fret ranges (matching the C Major image)
        // These are the base positions for C Major
        const standardPositions = {
            1: { minFret: 7, maxFret: 11 },
            2: { minFret: 9, maxFret: 13 },
            3: { minFret: 12, maxFret: 16 },
            4: { minFret: 2, maxFret: 6 },
            5: { minFret: 5, maxFret: 9 }
        };
        
        // Check if this is a 7-note scale (ionian, dorian, phrygian, lydian, mixolydian, aeolian, locrian)
        const isSevenNoteScale = intervals.length === 7;
        
        // For all 7-note scales, shift positions based on key offset from C
        if (isSevenNoteScale) {
            if (standardPositions[position]) {
                // Calculate the offset: how many semitones is this key from C?
                const cIndex = NOTES.indexOf('C');
                const keyIndex = NOTES.indexOf(key);
                const keyOffset = (keyIndex - cIndex + 12) % 12;
                
                // Shift the standard positions by the key offset
                const shiftedMinFret = standardPositions[position].minFret + keyOffset;
                const shiftedMaxFret = standardPositions[position].maxFret + keyOffset;
                
                return {
                    minFret: Math.max(0, shiftedMinFret),
                    maxFret: Math.min(FRETS, shiftedMaxFret),
                    startingFret: Math.max(0, shiftedMinFret)
                };
            }
        }
        
        // For pentatonic scales, use the same standard positions as their parent scale
        // (ionian for major pentatonic, aeolian for minor pentatonic)
        // This ensures positions match when showing pentatonics over the full parent scale
        const isMajorPentatonic = intervals.length === 5 && JSON.stringify(intervals) === JSON.stringify(SCALE_INTERVALS.majorPentatonic);
        const isMinorPentatonic = intervals.length === 5 && JSON.stringify(intervals) === JSON.stringify(SCALE_INTERVALS.minorPentatonic);
        
        if (isMajorPentatonic || isMinorPentatonic) {
            // Use standard positions shifted by key offset, just like 7-note scales
            // This ensures C major pentatonic position 1 is frets 7-11, matching C major
            if (standardPositions[position]) {
                // Calculate the offset: how many semitones is this key from C?
                const cIndex = NOTES.indexOf('C');
                const keyIndex = NOTES.indexOf(key);
                const keyOffset = (keyIndex - cIndex + 12) % 12;
                
                // Shift the standard positions by the key offset
                const shiftedMinFret = standardPositions[position].minFret + keyOffset;
                const shiftedMaxFret = standardPositions[position].maxFret + keyOffset;
                
                return {
                    minFret: Math.max(0, shiftedMinFret),
                    maxFret: Math.min(FRETS, shiftedMaxFret),
                    startingFret: Math.max(0, shiftedMinFret)
                };
            }
        }
        
        // For other scales (modes with different interval patterns),
        // calculate dynamically
        const keyIndex = NOTES.indexOf(key);
        const rootNote = NOTES[keyIndex];
        const lowEStringNote = GUITAR_STRINGS[0]; // 'E'
        const lowEIndex = NOTES.indexOf(lowEStringNote);
        const rootNoteIndex = NOTES.indexOf(rootNote);
        
        // Find where root appears on low E string
        let rootFretOnLowE = (rootNoteIndex - lowEIndex + 12) % 12;
        
        // Position 1 starts at the root note on low E string
        // Each subsequent position starts at the next scale degree on low E string
        const startingScaleDegree = position - 1; // 0-indexed
        const startingInterval = intervals[startingScaleDegree % intervals.length];
        const startingNote = NOTES[(keyIndex + startingInterval) % 12];
        const startingNoteIndex = NOTES.indexOf(startingNote);
        let positionStartFret = (startingNoteIndex - lowEIndex + 12) % 12;
        
        // All positions span 5 frets (matching the Position 1 image)
        const fretSpan = 5;
        
        // Set the range - start at the position's starting note on low E
        const minFret = Math.max(0, positionStartFret);
        const maxFret = Math.min(FRETS, positionStartFret + fretSpan - 1);
        
        return { minFret, maxFret, startingFret: minFret };
    }

    displayScale() {
        const key = document.getElementById('scale-key').value;
        const mode = document.getElementById('scale-mode').value;
        const positionValue = document.getElementById('scale-position').value;
        const intervals = SCALE_INTERVALS[mode];

        // Get scale notes
        const keyIndex = NOTES.indexOf(key);
        const scaleNotes = intervals.map(interval => {
            const noteIndex = (keyIndex + interval) % 12;
            return NOTES[noteIndex];
        });

        // Show/hide combined scale options (chords and pentatonics) - only in scale mode
        const scaleOptionsContainer = document.getElementById('scale-options-checkboxes');
        const pentatonicOptionsContainer = document.getElementById('pentatonic-options-checkboxes');
        const positionFretboardsContainer = document.getElementById('position-fretboards');
        const pentatonicFretboardsContainer = document.getElementById('pentatonic-fretboards');
        const isScaleWithChords = intervals.length === 7 || intervals.length === 5; // 7-note scales or pentatonic
        const isSevenNoteScale = intervals.length === 7;
        const isPentatonicScale = intervals.length === 5; // Major or Minor Pentatonic
        
        if (this.currentMode === 'scales') {
            // Show the combined container if we have scales that support chords or pentatonics
            if (isScaleWithChords || isSevenNoteScale) {
                // Show chords section for 7-note scales and pentatonic scales
                if (isScaleWithChords) {
                    scaleOptionsContainer.style.display = 'flex';
                } else {
                    scaleOptionsContainer.style.display = 'none';
                }
                
                // Show pentatonics section for 7-note scales AND pentatonic scales (always show for pentatonic)
                if (isSevenNoteScale || isPentatonicScale) {
                    pentatonicOptionsContainer.style.display = 'flex';
                } else {
                    pentatonicOptionsContainer.style.display = 'none';
                }
                
                // Show/hide chord fretboards (for 7-note scales and pentatonic scales, not full fretboard)
                if (positionValue !== 'full' && isScaleWithChords) {
            positionFretboardsContainer.style.display = 'block';
            this.ensurePositionFretboardsRendered();
            const selectedPosition = parseInt(positionValue);
            // For pentatonic scales, use parent scale intervals for chord display
            // But use original intervals for position range calculation
            let chordIntervals = intervals;
            let positionIntervals = intervals;
            if (isPentatonicScale) {
                const isMajor = mode === 'majorPentatonic';
                chordIntervals = isMajor ? SCALE_INTERVALS.ionian : SCALE_INTERVALS.aeolian;
                // Keep original pentatonic intervals for position range
                positionIntervals = intervals;
            }
            this.displayChordFretboardsInPosition(key, chordIntervals, selectedPosition, positionIntervals);
                    // Always show 7 chord fretboards for pentatonic scales (matching parent scale)
                    const numChordDegrees = isPentatonicScale ? 7 : intervals.length;
                    this.updatePositionFretboards(numChordDegrees);
        } else {
            positionFretboardsContainer.style.display = 'none';
        }

                // Show/hide pentatonic fretboards (for 7-note scales AND pentatonic scales)
                if (isSevenNoteScale) {
                    pentatonicFretboardsContainer.style.display = 'block';
                    this.ensurePentatonicFretboardsRendered();
                    if (positionValue !== 'full') {
                        const selectedPosition = parseInt(positionValue);
                        this.displayPentatonicFretboardsInPosition(key, intervals, selectedPosition);
                    } else {
                        this.displayPentatonicFretboards(key, intervals);
                    }
                    this.updatePentatonicFretboards(intervals.length);
                } else if (isPentatonicScale) {
                    // For pentatonic scales, show overlapping pentatonic scales
                    pentatonicFretboardsContainer.style.display = 'block';
                    this.ensurePentatonicFretboardsRendered();
                    if (positionValue !== 'full') {
                        const selectedPosition = parseInt(positionValue);
                        this.displayOverlappingPentatonicFretboardsInPosition(key, mode, selectedPosition);
                    } else {
                        this.displayOverlappingPentatonicFretboards(key, mode);
                    }
                    // Use 7 degrees since we're showing pentatonics based on parent scale (ionian/aeolian)
                    this.updatePentatonicFretboards(7);
                } else {
                    pentatonicFretboardsContainer.style.display = 'none';
                }
            } else {
                scaleOptionsContainer.style.display = 'none';
                pentatonicOptionsContainer.style.display = 'none';
                positionFretboardsContainer.style.display = 'none';
                pentatonicFretboardsContainer.style.display = 'none';
            }
        } else {
            scaleOptionsContainer.style.display = 'none';
            pentatonicOptionsContainer.style.display = 'none';
            positionFretboardsContainer.style.display = 'none';
            pentatonicFretboardsContainer.style.display = 'none';
        }

        // For full fretboard mode, use the same position fretboards container
        // (chord fretboards are now handled in the position fretboards container)
        const chordFretboardsContainer = document.getElementById('chord-fretboards');
        if (positionValue === 'full' && this.currentMode === 'scales' && isScaleWithChords) {
            // Use position fretboards container for full mode too
            positionFretboardsContainer.style.display = 'block';
            this.ensurePositionFretboardsRendered();
            // For pentatonic scales, use parent scale intervals for chord display
            let chordIntervals = intervals;
            if (isPentatonicScale) {
                const isMajor = mode === 'majorPentatonic';
                chordIntervals = isMajor ? SCALE_INTERVALS.ionian : SCALE_INTERVALS.aeolian;
            }
            this.displayChordFretboards(key, chordIntervals);
            // Always show 7 chord fretboards for pentatonic scales (matching parent scale)
            const numChordDegrees = isPentatonicScale ? 7 : intervals.length;
            this.updatePositionFretboards(numChordDegrees);
            chordFretboardsContainer.style.display = 'none';
        } else {
            chordFretboardsContainer.style.display = 'none';
        }

        // Handle position
        let minFret = 0;
        let maxFret = FRETS;

        if (positionValue !== 'full') {
            const position = parseInt(positionValue);
            const fretRange = this.getPositionFretRange(key, intervals, position);
            minFret = fretRange.minFret;
            maxFret = fretRange.maxFret;
            // Hide frets outside the position range
            this.updateFretboardVisibility(minFret, maxFret);
        } else {
            // Show all frets for full fretboard
            this.updateFretboardVisibility(0, FRETS);
        }

        // Mark scale notes on fretboard within the selected position
        GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
            for (let fret = minFret; fret <= maxFret; fret++) {
                const note = this.getNoteAtPosition(stringIndex, fret);
                
                if (scaleNotes.includes(note)) {
                    const fretDiv = document.querySelector(`#fretboard .fret[data-string="${stringIndex}"][data-fret="${fret}"]`);
                    if (fretDiv) {
                        const noteDiv = document.createElement('div');
                        const interval = this.getIntervalFromRoot(note, key);
                        const intervalClass = this.getIntervalClass(interval);
                        
                        if (this.currentDisplay === 'notes') {
                            // Use note color when displaying notes
                            const noteColor = this.getNoteColor(note);
                            noteDiv.className = 'note scale';
                            noteDiv.style.background = noteColor;
                            noteDiv.style.borderColor = this.darkenColor(noteColor);
                            noteDiv.textContent = note;
                        } else {
                            // Use interval color when displaying intervals
                            noteDiv.className = `note scale interval-${intervalClass}`;
                            // Use the actual interval name with flat/sharp designations
                            const intervalName = INTERVAL_NAMES[interval];
                            noteDiv.textContent = intervalName;
                        }
                        
                        if (note === key) {
                            noteDiv.classList.add('root');
                        }

                        fretDiv.appendChild(noteDiv);
                    }
                }
            }
        });
    }

    displayChordFretboardsInPosition(key, intervals, selectedPosition, positionIntervals = null) {
        const keyIndex = NOTES.indexOf(key);
        // Use positionIntervals for fret range if provided (for pentatonic scales),
        // otherwise use intervals (chord intervals)
        const fretRangeIntervals = positionIntervals || intervals;
        const fretRange = this.getPositionFretRange(key, fretRangeIntervals, selectedPosition);
        const numDegrees = intervals.length;
        
        // Display chords for each scale degree
        for (let degree = 0; degree < numDegrees; degree++) {
            const rootInterval = intervals[degree];
            const rootNote = NOTES[(keyIndex + rootInterval) % 12];
            const chordQuality = this.getChordQuality(intervals, degree);
            
            // Get chord intervals
            const chordIntervals = CHORD_INTERVALS[chordQuality] || CHORD_INTERVALS.major;
            const chordNotes = chordIntervals.map(interval => {
                const noteIndex = (NOTES.indexOf(rootNote) + interval) % 12;
                return NOTES[noteIndex];
            });
            
            // Find the fretboard container for this chord
            const fretboardWrapper = document.getElementById(`position-fretboard-${degree + 1}`);
            if (!fretboardWrapper) continue;
            const fretboard = fretboardWrapper.querySelector('.position-fretboard');
            if (!fretboard) continue;
            
            // Update the label with chord name
            const labelElement = fretboardWrapper.querySelector('.position-label');
            if (labelElement) {
                const degreeLabel = this.getDegreeLabel(degree);
                const chordName = this.getChordName(rootNote, chordQuality);
                labelElement.textContent = `${degreeLabel} - ${chordName}`;
            }
            
            // Clear existing notes
            fretboard.querySelectorAll('.note').forEach(note => note.remove());
            
            // Apply the same visibility settings as the main fretboard
            this.updateFretboardVisibility(fretRange.minFret, fretRange.maxFret, fretboard);
            
            // Render chord notes for this position
            GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
                for (let fret = fretRange.minFret; fret <= fretRange.maxFret; fret++) {
                    const note = this.getNoteAtPosition(stringIndex, fret);
                    
                    if (chordNotes.includes(note)) {
                        const fretDiv = fretboard.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fret}"]`);
                        if (fretDiv) {
                            const noteDiv = document.createElement('div');
                            const interval = this.getIntervalFromRoot(note, rootNote);
                            const intervalClass = this.getIntervalClass(interval);
                            
                            if (this.currentDisplay === 'notes') {
                                const noteColor = this.getNoteColor(note);
                                noteDiv.className = 'note chord';
                                noteDiv.style.background = noteColor;
                                noteDiv.style.borderColor = this.darkenColor(noteColor);
                                noteDiv.textContent = note;
                            } else {
                                noteDiv.className = `note chord interval-${intervalClass}`;
                                const intervalName = INTERVAL_NAMES[interval];
                                noteDiv.textContent = intervalName;
                            }
                            
                            if (note === rootNote) {
                                noteDiv.classList.add('root');
                            }
                            
                            fretDiv.appendChild(noteDiv);
                        }
                    }
                }
            });
        }
    }

    updatePositionFretboards(numDegrees = 7) {
        // Show/hide chord fretboards based on checkbox state
        // Also hide checkboxes and fretboards that aren't needed for this scale
        for (let i = 1; i <= 7; i++) {
            const checkbox = document.getElementById(`position-checkbox-${i}`);
            const fretboardWrapper = document.getElementById(`position-fretboard-${i}`);
            if (checkbox && fretboardWrapper) {
                if (i <= numDegrees) {
                    // Show checkbox and fretboard (if checked)
                    checkbox.parentElement.style.display = 'flex';
                fretboardWrapper.style.display = checkbox.checked ? 'flex' : 'none';
                } else {
                    // Hide checkbox and fretboard for scales with fewer degrees
                    checkbox.parentElement.style.display = 'none';
                    fretboardWrapper.style.display = 'none';
                }
            }
        }
    }

    displayPentatonicFretboardsInPosition(key, intervals, selectedPosition) {
        const keyIndex = NOTES.indexOf(key);
        const fretRange = this.getPositionFretRange(key, intervals, selectedPosition);
        const numDegrees = intervals.length;
        
        // Display pentatonic scales for each scale degree
        for (let degree = 0; degree < numDegrees; degree++) {
            const rootInterval = intervals[degree];
            const rootNote = NOTES[(keyIndex + rootInterval) % 12];
            
            // Determine if this degree should use major or minor pentatonic
            // Based on the chord quality: major/augmented → major pentatonic, minor/diminished → minor pentatonic
            const chordQuality = this.getChordQuality(intervals, degree);
            const useMajorPentatonic = chordQuality === 'major' || chordQuality === 'augmented';
            const pentatonicIntervals = useMajorPentatonic ? SCALE_INTERVALS.majorPentatonic : SCALE_INTERVALS.minorPentatonic;
            
            // Get pentatonic scale notes
            const pentatonicNotes = pentatonicIntervals.map(interval => {
                const noteIndex = (NOTES.indexOf(rootNote) + interval) % 12;
                return NOTES[noteIndex];
            });
            
            // Find the fretboard container for this pentatonic
            const fretboardWrapper = document.getElementById(`pentatonic-fretboard-${degree + 1}`);
            if (!fretboardWrapper) continue;
            const fretboard = fretboardWrapper.querySelector('.position-fretboard');
            if (!fretboard) continue;
            
            // Update the label with pentatonic name
            const labelElement = fretboardWrapper.querySelector('.position-label');
            if (labelElement) {
                const degreeLabel = this.getDegreeLabel(degree);
                const pentatonicName = this.getPentatonicName(rootNote, useMajorPentatonic);
                labelElement.textContent = `${degreeLabel} - ${pentatonicName}`;
            }
            
            // Clear existing notes
            fretboard.querySelectorAll('.note').forEach(note => note.remove());
            
            // Apply the same visibility settings as the main fretboard
            this.updateFretboardVisibility(fretRange.minFret, fretRange.maxFret, fretboard);
            
            // Render pentatonic scale notes for this position
            GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
                for (let fret = fretRange.minFret; fret <= fretRange.maxFret; fret++) {
                    const note = this.getNoteAtPosition(stringIndex, fret);
                    
                    if (pentatonicNotes.includes(note)) {
                        const fretDiv = fretboard.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fret}"]`);
                        if (fretDiv) {
                            const noteDiv = document.createElement('div');
                            const interval = this.getIntervalFromRoot(note, rootNote);
                            const intervalClass = this.getIntervalClass(interval);
                            
                            if (this.currentDisplay === 'notes') {
                                const noteColor = this.getNoteColor(note);
                                noteDiv.className = 'note scale';
                                noteDiv.style.background = noteColor;
                                noteDiv.style.borderColor = this.darkenColor(noteColor);
                                noteDiv.textContent = note;
                            } else {
                                // Use interval name with flat/sharp designations
                                noteDiv.className = `note scale interval-${intervalClass}`;
                                const intervalName = INTERVAL_NAMES[interval];
                                noteDiv.textContent = intervalName;
                            }
                            
                            if (note === rootNote) {
                                noteDiv.classList.add('root');
                            }
                            
                            fretDiv.appendChild(noteDiv);
                        }
                    }
                }
            });
        }
    }

    displayPentatonicFretboards(key, scaleIntervals) {
        const keyIndex = NOTES.indexOf(key);
        const numDegrees = scaleIntervals.length;
        
        // Display pentatonic scales for each scale degree
        for (let degree = 0; degree < numDegrees; degree++) {
            const rootInterval = scaleIntervals[degree];
            const rootNote = NOTES[(keyIndex + rootInterval) % 12];
            
            // Determine if this degree should use major or minor pentatonic
            // Based on the chord quality: major/augmented → major pentatonic, minor/diminished → minor pentatonic
            const chordQuality = this.getChordQuality(scaleIntervals, degree);
            const useMajorPentatonic = chordQuality === 'major' || chordQuality === 'augmented';
            const pentatonicIntervals = useMajorPentatonic ? SCALE_INTERVALS.majorPentatonic : SCALE_INTERVALS.minorPentatonic;
            
            // Get pentatonic scale notes
            const pentatonicNotes = pentatonicIntervals.map(interval => {
                const noteIndex = (NOTES.indexOf(rootNote) + interval) % 12;
                return NOTES[noteIndex];
            });
            
            // Find the fretboard container for this pentatonic
            const fretboardWrapper = document.getElementById(`pentatonic-fretboard-${degree + 1}`);
            if (!fretboardWrapper) continue;
            const fretboard = fretboardWrapper.querySelector('.position-fretboard');
            if (!fretboard) continue;
            
            // Update the label with pentatonic name
            const labelElement = fretboardWrapper.querySelector('.position-label');
            if (labelElement) {
                const degreeLabel = this.getDegreeLabel(degree);
                const pentatonicName = this.getPentatonicName(rootNote, useMajorPentatonic);
                labelElement.textContent = `${degreeLabel} - ${pentatonicName}`;
            }
            
            // Clear existing notes
            fretboard.querySelectorAll('.note').forEach(note => note.remove());
            
            // Apply the same visibility settings as the main fretboard (show all frets for full mode)
            this.updateFretboardVisibility(0, FRETS, fretboard);
            
            // Render pentatonic scale notes
            GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
                for (let fret = 0; fret <= FRETS; fret++) {
                    const note = this.getNoteAtPosition(stringIndex, fret);
                    
                    if (pentatonicNotes.includes(note)) {
                        const fretDiv = fretboard.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fret}"]`);
                        if (fretDiv) {
                            const noteDiv = document.createElement('div');
                            const interval = this.getIntervalFromRoot(note, rootNote);
                            const intervalClass = this.getIntervalClass(interval);
                            
                            if (this.currentDisplay === 'notes') {
                                const noteColor = this.getNoteColor(note);
                                noteDiv.className = 'note scale';
                                noteDiv.style.background = noteColor;
                                noteDiv.style.borderColor = this.darkenColor(noteColor);
                                noteDiv.textContent = note;
                            } else {
                                // Use interval name with flat/sharp designations
                                noteDiv.className = `note scale interval-${intervalClass}`;
                                const intervalName = INTERVAL_NAMES[interval];
                                noteDiv.textContent = intervalName;
                            }
                            
                            if (note === rootNote) {
                                noteDiv.classList.add('root');
                            }
                            
                            fretDiv.appendChild(noteDiv);
                        }
                    }
                }
            });
        }
    }

    updatePentatonicFretboards(numDegrees = 7) {
        // Show/hide pentatonic fretboards based on checkbox state
        // Also hide checkboxes and fretboards that aren't needed for this scale
        for (let i = 1; i <= 7; i++) {
            const checkbox = document.getElementById(`pentatonic-checkbox-${i}`);
            const fretboardWrapper = document.getElementById(`pentatonic-fretboard-${i}`);
            if (checkbox && fretboardWrapper) {
                if (i <= numDegrees) {
                    // Show checkbox (always visible) and fretboard (if checked)
                    const parentElement = checkbox.parentElement;
                    if (parentElement) {
                        parentElement.style.display = 'flex';
                        parentElement.style.visibility = 'visible';
                    }
                    checkbox.style.display = '';
                    checkbox.style.visibility = 'visible';
                    fretboardWrapper.style.display = checkbox.checked ? 'flex' : 'none';
                } else {
                    // Hide checkbox and fretboard for scales with fewer degrees
                    const parentElement = checkbox.parentElement;
                    if (parentElement) {
                        parentElement.style.display = 'none';
                    }
                    fretboardWrapper.style.display = 'none';
                }
            }
        }
    }

    displayOverlappingPentatonicFretboardsInPosition(key, mode, selectedPosition) {
        // Use the same logic as ionian/aeolian: map checkboxes directly to parent scale degrees
        const keyIndex = NOTES.indexOf(key);
        const isMajor = mode === 'majorPentatonic';
        
        // Get the parent scale intervals (major pentatonic comes from major/ionian, minor from minor/aeolian)
        const parentScaleIntervals = isMajor ? SCALE_INTERVALS.ionian : SCALE_INTERVALS.aeolian;
        const numDegrees = parentScaleIntervals.length;
        
        const currentIntervals = SCALE_INTERVALS[mode];
        const fretRange = this.getPositionFretRange(key, currentIntervals, selectedPosition);
        
        // Display overlapping pentatonic scales for each scale degree (matching ionian/aeolian logic)
        for (let degree = 0; degree < numDegrees; degree++) {
            const rootInterval = parentScaleIntervals[degree];
            const rootNote = NOTES[(keyIndex + rootInterval) % 12];
            
            // Determine if this degree should use major or minor pentatonic
            // Based on the chord quality: major/augmented → major pentatonic, minor/diminished → minor pentatonic
            const chordQuality = this.getChordQuality(parentScaleIntervals, degree);
            const useMajorPentatonic = chordQuality === 'major' || chordQuality === 'augmented';
            const pentatonicIntervals = useMajorPentatonic ? SCALE_INTERVALS.majorPentatonic : SCALE_INTERVALS.minorPentatonic;
            
            // Get pentatonic scale notes
            const pentatonicNotes = pentatonicIntervals.map(interval => {
                const noteIndex = (NOTES.indexOf(rootNote) + interval) % 12;
                return NOTES[noteIndex];
            });
            
            // Find the fretboard container for this pentatonic (checkbox number = degree + 1)
            const fretboardWrapper = document.getElementById(`pentatonic-fretboard-${degree + 1}`);
            if (!fretboardWrapper) continue;
            const fretboard = fretboardWrapper.querySelector('.position-fretboard');
            if (!fretboard) continue;
            
            // Update the label with pentatonic name (matching ionian/aeolian format)
            const labelElement = fretboardWrapper.querySelector('.position-label');
            if (labelElement) {
                const degreeLabel = this.getDegreeLabel(degree);
                const pentatonicName = this.getPentatonicName(rootNote, useMajorPentatonic);
                labelElement.textContent = `${degreeLabel} - ${pentatonicName}`;
            }
            
            // Clear existing notes
            fretboard.querySelectorAll('.note').forEach(note => note.remove());
            
            // Apply the same visibility settings as the main fretboard
            this.updateFretboardVisibility(fretRange.minFret, fretRange.maxFret, fretboard);
            
            // Render pentatonic scale notes for this position
            GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
                for (let fret = fretRange.minFret; fret <= fretRange.maxFret; fret++) {
                    const note = this.getNoteAtPosition(stringIndex, fret);
                    
                    if (pentatonicNotes.includes(note)) {
                        const fretDiv = fretboard.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fret}"]`);
                        if (fretDiv) {
                            const noteDiv = document.createElement('div');
                            const interval = this.getIntervalFromRoot(note, rootNote);
                            const intervalClass = this.getIntervalClass(interval);
                            
                            if (this.currentDisplay === 'notes') {
                                const noteColor = this.getNoteColor(note);
                                noteDiv.className = 'note scale';
                                noteDiv.style.background = noteColor;
                                noteDiv.style.borderColor = this.darkenColor(noteColor);
                                noteDiv.textContent = note;
                            } else {
                                // Use interval name with flat/sharp designations
                                noteDiv.className = `note scale interval-${intervalClass}`;
                                const intervalName = INTERVAL_NAMES[interval];
                                noteDiv.textContent = intervalName;
                            }
                            
                            if (note === rootNote) {
                                noteDiv.classList.add('root');
                            }
                            
                            fretDiv.appendChild(noteDiv);
                        }
                    }
                }
            });
        }
    }

    displayOverlappingPentatonicFretboards(key, mode) {
        // Use the same logic as ionian/aeolian: map checkboxes directly to parent scale degrees
        const keyIndex = NOTES.indexOf(key);
        const isMajor = mode === 'majorPentatonic';
        
        // Get the parent scale intervals (major pentatonic comes from major/ionian, minor from minor/aeolian)
        const parentScaleIntervals = isMajor ? SCALE_INTERVALS.ionian : SCALE_INTERVALS.aeolian;
        const numDegrees = parentScaleIntervals.length;
        
        // Display pentatonic scales for each scale degree (matching ionian/aeolian logic)
        for (let degree = 0; degree < numDegrees; degree++) {
            const rootInterval = parentScaleIntervals[degree];
            const rootNote = NOTES[(keyIndex + rootInterval) % 12];
            
            // Determine if this degree should use major or minor pentatonic
            // Based on the chord quality: major/augmented → major pentatonic, minor/diminished → minor pentatonic
            const chordQuality = this.getChordQuality(parentScaleIntervals, degree);
            const useMajorPentatonic = chordQuality === 'major' || chordQuality === 'augmented';
            const pentatonicIntervals = useMajorPentatonic ? SCALE_INTERVALS.majorPentatonic : SCALE_INTERVALS.minorPentatonic;
            
            // Get pentatonic scale notes
            const pentatonicNotes = pentatonicIntervals.map(interval => {
                const noteIndex = (NOTES.indexOf(rootNote) + interval) % 12;
                return NOTES[noteIndex];
            });
            
            // Find the fretboard container for this pentatonic (checkbox number = degree + 1)
            const fretboardWrapper = document.getElementById(`pentatonic-fretboard-${degree + 1}`);
            if (!fretboardWrapper) continue;
            const fretboard = fretboardWrapper.querySelector('.position-fretboard');
            if (!fretboard) continue;
            
            // Update the label with pentatonic name (matching ionian/aeolian format)
            const labelElement = fretboardWrapper.querySelector('.position-label');
            if (labelElement) {
                const degreeLabel = this.getDegreeLabel(degree);
                const pentatonicName = this.getPentatonicName(rootNote, useMajorPentatonic);
                labelElement.textContent = `${degreeLabel} - ${pentatonicName}`;
            }
            
            // Clear existing notes
            fretboard.querySelectorAll('.note').forEach(note => note.remove());
            
            // Show all frets for full fretboard
            this.updateFretboardVisibility(0, FRETS, fretboard);
            
            // Render pentatonic scale notes
            GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
                for (let fret = 0; fret <= FRETS; fret++) {
                    const note = this.getNoteAtPosition(stringIndex, fret);
                    
                    if (pentatonicNotes.includes(note)) {
                        const fretDiv = fretboard.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fret}"]`);
                        if (fretDiv) {
                            const noteDiv = document.createElement('div');
                            const interval = this.getIntervalFromRoot(note, rootNote);
                            const intervalClass = this.getIntervalClass(interval);
                            
                            if (this.currentDisplay === 'notes') {
                                const noteColor = this.getNoteColor(note);
                                noteDiv.className = 'note scale';
                                noteDiv.style.background = noteColor;
                                noteDiv.style.borderColor = this.darkenColor(noteColor);
                                noteDiv.textContent = note;
                            } else {
                                // Use interval name with flat/sharp designations
                                noteDiv.className = `note scale interval-${intervalClass}`;
                                const intervalName = INTERVAL_NAMES[interval];
                                noteDiv.textContent = intervalName;
                            }
                            
                            if (note === rootNote) {
                                noteDiv.classList.add('root');
                            }
                            
                            fretDiv.appendChild(noteDiv);
                        }
                    }
                }
            });
        }
    }

    displayChordFretboards(key, scaleIntervals) {
        const keyIndex = NOTES.indexOf(key);
        const numDegrees = scaleIntervals.length;
        
        // Display chords for each scale degree
        // Use position-fretboard containers to match position mode formatting
        for (let degree = 0; degree < numDegrees; degree++) {
            const rootInterval = scaleIntervals[degree];
            const rootNote = NOTES[(keyIndex + rootInterval) % 12];
            const chordQuality = this.getChordQuality(scaleIntervals, degree);
            
            // Get chord intervals
            const chordIntervals = CHORD_INTERVALS[chordQuality] || CHORD_INTERVALS.major;
            const chordNotes = chordIntervals.map(interval => {
                const noteIndex = (NOTES.indexOf(rootNote) + interval) % 12;
                return NOTES[noteIndex];
            });
            
            // Find the fretboard container for this chord (use position-fretboard for consistency)
            const fretboardWrapper = document.getElementById(`position-fretboard-${degree + 1}`);
            if (!fretboardWrapper) continue;
            const fretboard = fretboardWrapper.querySelector('.position-fretboard');
            if (!fretboard) continue;
            
            // Update the label with chord name
            const labelElement = fretboardWrapper.querySelector('.position-label');
            if (labelElement) {
                const degreeLabel = this.getDegreeLabel(degree);
                const chordName = this.getChordName(rootNote, chordQuality);
                labelElement.textContent = `${degreeLabel} - ${chordName}`;
            }
            
            // Clear existing notes
            fretboard.querySelectorAll('.note').forEach(note => note.remove());
            
            // Apply the same visibility settings as the main fretboard (show all frets for full mode)
            this.updateFretboardVisibility(0, FRETS, fretboard);
            
            // Render this chord on the fretboard
            GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
                for (let fret = 0; fret <= FRETS; fret++) {
                    const note = this.getNoteAtPosition(stringIndex, fret);
                    
                    if (chordNotes.includes(note)) {
                        const fretDiv = fretboard.querySelector(`.fret[data-string="${stringIndex}"][data-fret="${fret}"]`);
                        if (fretDiv) {
                            const noteDiv = document.createElement('div');
                            const interval = this.getIntervalFromRoot(note, rootNote);
                            const intervalClass = this.getIntervalClass(interval);
                            
                            if (this.currentDisplay === 'notes') {
                                const noteColor = this.getNoteColor(note);
                                noteDiv.className = 'note chord';
                                noteDiv.style.background = noteColor;
                                noteDiv.style.borderColor = this.darkenColor(noteColor);
                                noteDiv.textContent = note;
                            } else {
                                noteDiv.className = `note chord interval-${intervalClass}`;
                                const intervalName = INTERVAL_NAMES[interval];
                                noteDiv.textContent = intervalName;
                            }
                            
                            if (note === rootNote) {
                                noteDiv.classList.add('root');
                            }
                            
                            fretDiv.appendChild(noteDiv);
                        }
                    }
                }
            });
        }
    }

    updateChordFretboards(numDegrees = 7) {
        // Show/hide chord fretboards based on checkbox state
        // Also hide checkboxes and fretboards that aren't needed for this scale
        for (let i = 1; i <= 7; i++) {
            const checkbox = document.getElementById(`chord-checkbox-${i}`);
            const fretboardWrapper = document.getElementById(`chord-fretboard-${i}`);
            if (checkbox && fretboardWrapper) {
                if (i <= numDegrees) {
                    // Show checkbox and fretboard (if checked)
                    checkbox.parentElement.style.display = 'flex';
                fretboardWrapper.style.display = checkbox.checked ? 'flex' : 'none';
                } else {
                    // Hide checkbox and fretboard for scales with fewer degrees
                    checkbox.parentElement.style.display = 'none';
                    fretboardWrapper.style.display = 'none';
                }
            }
        }
    }

    displayChord() {
        // Hide scale options when in chord mode
        const scaleOptionsContainer = document.getElementById('scale-options-checkboxes');
        const pentatonicOptionsContainer = document.getElementById('pentatonic-options-checkboxes');
        if (scaleOptionsContainer) {
            scaleOptionsContainer.style.display = 'none';
        }
        if (pentatonicOptionsContainer) {
            pentatonicOptionsContainer.style.display = 'none';
        }
        const positionFretboardsContainer = document.getElementById('position-fretboards');
        if (positionFretboardsContainer) {
            positionFretboardsContainer.style.display = 'none';
        }
        const pentatonicFretboardsContainer = document.getElementById('pentatonic-fretboards');
        if (pentatonicFretboardsContainer) {
            pentatonicFretboardsContainer.style.display = 'none';
        }
        
        const chordNote = document.getElementById('chord-note').value;
        const variation = document.getElementById('chord-variation').value;
        const intervals = CHORD_INTERVALS[variation];

        // Get chord notes
        const chordNoteIndex = NOTES.indexOf(chordNote);
        const chordNotes = intervals.map(interval => {
            const noteIndex = (chordNoteIndex + interval) % 12;
            return NOTES[noteIndex];
        });

        // Mark chord notes on fretboard
        GUITAR_STRINGS.forEach((stringNote, stringIndex) => {
            for (let fret = 0; fret <= FRETS; fret++) {
                const note = this.getNoteAtPosition(stringIndex, fret);
                
                if (chordNotes.includes(note)) {
                    const fretDiv = document.querySelector(`#fretboard .fret[data-string="${stringIndex}"][data-fret="${fret}"]`);
                    if (fretDiv) {
                        const noteDiv = document.createElement('div');
                        const interval = this.getIntervalFromRoot(note, chordNote);
                        const intervalClass = this.getIntervalClass(interval);
                        
                        if (this.currentDisplay === 'notes') {
                            // Use note color when displaying notes
                            const noteColor = this.getNoteColor(note);
                            noteDiv.className = 'note chord';
                            noteDiv.style.background = noteColor;
                            noteDiv.style.borderColor = this.darkenColor(noteColor);
                            noteDiv.textContent = note;
                        } else {
                            // Use interval color when displaying intervals
                            noteDiv.className = `note chord interval-${intervalClass}`;
                            const intervalName = INTERVAL_NAMES[interval];
                            noteDiv.textContent = intervalName;
                        }
                        
                        if (note === chordNote) {
                            noteDiv.classList.add('root');
                        }

                        fretDiv.appendChild(noteDiv);
                    }
                }
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GuitarApp();
});

