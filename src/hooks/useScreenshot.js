import React from 'react';
import { toPng } from 'html-to-image';

export const useScreenshot = (elementRef) => {
  const takeScreenshot = async () => {
    if (elementRef.current === null) return;

    try {
      const dataUrl = await toPng(elementRef.current, { 
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0f172a',
      });

      const link = document.createElement('a');
      link.download = `spitfact-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  };

  return { takeScreenshot };
};