export function SkylineIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 320" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="skylineFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <g fill="url(#skylineFade)">
        <rect x="20" y="140" width="90" height="180" rx="6" />
        <rect x="130" y="90" width="70" height="230" rx="6" />
        <rect x="220" y="170" width="110" height="150" rx="6" />
        <rect x="350" y="60" width="80" height="260" rx="6" />
        <rect x="450" y="120" width="60" height="200" rx="6" />
        <rect x="530" y="40" width="95" height="280" rx="6" />
        <rect x="645" y="150" width="75" height="170" rx="6" />
        <rect x="740" y="100" width="90" height="220" rx="6" />
        <rect x="850" y="180" width="60" height="140" rx="6" />
        <rect x="930" y="70" width="85" height="250" rx="6" />
        <rect x="1035" y="130" width="70" height="190" rx="6" />
        <rect x="1125" y="160" width="60" height="160" rx="6" />
      </g>
      <g fill="var(--primary)" opacity="0.5">
        <rect x="45" y="165" width="10" height="10" rx="2" />
        <rect x="70" y="165" width="10" height="10" rx="2" />
        <rect x="45" y="195" width="10" height="10" rx="2" />
        <rect x="70" y="195" width="10" height="10" rx="2" />
        <rect x="155" y="120" width="10" height="10" rx="2" />
        <rect x="180" y="120" width="10" height="10" rx="2" />
        <rect x="155" y="150" width="10" height="10" rx="2" />
        <rect x="180" y="150" width="10" height="10" rx="2" />
        <rect x="375" y="90" width="10" height="10" rx="2" />
        <rect x="400" y="90" width="10" height="10" rx="2" />
        <rect x="375" y="120" width="10" height="10" rx="2" />
        <rect x="400" y="120" width="10" height="10" rx="2" />
        <rect x="555" y="70" width="10" height="10" rx="2" />
        <rect x="580" y="70" width="10" height="10" rx="2" />
        <rect x="555" y="100" width="10" height="10" rx="2" />
        <rect x="580" y="100" width="10" height="10" rx="2" />
      </g>
    </svg>
  );
}

export function BuildingGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="10" y="20" width="18" height="38" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="32" y="8" width="22" height="50" rx="2" fill="currentColor" opacity="0.28" />
      <rect x="15" y="27" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="15" y="36" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="15" y="45" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="38" y="16" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="46" y="16" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="38" y="25" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="46" y="25" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="38" y="34" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="46" y="34" width="4" height="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
