export const CONFIG = {
    width: 550,
    height: 380,
    padding: 40,
    backgroundColor: "#181a1e",
    lineColor: 0x808080,
    axisColor: 0x808080,
    fontStyle: {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xaaaaaa,
    },
    multiplierFontStyle: {
        fontFamily: 'Arial',
        fontSize: 120,
        fill: 0x808080,
        align: 'center',
    },
    crashedFontStyle: {
        fontFamily: 'Arial',
        fontSize: 75,
        fill: 0xff0000,
        align: 'center',
    },
    waitFontStyle: {
        fontFamily: 'Arial',
        fontSize: 30,
        fill: 0x888888,
        align: 'center',
    },
    curve: {
        A: 0.02,  // Affects the "aggressiveness" of growth
        B: 1.5,   // Initial time exponent (affects initial curvature)
        B_GROWTH: 0.01, // How much B increases per second
        MAX_B: 3.0, // Maximum value of B
    },
    scaling: {
        initialMaxTime: 10,   // Initial X axis range (in seconds)
        initialMaxMultiplier: 1.3, // Initial Y axis range
        scaleFactor: 1.5,     // Axis scaling multiplier
        scaleTrigger: 0.8,    // When to scale (e.g. at 80% of range)
        smoothingFactor: 0.2, // Smoothing factor for scale animation
    },
    zigzag: {
        amplitude: 0.001, // Amplitude of line "jitter"
        frequency: 50,    // Frequency of "jitter"
    },
    gameplay: {
        crashTargetMin: 1.5, // Minimum crash multiplier
        crashTargetMax: 3.0, // Maximum crash multiplier
        crashMessageTimeout: 2000, // Crash message display time (ms)
        waitBeforeNextRound: 5, // Wait time before next round (s)
    }
};

