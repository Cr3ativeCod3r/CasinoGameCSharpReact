'use client'
import { useEffect, useRef, useState } from 'react';
import useCrashGameStore, { getFormattedTimeRemaining } from '@/app/stores/CrashGameStore';

// Konfiguracja pozostaje bez zmian
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
    A:0.7,
    B: 1.5,
    B_GROWTH: 0.01,
    MAX_B: 3.0,
  },
  scaling: {
    initialMaxTime: 10,
    initialMaxMultiplier: 1.3,
    scaleFactor: 1.5,
    scaleTrigger: 0.8,
    smoothingFactor: 0.1, // Zmniejszono dla płynniejszej animacji sterowanej z React
  },
  zigzag: {
    amplitude: 0.001,
    frequency: 50,
  },
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
  
  // ZMIANA: Usunięto zbędne zmienne stanu - teraz wszystko pochodzi ze store
  private elapsedTime: number = 0;
  private currentMultiplier: number = 1.0;
  private isRunning: boolean = false;
  private lastMultiplier: number = 1.0;

  // Zmienne do płynnego skalowania osi
  private targetMaxTime: number = CONFIG.scaling.initialMaxTime;
  private targetMaxMultiplier: number = CONFIG.scaling.initialMaxMultiplier;
  private displayMaxTime: number = CONFIG.scaling.initialMaxTime;
  private displayMaxMultiplier: number = CONFIG.scaling.initialMaxMultiplier;

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
    this.isRunning = false;
    this.elapsedTime = 0;
    this.currentMultiplier = 1.0;
    this.lastMultiplier = 1.0;

    this.targetMaxTime = CONFIG.scaling.initialMaxTime;
    this.targetMaxMultiplier = CONFIG.scaling.initialMaxMultiplier;
    this.displayMaxTime = this.targetMaxTime;
    this.displayMaxMultiplier = this.targetMaxMultiplier;

    if (this.graphLine) this.graphLine.clear();
    if (this.xAxisLabels) this.xAxisLabels.removeChildren();
    if (this.yAxisLabels) this.yAxisLabels.removeChildren();

    if (this.multiplierText) {
      this.multiplierText.text = '1.00x';
      this.multiplierText.visible = false;
    }

    if (this.graphLine) this.graphLine.visible = false;
    if (this.crashedText) this.crashedText.visible = false;
    if (this.crashMultiplierText) this.crashMultiplierText.visible = false;
    if (this.waitText) this.waitText.visible = false;

    this._updateAxes();
  }

  // ZMIANA: Ta metoda tylko przygotowuje scenę do animacji
  startAnimation(): void {
    if (this.isRunning) return; // Zapobiega wielokrotnemu startowi
    this._resetState();
    this.isRunning = true;
    if (this.graphLine) this.graphLine.visible = true;
    if (this.multiplierText) this.multiplierText.visible = true;
  }
  
  // ZMIANA: Ta metoda jest teraz wywoływana z Reacta, aby pokazać stan crasha
  showCrashed(): void {
    this.isRunning = false;
    if (this.multiplierText) this.multiplierText.visible = false;
    if (this.crashedText) this.crashedText.visible = true;
    if (this.crashMultiplierText) {
      // Używamy `lastMultiplier`, który był zapisany podczas ostatniej aktualizacji
      this.crashMultiplierText.text = `@${this.lastMultiplier.toFixed(2)}x`;
      this.crashMultiplierText.visible = true;
    }
  }
  
  // ZMIANA: Ta metoda jest teraz wywoływana z Reacta, aby pokazać odliczanie
  showWaiting(timeRemaining: string): void {
    this._resetState();
    if (this.waitText) {
      this.waitText.text = `Next round in ${timeRemaining}`;
      this.waitText.visible = true;
    }
  }
  
  // NOWOŚĆ: Getter, aby komponent React wiedział, czy animacja już działa
  public getIsRunning(): boolean {
    return this.isRunning;
  }

  // KLUCZOWA ZMIANA: Metoda przyjmuje dane ze store i aktualizuje wykres.
  // To jest teraz nasza "pętla" rysowania, wywoływana przez `useEffect`.
  updateFromStore(data: { multiplier: number, xChart: number }): void {
    if (!this.isRunning) return;

    // Użyj danych ze store
    this.currentMultiplier = data.multiplier;
    this.elapsedTime = data.xChart;
    this.lastMultiplier = this.currentMultiplier; // Zapisz ostatnią wartość dla stanu "crashed"

    this._adjustScaleTargets();
    this._smoothScale();
    this._drawGraph();
    this._updateAxes();
    this._updateMultiplierText();
  }

  private _adjustScaleTargets(): void {
    if (this.elapsedTime > this.targetMaxTime * CONFIG.scaling.scaleTrigger) {
      this.targetMaxTime *= CONFIG.scaling.scaleFactor;
    }
    if (this.currentMultiplier > this.targetMaxMultiplier * CONFIG.scaling.scaleTrigger) {
      this.targetMaxMultiplier *= CONFIG.scaling.scaleFactor;
    }
  }
  
  // NOWOŚĆ: Płynne przejście do nowej skali
  private _smoothScale(): void {
      this.displayMaxTime += (this.targetMaxTime - this.displayMaxTime) * CONFIG.scaling.smoothingFactor;
      this.displayMaxMultiplier += (this.targetMaxMultiplier - this.displayMaxMultiplier) * CONFIG.scaling.smoothingFactor;
  }

  private _drawGraph(): void {
    if (!this.graphLine) return;
    this.graphLine.clear().stroke({ width: 4, color: CONFIG.lineColor });

    // Rysujemy przybliżony kształt krzywej na podstawie aktualnego czasu.
    // Etykieta i tak pokaże dokładny mnożnik ze store'a.
    const segments = 100;
    if (this.elapsedTime <= 0) return;

    this.graphLine.moveTo(this._mapTimeToX(0), this._mapMultiplierToY(1));
    for (let i = 1; i <= segments; i++) {
      const t = (this.elapsedTime / segments) * i;
      let m = this._calculateVisualMultiplier(t);
      m += Math.sin(t * CONFIG.zigzag.frequency) * CONFIG.zigzag.amplitude;
      this.graphLine.lineTo(this._mapTimeToX(t), this._mapMultiplierToY(m));
    }
  }

  // ZMIANA: Ta funkcja jest używana tylko do wizualizacji krzywej.
  // Prawdziwy mnożnik pochodzi ze store'a.
  private _calculateVisualMultiplier(time: number): number {
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
      if (tickValue === 0 && xTicks.length > 1) return;
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
  
  // Pozostałe metody (mapowanie, ticki, destroy) bez większych zmian
  private _mapTimeToX(time: number): number {
    const graphWidth = CONFIG.width - CONFIG.padding;
    return CONFIG.padding + (time / this.displayMaxTime) * graphWidth;
  }

  private _mapMultiplierToY(multiplier: number): number {
    const graphHeight = CONFIG.height - CONFIG.padding;
    // Zapobiegaj dzieleniu przez zero, gdy displayMaxMultiplier jest bliski 1
    const range = this.displayMaxMultiplier - 1;
    if (range <= 0) {
      return CONFIG.height - CONFIG.padding;
    }
    return (CONFIG.height - CONFIG.padding) - ((multiplier - 1) / range) * graphHeight;
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
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }
  }
}

