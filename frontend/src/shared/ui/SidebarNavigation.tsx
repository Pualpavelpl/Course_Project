import { NavLink } from "react-router-dom";
import type { NavigationItem } from "../../config/navigation";

interface SidebarNavigationProps {
  items: NavigationItem[];
  onNavigate: () => void;
}

export function SidebarNavigation({ items, onNavigate }: SidebarNavigationProps) {
  return (
    <nav className="nav nav-pills flex-column gap-2 p-3">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `nav-link border ${isActive ? "active" : "text-body"}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
