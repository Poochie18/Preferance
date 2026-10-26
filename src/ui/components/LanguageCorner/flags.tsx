export function FlagRU() {
  return (
    <svg viewBox="0 0 60 30" width="26" height="16" aria-hidden="true">
      <rect width="60" height="10" y="0" fill="#fff" />
      <rect width="60" height="10" y="10" fill="#0039a6" />
      <rect width="60" height="10" y="20" fill="#d52b1e" />
    </svg>
  );
}

export function FlagUA() {
  return (
    <svg viewBox="0 0 60 30" width="26" height="16" aria-hidden="true">
      <rect width="60" height="15" y="0" fill="#0057b7" />
      <rect width="60" height="15" y="15" fill="#ffd700" />
    </svg>
  );
}

export function FlagGB() {
  return (
    <svg viewBox="0 0 60 30" width="26" height="16" aria-hidden="true">
      <rect width="60" height="30" fill="#00247d" />
      <g stroke="#fff" strokeWidth="6">
        <path d="M0,0 L60,30 M60,0 L0,30" />
      </g>
      <g stroke="#cf142b" strokeWidth="2">
        <path d="M0,0 L60,30 M60,0 L0,30" />
      </g>
      <g stroke="#fff" strokeWidth="10">
        <path d="M30,0 V30 M0,15 H60" />
      </g>
      <g stroke="#cf142b" strokeWidth="6">
        <path d="M30,0 V30 M0,15 H60" />
      </g>
    </svg>
  );
}
