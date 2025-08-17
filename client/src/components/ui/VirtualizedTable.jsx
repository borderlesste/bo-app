import React, { useState, useEffect, useRef, useMemo, memo } from 'react';

const VirtualizedTable = memo(function VirtualizedTable({
  data = [],
  columns = [],
  rowHeight = 60,
  containerHeight = 400,
  overscan = 5,
  className = '',
  onRowClick = () => {},
  loading = false,
  EmptyComponent = null,
  LoadingComponent = null
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, rowHeight, containerHeight, overscan, data.length]);

  // Calculate total height
  const totalHeight = useMemo(() => data.length * rowHeight, [data.length, rowHeight]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return data.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index
    }));
  }, [data, visibleRange]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Loading state
  if (loading && LoadingComponent) {
    return <LoadingComponent />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    if (EmptyComponent) {
      return <EmptyComponent />;
    }
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Table Header */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
        <div className="flex">
          {columns.map((column, index) => (
            <div
              key={column.key || index}
              className={`
                px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                ${column.width ? `w-${column.width}` : 'flex-1'}
                ${column.className || ''}
              `}
              style={{ width: column.fixedWidth }}
            >
              {column.title}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* Spacer for scroll positioning */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible Rows */}
          <div
            style={{
              transform: `translateY(${visibleRange.startIndex * rowHeight}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map((item, index) => (
              <div
                key={item.id || item.virtualIndex}
                className="flex border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                style={{ height: rowHeight }}
                onClick={() => onRowClick(item, item.virtualIndex)}
              >
                {columns.map((column, colIndex) => (
                  <div
                    key={column.key || colIndex}
                    className={`
                      px-4 py-3 flex items-center
                      ${column.width ? `w-${column.width}` : 'flex-1'}
                      ${column.className || ''}
                    `}
                    style={{ width: column.fixedWidth }}
                  >
                    {column.render ? column.render(item, item.virtualIndex) : item[column.key]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      {data.length > 10 && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {Math.round((scrollTop / (totalHeight - containerHeight)) * 100) || 0}%
        </div>
      )}
    </div>
  );
});

export default VirtualizedTable;