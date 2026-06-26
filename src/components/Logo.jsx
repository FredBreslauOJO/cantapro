import React from 'react';

export default function Logo({ className = "w-28", iconOnly = false }) {
  if (iconOnly) {
    return (
      <img 
        src="/CantaPro-Icon.svg" 
        alt="Canta Pro Ícone" 
        className={className}
        draggable="false"
      />
    );
  }

  return (
    <img 
      src="/CantaProLogo.svg" 
      alt="Canta Pro Logo" 
      className={className}
      draggable="false"
    />
  );
}