import { useState } from 'react'
import {
  BarChart3,
  Gauge,
  ListPlus,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', view: 'dashboard', icon: Gauge },
  { label: 'Add Log', view: 'add-log', icon: ListPlus },
  { label: 'View Logs', view: 'logs', icon: ScrollText },
  { label: 'Reports', view: 'reports', icon: BarChart3 },
  { label: 'Users', view: 'users', icon: Users },
  { label: 'Settings', view: 'settings', icon: Settings },
]

function Sidebar({ activeView, onNavigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const activeItem = navItems.find((item) => item.view === activeView) || navItems[0]

  const handleNavigate = (view) => {
    onNavigate(view)
    setIsMenuOpen(false)
  }

  return (
    <aside className={isMenuOpen ? 'sidebar menu-open' : 'sidebar'} aria-label="Main navigation">
      <div className="sidebar-top">
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <strong>ISP Logs</strong>
            <span>NOC Console</span>
          </div>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
        >
          {isMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          <span>{activeItem.label}</span>
        </button>
      </div>

      <nav className="nav-list" id="primary-navigation">
        {navItems.map(({ label, view, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={activeView === view ? 'nav-item active' : 'nav-item'}
            onClick={() => handleNavigate(view)}
            aria-current={activeView === view ? 'page' : undefined}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
