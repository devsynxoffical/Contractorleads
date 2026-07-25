/** Inline script — apply theme before paint to avoid flash. */
export function ThemeScript() {
  // Public routes always start light. App routes use saved preference (default light).
  // Never leave data-theme unset — CSS used to treat "missing" as dark.
  const code = `(function(){try{var p=location.pathname||'/';var force=p==='/'||/^\\/(login|register|forgot-password|reset-password|verify-email|onboarding|auth|email)(\\/|$)/.test(p);var t=force?'light':localStorage.getItem('lf-theme');if(t!=='light'&&t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
