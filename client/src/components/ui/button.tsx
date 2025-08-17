import * as React from "react"

import { buttonVariants } from "./button.variants"



// en Button.jsx
function Button({ children, className, ...props }) {
  const baseClasses = "font-bold py-2 px-4 rounded-lg transition-all";
  return (
    <button className={`${baseClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
Button.displayName = "Button"

export { Button }
