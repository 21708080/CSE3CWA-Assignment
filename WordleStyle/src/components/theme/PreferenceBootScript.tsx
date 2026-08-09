import Script from "next/script";

export function PreferenceBootScript() {
  const script = `
(function () {
  try {
    const cookieMap = Object.fromEntries(
      document.cookie.split(';').filter(Boolean).map((part) => {
        const index = part.indexOf('=');
        if (index === -1) return [part.trim(), ''];
        return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
      })
    );

    const saved = cookieMap['phoneme-appearance'];
    const appearance = ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = appearance === 'system' ? (systemDark ? 'dark' : 'light') : appearance;

    document.documentElement.dataset.appearance = appearance;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.density = 'compact';

    if (appearance === 'system' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', function (event) {
        if (document.documentElement.dataset.appearance === 'system') {
          document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
        }
      });
    }
  } catch (_) {
    document.documentElement.dataset.appearance = 'system';
    document.documentElement.dataset.theme = 'light';
    document.documentElement.dataset.density = 'compact';
  }
})();`;

  return (
    <Script id="phoneme-preference-boot" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
