/** Inline script — apply saved theme before paint to avoid flash. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('lf-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
