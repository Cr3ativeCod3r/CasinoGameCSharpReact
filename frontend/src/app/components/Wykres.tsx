'use client'
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import crashGameStore from '@/app/stores/CrashGameStore';

// Configuration object
const CONFIG = {
  width: 500,
  height: 400,
  backgroundColor: 0x181a1e,
  padding: 40,
  lineColor: 0x10b981,
  axisColor: 0x4b5563,
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
    waitBeforeNextRound: 3,
    crashMessageTimeout: 2000
  }
};

declare global {
  interface Window {
    PIXI: any;
  }
}

class CrashGraphReact {
  private app: any = null;
  private stage: any = null;
  private axisGraphics: any = null;
  private graphLine: any = null;
  private xAxisLabels: any = null;
  private yAxisLabels: any = null;
  private multiplierText: any = null;
  private crashedText: any = null;
  private crashMultiplierText: any = null;
  private waitText: any = null;
  private animationId: number | null = null;
  private startTime: number | null = null;
  private elapsedTime: number = 0;
  private currentMultiplier: number = 1.0;
  private isRunning: boolean = false;
  private crashed: boolean = false;
  private targetMaxTime: number = CONFIG.scaling.initialMaxTime;
  private targetMaxMultiplier: number = CONFIG.scaling.initialMaxMultiplier;
  private displayMaxTime: number = CONFIG.scaling.initialMaxTime;
  private displayMaxMultiplier: number = CONFIG.scaling.initialMaxMultiplier;
  private lastMultiplier: number = 1.0;

