import { Share2, Download } from 'lucide-react';

export default function ShareButton({ onCapture, question }) {
  const shareText = `Check out the global consensus on: "${question}" via Spitfact!`;
  const shareUrl = window.location.href;

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Spitfact', text: shareText, url: shareUrl });
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <button onClick={onCapture} className="flex-1 bg-slate-700 text-xs p-2 rounded flex items-center justify-center gap-2">
        <Download size={14} /> Save Card
      </button>
      <button onClick={handleNativeShare} className="flex-1 bg-sky-500 text-xs p-2 rounded flex items-center justify-center gap-2">
        <Share2 size={14} /> Share Link
      </button>
    </div>
  );
}
