export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="back-corner" onClick={onClick} aria-label={label} title={label}>
      <span aria-hidden="true">←</span> {label}
    </button>
  );
}
