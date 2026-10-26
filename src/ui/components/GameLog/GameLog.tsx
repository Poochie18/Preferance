export function GameLog({ lines }: { lines: string[] }) {
  return (
    <div className="panel game-log">
      <h3>Журнал гри</h3>
      <div className="game-log-lines">
        {lines.slice(-50).map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
