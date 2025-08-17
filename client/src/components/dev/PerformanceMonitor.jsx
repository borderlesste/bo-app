import { useState, useEffect, memo } from 'react';
import { Monitor, X, BarChart3, Zap, Clock, TrendingUp } from 'lucide-react';

const PerformanceMonitor = memo(function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    loadTime: 0
  });

  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(performance.now());

  // Track renders
  useEffect(() => {
    const renderTime = performance.now() - lastRenderTime;
    setRenderCount(prev => prev + 1);
    setMetrics(prev => ({
      ...prev,
      renderCount: renderCount + 1,
      renderTime: renderTime
    }));
    setLastRenderTime(performance.now());
  }, [lastRenderTime, renderCount]);

  // Monitor performance metrics
  useEffect(() => {
    const updateMetrics = () => {
      // Memory usage (if available)
      const memory = performance.memory;
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024)
        }));
      }

      // Load time
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        setMetrics(prev => ({
          ...prev,
          loadTime: Math.round(loadTime)
        }));
      }
    };

    // FPS monitoring
    let frames = 0;
    let lastTime = performance.now();
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frames * 1000) / (currentTime - lastTime))
        }));
        frames = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(measureFPS);
    };

    updateMetrics();
    measureFPS();

    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  // Get performance entries
  const getPerformanceEntries = () => {
    const entries = performance.getEntriesByType('navigation')[0];
    if (!entries) return {};

    return {
      domContentLoaded: Math.round(entries.domContentLoadedEventEnd - entries.navigationStart),
      loadComplete: Math.round(entries.loadEventEnd - entries.navigationStart),
      firstPaint: Math.round(entries.responseEnd - entries.requestStart),
      domInteractive: Math.round(entries.domInteractive - entries.navigationStart)
    };
  };

  const performanceEntries = getPerformanceEntries();

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Performance Monitor"
        >
          <Monitor className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            Performance Monitor
          </h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Render Metrics */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Renders</span>
          </div>
          <span className="font-mono text-gray-900 dark:text-white">
            {metrics.renderCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Last Render</span>
          </div>
          <span className="font-mono text-gray-900 dark:text-white">
            {metrics.renderTime.toFixed(2)}ms
          </span>
        </div>

        {/* FPS */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span className="text-gray-600 dark:text-gray-400">FPS</span>
          </div>
          <span className={`font-mono ${metrics.fps >= 30 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.fps}
          </span>
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Memory</span>
            </div>
            <span className="font-mono text-gray-900 dark:text-white">
              {metrics.memoryUsage}MB
            </span>
          </div>
        )}

        {/* Load Times */}
        {performanceEntries.domContentLoaded && (
          <>
            <hr className="border-gray-200 dark:border-slate-600" />
            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
              Load Times
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">DOM Ready</span>
              <span className="font-mono">{performanceEntries.domContentLoaded}ms</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Load Complete</span>
              <span className="font-mono">{performanceEntries.loadComplete}ms</span>
            </div>
          </>
        )}

        {/* Actions */}
        <hr className="border-gray-200 dark:border-slate-600" />
        <div className="flex gap-2">
          <button
            onClick={() => {
              setRenderCount(0);
              setMetrics(prev => ({ ...prev, renderCount: 0 }));
            }}
            className="text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-2 py-1 rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => {
              console.table({
                'Render Count': metrics.renderCount,
                'Last Render Time': `${metrics.renderTime.toFixed(2)}ms`,
                'FPS': metrics.fps,
                'Memory Usage': `${metrics.memoryUsage}MB`,
                ...performanceEntries
              });
            }}
            className="text-xs bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded transition-colors"
          >
            Log Details
          </button>
        </div>
      </div>
    </div>
  );
});

export default PerformanceMonitor;