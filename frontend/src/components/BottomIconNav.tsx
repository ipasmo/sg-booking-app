import type { LucideIcon } from 'lucide-react';

type BottomIconNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick: () => void;
};

type BottomIconNavProps = {
  items: BottomIconNavItem[];
};

export default function BottomIconNav({ items }: BottomIconNavProps) {
  return (
    <nav className="sport-events-bottom-nav" aria-label="Bottom navigation">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <button
            type="button"
            key={item.key}
            className={`sport-events-nav-item${item.active ? ' active' : ''}`}
            onClick={item.onClick}
          >
            <Icon size={23} strokeWidth={2.1} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}