  constructor(private containerId: string) { }

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.PIXI) {
      console.error('PIXI.js not loaded');
      return;
    }

    this.app = new window.PIXI.Application();
    await this.app.init({
      width: CONFIG.width,
      height: CONFIG.height,
      backgroundColor: CONFIG.backgroundColor,
      antialias: true,
    });

    const container = document.getElementById(this.containerId);
    if (container) {
      // Clear any existing canvas
      container.innerHTML = '';
      container.appendChild(this.app.canvas);
      this._setupStage();
    }
  }

  private _setupStage(): void {
    this.stage = new window.PIXI.Container();
    this.app.stage.addChild(this.stage);

    this.axisGraphics = new window.PIXI.Graphics();
    this.graphLine = new window.PIXI.Graphics();
    this.xAxisLabels = new window.PIXI.Container();
    this.yAxisLabels = new window.PIXI.Container();

    this.multiplierText = new window.PIXI.Text({ style: CONFIG.multiplierFontStyle });
    this.multiplierText.anchor.set(0.5);
    this.multiplierText.position.set(CONFIG.width / 2, CONFIG.height / 2);

    this.crashedText = new window.PIXI.Text({ text: 'CRASHED!', style: CONFIG.crashedFontStyle });
    this.crashedText.anchor.set(0.5);
    this.crashedText.position.set(CONFIG.width / 2, CONFIG.height / 2 - 60);

    this.crashMultiplierText = new window.PIXI.Text({ style: CONFIG.crashedFontStyle });
    this.crashMultiplierText.anchor.set(0.5);
    this.crashMultiplierText.position.set(CONFIG.width / 2, CONFIG.height / 2 + 40);

    this.waitText = new window.PIXI.Text({ style: CONFIG.waitFontStyle });
    this.waitText.anchor.set(0.5);
    this.waitText.position.set(CONFIG.width / 2, CONFIG.height / 2);

    this.stage.addChild(
      this.axisGraphics,
      this.graphLine,
      this.xAxisLabels,
      this.yAxisLabels,
      this.multiplierText,
      this.crashedText,
      this.crashMultiplierText,
      this.waitText
    );
    this._updateAxes();
    this._resetState();
  }

  private _resetState(): void {
    this.startTime = null;
    this.elapsedTime = 0;
    this.currentMultiplier = 1.0;
    this.isRunning = false;
    this.crashed = false;
    this.lastMultiplier = 1.0;

    this.targetMaxTime = CONFIG.scaling.initialMaxTime;
    this.targetMaxMultiplier = CONFIG.scaling.initialMaxMultiplier;
    this.displayMaxTime = this.targetMaxTime;
    this.displayMaxMultiplier = this.targetMaxMultiplier;

    if (this.graphLine) {
      this.graphLine.clear();
    }

    if (this.xAxisLabels) {
      this.xAxisLabels.removeChildren();
    }
    if (this.yAxisLabels) {
      this.yAxisLabels.removeChildren();
    }

    if (this.multiplierText) {
      this.multiplierText.text = '1.00x';
      this.multiplierText.style.fill = CONFIG.multiplierFontStyle.fill;
      this.multiplierText.visible = false;
    }

    if (this.graphLine) this.graphLine.visible = false;
    if (this.crashedText) this.crashedText.visible = false;
    if (this.crashMultiplierText) this.crashMultiplierText.visible = false;
    if (this.waitText) this.waitText.visible = false;

    this._updateAxes();
  }

  startAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this._resetState();
    this.isRunning = true;
    this.startTime = performance.now();

    if (this.graphLine) this.graphLine.visible = true;
    if (this.multiplierText) this.multiplierText.visible = true;
    this.crashed = false;

    this._animate();
  }

  stopAnimation(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  showCrashed(): void {
    this.crashed = true;
    this.isRunning = false;

    if (this.multiplierText) this.multiplierText.visible = false;
    if (this.crashedText) this.crashedText.visible = true;
    if (this.crashMultiplierText) {
      this.crashMultiplierText.text = `@${this.lastMultiplier.toFixed(2)}x`;
      this.crashMultiplierText.visible = true;
    }
  }

  showWaiting(timeRemaining: string): void {
    this._resetState();
    if (this.waitText) {
      this.waitText.text = `Next round in ${timeRemaining}`;
      this.waitText.visible = true;
    }
  }

  updateFromStore(): void {
    if (!this.isRunning) return;

    // Use real-time data from store
    this.currentMultiplier = crashGameStore.multiplier;
    this.elapsedTime = crashGameStore.xChart;
    this.lastMultiplier = this.currentMultiplier;

    this._adjustScaleTargets();
    this._drawGraph();
    this._updateAxes();
    this._updateMultiplierText();
  }

  private _animate(): void {
    if (!this.isRunning || this.crashed) return;

    this.updateFromStore();
    this.animationId = requestAnimationFrame(() => this._animate());
  }

  private _adjustScaleTargets(): void {
    if (this.elapsedTime > this.targetMaxTime * CONFIG.scaling.scaleTrigger) {
      this.targetMaxTime *= CONFIG.scaling.scaleFactor;
    }
    if (this.currentMultiplier > this.targetMaxMultiplier * CONFIG.scaling.scaleTrigger) {
      this.targetMaxMultiplier *= CONFIG.scaling.scaleFactor;
    }

    // Smooth scaling
    const factor = CONFIG.scaling.smoothingFactor * (1 / 60); // Assuming 60fps
    this.displayMaxTime += (this.targetMaxTime - this.displayMaxTime) * factor;
    this.displayMaxMultiplier += (this.targetMaxMultiplier - this.displayMaxMultiplier) * factor;
  }

  private _drawGraph(): void {
    if (!this.graphLine) return;

    this.graphLine.clear().stroke({ width: 4, color: CONFIG.lineColor });

    const segments = Math.max(10, Math.min(100, this.elapsedTime * 10));
    const maxT = Math.min(this.elapsedTime, this.displayMaxTime);

    if (maxT <= 0) return;

    this.graphLine.moveTo(this._mapTimeToX(0), this._mapMultiplierToY(1));

    for (let i = 1; i <= segments; i++) {
      const t = (maxT / segments) * i;
      let m = this._calculateMultiplier(t);

      // Add some visual noise for realism
      m += Math.sin(t * CONFIG.zigzag.frequency) * CONFIG.zigzag.amplitude;

      this.graphLine.lineTo(this._mapTimeToX(t), this._mapMultiplierToY(m));
    }
  }

  private _calculateMultiplier(time: number): number {
    if (time <= 0) return 1.0;
    const dynamicB = Math.min(CONFIG.curve.MAX_B, CONFIG.curve.B + CONFIG.curve.B_GROWTH * time);
    return 1 + CONFIG.curve.A * Math.pow(time, dynamicB);
  }

  private _updateAxes(): void {
    if (!this.axisGraphics || !this.xAxisLabels || !this.yAxisLabels) return;

    this.axisGraphics.clear().stroke({ width: 2, color: CONFIG.axisColor });
    this.xAxisLabels.removeChildren();
    this.yAxisLabels.removeChildren();

    // Draw axes
    this.axisGraphics.moveTo(CONFIG.padding, CONFIG.height - CONFIG.padding)
      .lineTo(CONFIG.width, CONFIG.height - CONFIG.padding);
    this.axisGraphics.moveTo(CONFIG.padding, 0)
      .lineTo(CONFIG.padding, CONFIG.height - CONFIG.padding);

    // Y-axis labels (multiplier)
    const yTicks = this._getNiceTicks(1, this.displayMaxMultiplier, 5);
    yTicks.forEach(tickValue => {
      const y = this._mapMultiplierToY(tickValue);
      this.axisGraphics.moveTo(CONFIG.padding - 5, y).lineTo(CONFIG.padding + 5, y);
      const label = new window.PIXI.Text({ text: `${tickValue.toFixed(1)}x`, style: CONFIG.fontStyle });
      label.anchor.set(1, 0.5);
      label.position.set(CONFIG.padding - 10, y);
      this.yAxisLabels.addChild(label);
    });

    // X-axis labels (time)
    const xTicks = this._getNiceTicks(0, this.displayMaxTime, 8);
    xTicks.forEach(tickValue => {
      if (tickValue === 0) return;
      const x = this._mapTimeToX(tickValue);
      this.axisGraphics.moveTo(x, CONFIG.height - CONFIG.padding - 5).lineTo(x, CONFIG.height - CONFIG.padding + 5);
      const label = new window.PIXI.Text({ text: `${Math.round(tickValue)}s`, style: CONFIG.fontStyle });
      label.anchor.set(0.5, 0);
      label.position.set(x, CONFIG.height - CONFIG.padding + 10);
      this.xAxisLabels.addChild(label);
    });
  }

  private _updateMultiplierText(): void {
    if (this.multiplierText) {
      this.multiplierText.text = `${this.currentMultiplier.toFixed(2)}x`;
    }
  }

  private _mapTimeToX(time: number): number {
    const graphWidth = CONFIG.width - CONFIG.padding;
    return CONFIG.padding + (time / this.displayMaxTime) * graphWidth;
  }

  private _mapMultiplierToY(multiplier: number): number {
    const graphHeight = CONFIG.height - CONFIG.padding;
    return (CONFIG.height - CONFIG.padding) - ((multiplier - 1) / (this.displayMaxMultiplier - 1)) * graphHeight;
  }

  private _getNiceTicks(min: number, max: number, count: number): number[] {
    if (max <= min) return [min];
    const range = max - min;
    const roughStep = range / (count - 1);
    const goodSteps = [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 5, 7.5, 10, 15, 20, 25, 50, 100];
    const stepPower = Math.pow(10, -Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep * stepPower;
    const goodNormalizedStep = goodSteps.find(s => s >= normalizedStep) || roughStep;
    const step = goodNormalizedStep / stepPower;
    const start = Math.floor(min / step) * step;
    const ticks: number[] = [];
    for (let i = start; i <= max * 1.05; i += step) {
      if (i >= min) {
        ticks.push(Number(i.toPrecision(10)));
      }
    }
    return ticks;
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }
  }
}

