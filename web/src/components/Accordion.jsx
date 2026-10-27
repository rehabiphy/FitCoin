import { useId, useState } from 'react';
import Icon from './Icon.jsx';

export function AccordionItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`acc-item${open ? ' open' : ''}`}>
      <button className="acc-q" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <Icon name="ChevronDown" size={20} className="acc-chev" />
      </button>
      <div className="acc-a" id={id} role="region">
        <div>
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Accordion({ items, firstOpen = false }) {
  return (
    <div className="acc">
      {items.map((it, i) => (
        <AccordionItem key={it.q} q={it.q} a={it.a} defaultOpen={firstOpen && i === 0} />
      ))}
    </div>
  );
}
