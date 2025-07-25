import { useEffect, useRef } from 'react';
import useCrashGameStore from '@/stores/CrashGameStore';
import useAuthStore from '@/stores/AuthStore';
import { CrashGamePhase } from '@/types/crash';
import { getHasActiveBet, getCurrentUserBet } from '@/stores/CrashGameStore';
import { CONFIG } from "./chartConfig"

declare global {
  interface Window { PIXI: any; }
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
  private elapsedTime: number = 0;
  private currentMultiplier: number = 1.0;
  private isRunning: boolean = false;
  private crashed: boolean = false;
  private targetMaxTime: number = CONFIG.scaling.initialMaxTime;
  private targetMaxMultiplier: number = CONFIG.scaling.initialMaxMultiplier;
  private displayMaxTime: number = CONFIG.scaling.initialMaxTime;
  private displayMaxMultiplier: number = CONFIG.scaling.initialMaxMultiplier;
  private hasActiveBet: boolean = false;

  constructor(private containerId: string) { }

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.PIXI) {
      console.warn('PIXI is not available');
      return;
    }
    
    try {
      this.app = new window.PIXI.Application();
      await this.app.init({ 
        width: CONFIG.width, 
        height: CONFIG.height, 
        backgroundColor: CONFIG.backgroundColor, 
        antialias: true 
      });
      
      const container = document.getElementById(this.containerId);
      if (container) {
        container.innerHTML = '';
        container.appendChild(this.app.canvas);
        this._setupStage();
      }
    } catch (error) {
      console.error('Failed to initialize PIXI app:', error);
      this.app = null;
    }
  }

  private _setupStage(): void {
    if (!this.app) {
      console.warn('Cannot setup stage: PIXI app not initialized');
      return;
    }

    this.stage = new window.PIXI.Container();
    this.app.stage.addChild(this.stage);

    this.axisGraphics = new window.PIXI.Graphics();
    this.graphLine = new window.PIXI.Graphics();
    this.xAxisLabels = new window.PIXI.Container();
    this.yAxisLabels = new window.PIXI.Container();

    this.multiplierText = new window.PIXI.Text({ style: CONFIG.multiplierFontStyle });
    this.multiplierText.anchor.set(0.5);
    this.multiplierText.position.set(CONFIG.width / 2, CONFIG.height / 2);

    this.crashedText = new window.PIXI.Text({ text: 'CRASHED', style: CONFIG.crashedFontStyle });
    this.crashedText.anchor.set(0.5);
    this.crashedText.position.set(CONFIG.width / 2, CONFIG.height / 2 - 60);

    this.crashMultiplierText = new window.PIXI.Text({ style: CONFIG.crashedFontStyle });
    this.crashMultiplierText.anchor.set(0.5);
    this.crashMultiplierText.position.set(CONFIG.width / 2, CONFIG.height / 2 + 40);

    this.waitText = new window.PIXI.Text({ style: CONFIG.waitFontStyle });
    this.waitText.anchor.set(0.5);
    this.waitText.position.set(CONFIG.width / 2, CONFIG.height / 2);

    this.stage.addChild(this.axisGraphics, this.graphLine, this.xAxisLabels, this.yAxisLabels, this.multiplierText, this.crashedText, this.crashMultiplierText, this.waitText);
    this._updateAxes();
    this._resetState();
  }

  private _resetState(): void {
    this.elapsedTime = 0;
    this.currentMultiplier = 1.0;
    this.isRunning = false;
    this.crashed = false;
    this.hasActiveBet = false;
    this.targetMaxTime = CONFIG.scaling.initialMaxTime;
    this.targetMaxMultiplier = CONFIG.scaling.initialMaxMultiplier;
    this.displayMaxTime = this.targetMaxTime;
    this.displayMaxMultiplier = this.targetMaxMultiplier;

    // Natychmiastowe wyczyszczenie wszystkich elementów wizualnych
    if (this.graphLine) {
      this.graphLine.clear();
      this.graphLine.visible = false;
    }
    if (this.xAxisLabels) this.xAxisLabels.removeChildren();
    if (this.yAxisLabels) this.yAxisLabels.removeChildren();
    if (this.multiplierText) {
      this.multiplierText.text = '1.00x';
      this.multiplierText.style.fill = CONFIG.multiplierFontStyle.fill;
      this.multiplierText.visible = false;
    }
    if (this.crashedText) this.crashedText.visible = false;
    if (this.crashMultiplierText) this.crashMultiplierText.visible = false;
    if (this.waitText) this.waitText.visible = false;

    this._updateAxes();
  }

  startAnimation(hasActiveBet: boolean = false): void {
    if (this.isRunning) return;
    
    // Najpierw kompletnie resetujemy stan
    this._resetState();
    
    // Następnie ustawiamy parametry gry
    this.isRunning = true;
    this.crashed = false;
    this.hasActiveBet = hasActiveBet;
    
    // Pokazujemy elementy potrzebne do gry
    if (this.graphLine) this.graphLine.visible = true;
    if (this.multiplierText) {
      this.multiplierText.visible = true;
      this.multiplierText.style.fill = hasActiveBet ? CONFIG.multiplierFontStyleActive.fill : CONFIG.multiplierFontStyle.fill;
    }
    
    // Ukrywamy tekst oczekiwania
    if (this.waitText) this.waitText.visible = false;
  }

  update(elapsedTime: number, currentMultiplier: number, hasActiveBet: boolean = false): void {
    if (!this.isRunning || this.crashed) return;
    this.elapsedTime = elapsedTime;
    this.currentMultiplier = currentMultiplier;
    this.hasActiveBet = hasActiveBet;
    this._adjustScaleTargets();
    this._drawGraph();
    this._updateAxes();
    this._updateMultiplierText();
  }

  showCrashed(finalMultiplier: number): void {
    this.isRunning = false;
    this.crashed = true;
    
    // Ukrywamy elementy gry
    if (this.multiplierText) this.multiplierText.visible = false;
    if (this.graphLine) {
      this.graphLine.clear();
      this.graphLine.visible = false;
    }
    
    // Pokazujemy elementy crash
    if (this.crashedText) this.crashedText.visible = true;
    if (this.crashMultiplierText) {
      this.crashMultiplierText.text = `@${finalMultiplier.toFixed(2)}x`;
      this.crashMultiplierText.visible = true;
    }
  }

  showWaiting(timeRemaining: string): void {
    // Kompletnie resetujemy stan przed pokazaniem oczekiwania
    this._resetState();
    
    if (this.waitText) {
      this.waitText.text = `Next round in ${timeRemaining}`;
      this.waitText.visible = true;
    }
  }

  private _adjustScaleTargets(): void {
    if (this.elapsedTime > this.targetMaxTime * CONFIG.scaling.scaleTrigger) {
      this.targetMaxTime *= CONFIG.scaling.scaleFactor;
    }
    if (this.currentMultiplier > this.targetMaxMultiplier * CONFIG.scaling.scaleTrigger) {
      this.targetMaxMultiplier *= CONFIG.scaling.scaleFactor;
    }
    const factor = CONFIG.scaling.smoothingFactor * (1 / 60);
    this.displayMaxTime += (this.targetMaxTime - this.displayMaxTime) * factor;
    this.displayMaxMultiplier += (this.targetMaxMultiplier - this.displayMaxMultiplier) * factor;
  }

  private _drawGraph(): void {
    if (!this.graphLine) return;
    const lineColor = this.hasActiveBet ? CONFIG.lineColorActive : CONFIG.lineColor;
    this.graphLine.clear().stroke({ width: 4, color: lineColor });
    const segments = Math.max(10, Math.min(100, this.elapsedTime * 10));
    const maxT = Math.min(this.elapsedTime, this.displayMaxTime);
    if (maxT <= 0) return;
    this.graphLine.moveTo(this._mapTimeToX(0), this._mapMultiplierToY(1));
    for (let i = 1; i <= segments; i++) {
      const t = (maxT / segments) * i;
      let m = this._calculateMultiplier(t);
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
    this.axisGraphics.moveTo(CONFIG.padding, CONFIG.height - CONFIG.padding).lineTo(CONFIG.width, CONFIG.height - CONFIG.padding);
    this.axisGraphics.moveTo(CONFIG.padding, 0).lineTo(CONFIG.padding, CONFIG.height - CONFIG.padding);
    const yTicks = this._getNiceTicks(1, this.displayMaxMultiplier, 5);
    yTicks.forEach(tickValue => {
      const y = this._mapMultiplierToY(tickValue);
      this.axisGraphics.moveTo(CONFIG.padding - 5, y).lineTo(CONFIG.padding + 5, y);
      const label = new window.PIXI.Text({ text: `${tickValue.toFixed(1)}x`, style: CONFIG.fontStyle });
      label.anchor.set(1, 0.5);
      label.position.set(CONFIG.padding - 10, y);
      this.yAxisLabels.addChild(label);
    });
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
      this.multiplierText.style.fill = this.hasActiveBet ? CONFIG.multiplierFontStyleActive.fill : CONFIG.multiplierFontStyle.fill;
    }
  }

  private _mapTimeToX = (time: number): number => CONFIG.padding + (time / this.displayMaxTime) * (CONFIG.width - CONFIG.padding);
  private _mapMultiplierToY = (multiplier: number): number => (CONFIG.height - CONFIG.padding) - ((multiplier - 1) / (this.displayMaxMultiplier - 1)) * (CONFIG.height - CONFIG.padding);

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
    
    // Check if app exists and has a destroy method before calling it
    if (this.app && typeof this.app.destroy === 'function') {
      try {
        this.app.destroy(true, { 
          children: true, 
          texture: true, 
          baseTexture: true 
        });
      } catch (error) {
        console.warn('Error destroying PIXI app:', error);
      }
    }
    
    // Clean up all references
    this.app = null;
    this.stage = null;
    this.axisGraphics = null;
    this.graphLine = null;
    this.xAxisLabels = null;
    this.yAxisLabels = null;
    this.multiplierText = null;
    this.crashedText = null;
    this.crashMultiplierText = null;
    this.waitText = null;
  }
}

