import React, { useState, useRef, useEffect, memo } from 'react';
import { ImageIcon } from 'lucide-react';

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  placeholder = null,
  loading = 'lazy',
  onLoad = () => {},
  onError = () => {},
  quality = 85,
  sizes = '',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading !== 'lazy' || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  // Generate responsive image URLs for different sizes
  const generateResponsiveSrc = (baseSrc, width) => {
    if (!baseSrc || baseSrc.startsWith('data:')) return baseSrc;
    
    // For external images or if no optimization is needed
    if (baseSrc.startsWith('http') && !baseSrc.includes('localhost')) {
      return baseSrc;
    }
    
    // Add width parameter for local images (assuming optimization service)
    const separator = baseSrc.includes('?') ? '&' : '?';
    return `${baseSrc}${separator}w=${width}&q=${quality}`;
  };

  const shouldLoad = loading === 'eager' || isInView;

  const defaultPlaceholder = (
    <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
      <ImageIcon className="w-8 h-8 text-gray-400" />
    </div>
  );

  if (hasError) {
    return placeholder || defaultPlaceholder;
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (placeholder || defaultPlaceholder)}
      
      {/* Actual image */}
      {shouldLoad && (
        <img
          src={generateResponsiveSrc(src, 800)} // Default width
          alt={alt}
          className={`
            transition-opacity duration-300 
            ${isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}
            ${className}
          `}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          sizes={sizes}
          srcSet={
            src && !src.startsWith('data:') ? `
              ${generateResponsiveSrc(src, 400)} 400w,
              ${generateResponsiveSrc(src, 800)} 800w,
              ${generateResponsiveSrc(src, 1200)} 1200w,
              ${generateResponsiveSrc(src, 1600)} 1600w
            ` : undefined
          }
          {...props}
        />
      )}
      
      {/* Loading indicator */}
      {shouldLoad && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

export default OptimizedImage;