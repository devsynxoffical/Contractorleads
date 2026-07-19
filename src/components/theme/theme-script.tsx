/** Inline script — apply saved theme before paint to avoid flash. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('lf-theme');if(t!=='light'&&t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
