import { toPng } from 'html-to-image';

export const useScreenshot = (elementRef) => {
  const takeScreenshot = async () => {
    if (elementRef.current === null) return;
    
    const dataUrl = await toPng(elementRef.current, { cacheBust: true });
    const link = document.createElement('a');
    link.download = `spitfact-result-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return { takeScreenshot };
};
