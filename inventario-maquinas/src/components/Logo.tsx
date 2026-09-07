export default function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="novatech-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#novatech-logo-grad)" />
      <path
        d="M12 28V12h3.6l8.8 11.2V12H28v16h-3.6l-8.8-11.2V28H12z"
        fill="white"
        fillOpacity="0.95"
      />
    </svg>
  )
}
