import { useMemo, useState } from 'react'
import {
  BarChart3,
  Gauge,
  ListPlus,
  LogOut,
  Menu,
  Plus,
  ScrollText,
  Settings,
  Users,
  X,
} from 'lucide-react'
import BrandMark from './BrandMark'

const allNavItems = [
  { label: 'Dashboard', view: 'dashboard', icon: Gauge, minLevel: 'Viewer' },
  { label: 'Add Log', view: 'add-log', icon: ListPlus, minLevel: 'Engineer' },
  { label: 'View Logs', view: 'logs', icon: ScrollText, minLevel: 'Viewer' },
  { label: 'Reports', view: 'reports', icon: BarChart3, minLevel: 'Viewer' },
  { label: 'Users', view: 'users', icon: Users, minLevel: 'Admin' },
  { label: 'Settings', view: 'settings', icon: Settings, minLevel: 'Admin' },
]

const levelRank = { Admin: 3, Engineer: 2, Viewer: 1 }

function Sidebar({ activeView, onNavigate, onLogout, accessLevel = 'Viewer' }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const rank = levelRank[accessLevel] || 1
  const canAdd = rank >= levelRank.Engineer
  const canManage = rank >= levelRank.Admin

  const navItems = useMemo(
    () => allNavItems.filter((item) => rank >= levelRank[item.minLevel]),
    [rank],
  )

  const handleNavigate = (view) => {
    onNavigate(view)
    setIsMoreOpen(false)
  }

  const moreMenuItems = useMemo(() => {
    const items = []
    if (canManage) {
      items.push({ label: 'Users', view: 'users', icon: Users })
      items.push({ label: 'Settings', view: 'settings', icon: Settings })
    }
    return items
  }, [canManage])

  return (
    <>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-top">
          <BrandMark />
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

        {onLogout && (
          <button type="button" className="nav-item logout-item" onClick={onLogout}>
            <LogOut size={18} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        )}
      </aside>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          type="button"
          className={activeView === 'dashboard' ? 'mobile-tab active' : 'mobile-tab'}
          onClick={() => handleNavigate('dashboard')}
        >
          <Gauge size={22} aria-hidden="true" />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={activeView === 'logs' ? 'mobile-tab active' : 'mobile-tab'}
          onClick={() => handleNavigate('logs')}
        >
          <ScrollText size={22} aria-hidden="true" />
          <span>Logs</span>
        </button>

        {canAdd && (
          <button
            type="button"
            className="mobile-tab add-tab"
            onClick={() => handleNavigate('add-log')}
            aria-label="Add Log"
          >
            <span className="add-tab-circle">
              <Plus size={26} aria-hidden="true" />
            </span>
          </button>
        )}

        <button
          type="button"
          className={activeView === 'reports' ? 'mobile-tab active' : 'mobile-tab'}
          onClick={() => handleNavigate('reports')}
        >
          <BarChart3 size={22} aria-hidden="true" />
          <span>Reports</span>
        </button>

        <button
          type="button"
          className={
            isMoreOpen || activeView === 'users' || activeView === 'settings'
              ? 'mobile-tab active'
              : 'mobile-tab'
          }
          onClick={() => setIsMoreOpen((open) => !open)}
        >
          {isMoreOpen ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
          <span>More</span>
        </button>

        {isMoreOpen && (
          <>
            <div
              className="more-backdrop"
              role="presentation"
              onClick={() => setIsMoreOpen(false)}
            />
            <div className="more-menu">
              {moreMenuItems.map(({ label, view, icon: Icon }) => (
                <button key={label} type="button" onClick={() => handleNavigate(view)}>
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </button>
              ))}
              {onLogout && (
                <button type="button" className="more-logout" onClick={onLogout}>
                  <LogOut size={18} aria-hidden="true" />
                  Sign Out
                </button>
              )}
            </div>
          </>
        )}
      </nav>
    </>
  )
}

export default Sidebar