// ZMIANA: Usunięto `observer`
const Wykres = () => {
  const crashGameState = useCrashGameStore();
  const {
    multiplier,
    xChart,
    gameActive,
    bettingOpen,
    timeRemaining, // ZMIANA: Potrzebujemy tej wartości do odliczania
  } = crashGameState;
  
  const crashGraphRef = useRef<CrashGraphReact | null>(null);
  const pixiLoadedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // useEffect do inicjalizacji i czyszczenia PIXI
  useEffect(() => {
    setMounted(true);
    let graphInstance: CrashGraphReact | null = null;
    
    const initializeGraph = async () => {
      // Sprawdzamy czy element jest w DOM i czy PIXI jest załadowane
      const container = document.getElementById('crash-canvas');
      if (container && window.PIXI && !crashGraphRef.current) {
        graphInstance = new CrashGraphReact('crash-canvas');
        crashGraphRef.current = graphInstance;
        await graphInstance.init();
      }
    };

    const loadPixi = () => {
      if (typeof window !== 'undefined' && !window.PIXI && !pixiLoadedRef.current) {
        pixiLoadedRef.current = true;
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/8.1.1/pixi.min.js'; // Użyłem nowszej wersji, ale 8.0.0 też jest OK
        script.async = true;
        script.onload = () => {
          initializeGraph();
        };
        document.head.appendChild(script);
      } else if (window.PIXI) {
        initializeGraph();
      }
    };

    loadPixi();

    return () => {
      if (crashGraphRef.current) {
        crashGraphRef.current.destroy();
        crashGraphRef.current = null;
      }
      // Usuń skrypt PIXI, aby uniknąć problemów z HMR (Hot Module Replacement)
      const pixiScript = document.querySelector('script[src*="pixi.min.js"]');
      if (pixiScript) {
        // pixiScript.remove(); // Opcjonalnie, może powodować problemy przy szybkim odświeżaniu
      }
    };
  }, []);

  // GŁÓWNY useEffect do sterowania stanem wykresu
  useEffect(() => {
    const graph = crashGraphRef.current;
    if (!graph) return;

    if (gameActive) {
      // Jeśli gra jest aktywna, ale nasza animacja nie, uruchom ją
      if (!graph.getIsRunning()) {
        graph.startAnimation();
      }
      // Zawsze aktualizuj wykres najnowszymi danymi
      graph.updateFromStore({ multiplier, xChart });
    } else if (bettingOpen) {
      // Jeśli zakłady są otwarte, pokaż odliczanie
      graph.showWaiting(getFormattedTimeRemaining(crashGameState));
    } else {
      // W przeciwnym razie (gra nieaktywna, zakłady zamknięte) - pokaż stan "crashed"
      graph.showCrashed();
    }
  // Nasłuchuj na wszystkie zmienne, które mogą zmienić stan wykresu
  }, [gameActive, bettingOpen, multiplier, xChart, timeRemaining, crashGameState]);

  return (
    <div
      className="float-left h-110 w-3/5 border flex items-center justify-center relative"
      style={{
        backgroundColor: 'rgb(24, 26, 30)',
        borderColor: 'rgb(41, 36, 36)'
      }}
    >
      {/* Kontener canvas został przeniesiony tutaj, aby ref działał od razu */}
      <div id="crash-canvas" style={{ width: '100%', height: '100%' }} />

      {/* Komunikat ładowania można uprościć */}
      {mounted && !window.PIXI && (
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          <div className="text-white text-2xl font-bold">
            Loading Chart...
          </div>
        </div>
      )}
    </div>
  );
};

export default Wykres;