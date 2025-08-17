// TypeScript global type definitions

// Disable type checking for Babel core
declare var babel__core: any;

// Disable type checking for UI libraries that might be missing
declare module '@radix-ui/*' {
  const content: any;
  export = content;
}

declare module 'sonner' {
  const content: any;
  export = content;
}

declare module 'next-themes' {
  const content: any;
  export = content;
}

declare module 'cmdk' {
  const content: any;
  export = content;
}

declare module 'react-day-picker' {
  const content: any;
  export = content;
}

declare module 'embla-carousel-react' {
  const content: any;
  export = content;
}

declare module 'recharts' {
  const content: any;
  export = content;
}

declare module 'vaul' {
  const content: any;
  export = content;
}

declare module 'input-otp' {
  const content: any;
  export = content;
}

declare module 'react-hook-form' {
  const content: any;
  export = content;
}

declare module 'react-resizable-panels' {
  const content: any;
  export = content;
}