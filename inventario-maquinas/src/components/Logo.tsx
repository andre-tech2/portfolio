export default function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} shrink-0`} xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#0B1F3B" />
      <ellipse
        cx="50"
        cy="50"
        rx="40"
        ry="19"
        transform="rotate(-20 50 50)"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
      />
      <text
        x="50"
        y="67"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fill="#FFFFFF"
      >
        <tspan fontSize="46">A</tspan>
        <tspan fontSize="28" dy="-6">&amp;</tspan>
        <tspan fontSize="46" dy="6">A</tspan>
      </text>
    </svg>
  )
}