const Wykres = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const crashGraphRef = useRef<CrashGraphReact | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const { phase, multiplier, xChart, timeRemaining } = useCrashGameStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const loadPixiScript = (): Promise<void> => new Promise((resolve) => {
      if (window.PIXI) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/8.0.0/pixi.min.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    const initGraph = async () => {
      await loadPixiScript();
      if (loadingRef.current) loadingRef.current.style.display = 'none';
      if (canvasRef.current && !crashGraphRef.current) {
        const graph = new CrashGraphReact('crash-canvas');
        await graph.init();
        crashGraphRef.current = graph;
        updateGraphVisuals(useCrashGameStore.getState());
      }
    };

    const updateGraphVisuals = (currentState: { phase: CrashGamePhase, multiplier: number, timeRemaining: number }) => {
      if (!crashGraphRef.current) return;
      
      const userId = useAuthStore.getState().user?.id;
      const hasActiveBet = getHasActiveBet(currentState, userId);
      
      switch (currentState.phase) {
        case CrashGamePhase.Running:
          crashGraphRef.current.startAnimation(hasActiveBet);
          break;
        case CrashGamePhase.Crashed:
          crashGraphRef.current.showCrashed(currentState.multiplier);
          break;
        case CrashGamePhase.Betting:
        default:
          const timeStr = Math.max(0, currentState.timeRemaining).toFixed(1) + 's';
          crashGraphRef.current.showWaiting(timeStr);
          break;
      }
    };

    initGraph();

    return () => {
      if (crashGraphRef.current) {
        crashGraphRef.current.destroy();
        crashGraphRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!crashGraphRef.current) return;
    
    const state = useCrashGameStore.getState();
    const currentBet = getCurrentUserBet(state, user?.id);
    const hasActiveBet = getHasActiveBet(state, user?.id);
    
    const hasWithdrawn = currentBet?.inGame?.withdrew || false;
    
    switch (phase) {
      case CrashGamePhase.Running:
        crashGraphRef.current.startAnimation(hasActiveBet && !hasWithdrawn);
        break;
      case CrashGamePhase.Crashed:
        crashGraphRef.current.showCrashed(multiplier);
        break;
      case CrashGamePhase.Betting:
        const timeStr = Math.max(0, timeRemaining).toFixed(1) + 's';
        crashGraphRef.current.showWaiting(timeStr);
        break;
    }
  }, [phase, user?.id]);

  useEffect(() => {
    if (!crashGraphRef.current) return;
    const state = useCrashGameStore.getState();
    const currentBet = getCurrentUserBet(state, user?.id);
    const hasActiveBet = getHasActiveBet(state, user?.id);
  
    const hasWithdrawn = currentBet?.inGame?.withdrew || false;
    
    if (phase === CrashGamePhase.Running) {
      crashGraphRef.current.update(xChart, multiplier, hasActiveBet && !hasWithdrawn);
    } else if (phase === CrashGamePhase.Betting) {
      const timeStr = Math.max(0, timeRemaining).toFixed(1) + 's';
      crashGraphRef.current.showWaiting(timeStr);
    }
  }, [multiplier, xChart, timeRemaining, user?.id]);

  return (
    <div
      className="float-left w-3/5 "
      style={{ backgroundColor: 'rgb(24, 26, 30)', borderColor: 'rgb(41, 36, 36)' }}
    >
      <div id="crash-canvas" ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div ref={loadingRef} className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
        
      </div>
    </div>
  );
};

export default Wykres;