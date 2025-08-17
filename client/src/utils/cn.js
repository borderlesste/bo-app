import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const animations = {
  fadeIn: 'animate-fadeIn',
  slideInLeft: 'animate-slideInLeft',
  slideInRight: 'animate-slideInRight',
  scaleIn: 'animate-scaleIn',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer'
};

export const transitions = {
  default: 'transition-all duration-300 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  transform: 'transition-transform duration-300 ease-in-out',
  opacity: 'transition-opacity duration-300 ease-in-out'
};

export const shadows = {
  sm: 'shadow-sm',
  default: 'shadow-lg',
  lg: 'shadow-xl',
  xl: 'shadow-2xl',
  inner: 'shadow-inner',
  none: 'shadow-none'
};

export const gradients = {
  primary: 'bg-gradient-to-r from-primary to-secondary',
  accent: 'bg-gradient-to-r from-accent to-primary',
  light: 'bg-gradient-to-br from-light via-white to-gray-50',
  dark: 'bg-gradient-to-br from-dark via-dark/90 to-dark/80',
  glass: 'bg-white/70 dark:bg-dark/50 backdrop-blur-md'
};