// Owner: Member 5 -- wizard progress. Completed steps are clickable; future ones are not.
export default function Stepper({ steps, current, onStep }) {
  return (
    <ol className="ob-stepper" aria-label="Setup progress">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s.id} className={state} aria-current={state === 'current' ? 'step' : undefined}>
            <button type="button" disabled={state === 'todo'} onClick={() => onStep(i)}>
              <span className="ob-dot">{state === 'done' ? '✓' : i + 1}</span>
              <span className="ob-step-label">{s.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