const Wykres = observer(() => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const crashGraphRef = useRef<CrashGraphReact | null>(null);
  const pixiLoadedRef = useRef(false);

  useEffect(() => {
    const loadPixi = async () => {
      if (typeof window !== 'undefined' && !window.PIXI && !pixiLoadedRef.current) {
        pixiLoadedRef.current = true;
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/8.0.0/pixi.min.js';
        script.onload = () => {
          setTimeout(initializeGraph, 100); // Small delay to ensure PIXI is fully loaded
        };
        document.head.appendChild(script);
      } else if (window.PIXI) {
        initializeGraph();
      }
    };

    const initializeGraph = async () => {
      if (canvasRef.current && window.PIXI && !crashGraphRef.current) {
        crashGraphRef.current = new CrashGraphReact('crash-canvas');
        await crashGraphRef.current.init();

        // Initialize based on current game state
        updateGraphState();
      }
    };

    const updateGraphState = () => {
      if (!crashGraphRef.current) return;

      if (crashGameStore.gameActive) {
        crashGraphRef.current.startAnimation();
      } else if (crashGameStore.bettingOpen) {
        crashGraphRef.current.showWaiting(crashGameStore.formattedTimeRemaining);
      } else {
        crashGraphRef.current.showCrashed();
      }
    };

    loadPixi();

    return () => {
      if (crashGraphRef.current) {
        crashGraphRef.current.destroy();
        crashGraphRef.current = null;
      }
    };
  }, []);

  // Update animation based on game state changes
  useEffect(() => {
    if (!crashGraphRef.current) return;

    if (crashGameStore.gameActive) {
      crashGraphRef.current.startAnimation();
    } else if (crashGameStore.bettingOpen) {
      crashGraphRef.current.showWaiting(crashGameStore.formattedTimeRemaining);
    } else {
      crashGraphRef.current.showCrashed();
    }
  }, [crashGameStore.gameActive, crashGameStore.bettingOpen]);

  // Update graph during active game
  useEffect(() => {
    if (crashGraphRef.current && crashGameStore.gameActive) {
      crashGraphRef.current.updateFromStore();
    }
  }, [crashGameStore.multiplier, crashGameStore.xChart, crashGameStore.yChart]);

  return (
    <div
      className="float-left h-110 w-3/5 border flex items-center justify-center relative"
      style={{
        backgroundColor: 'rgb(24, 26, 30)',
        borderColor: 'rgb(41, 36, 36)'
      }}
    >
      <div
        id="crash-canvas"
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Fallback content while PIXI loads */}
      {!window.PIXI && (
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          <div className="text-white text-2xl font-bold">
            Loading Chart...
          </div>
        </div>
      )}
    </div>
  );
});

export default Wykres;