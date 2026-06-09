import { useEffect } from 'react';

export function CodeCopyButtons() {
  useEffect(() => {
    document.querySelectorAll('article pre').forEach(pre => {
      if (pre.querySelector('.copy-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-btn absolute top-2 right-2 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded transition-colors';
      btn.textContent = 'Copy';
      btn.onclick = () => {
        const code = pre.querySelector('code')?.textContent || pre.textContent || '';
        navigator.clipboard.writeText(code);
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      };
      (pre as HTMLElement).style.position = 'relative';
      pre.appendChild(btn);
    });
  });

  return null;
}
