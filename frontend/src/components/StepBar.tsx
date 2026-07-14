interface StepBarProps {
  /** 0-based index of the current screen (0=home … 4=success) */
  current: number;
  total?: number;
}

export default function StepBar({ current, total = 5 }: StepBarProps) {
  return (
    <div className="steps" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => {
        const cls = i < current ? 'step done' : i === current ? 'step active' : 'step';
        return <div key={i} className={cls} />;
      })}
    </div>
  );
}
