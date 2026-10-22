/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div 
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-[#540015] via-[#800020] to-[#991B1B] text-white flex items-center justify-center font-black shadow-md shadow-rose-950/20 shrink-0 relative overflow-hidden`}
      >
        <span className="relative z-10 tracking-tighter">M</span>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white/20 blur-xs" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/25 to-transparent" />
      </div>

      {showText && (
        <div className="leading-none">
          <div className={`${textSizes[size]} font-black tracking-tight text-black flex items-center gap-0.5`}>
            <span>Mitra</span>
            <span className="text-[#800020]">Store</span>
          </div>
          {size === 'xl' && (
            <p className="text-xs font-bold text-[#800020]/80 tracking-widest uppercase mt-1">
              Point of Sale &amp; Retail
            </p>
          )}
        </div>
      )}
    </div>
  );
};
