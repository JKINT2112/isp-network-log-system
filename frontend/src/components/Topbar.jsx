import { Plus, Search } from 'lucide-react'

function Topbar({ searchQuery, onSearchChange, onAddLog, canAdd = true }) {
  return (
    <header className="topbar">
      <div>
        <p className="topbar-kicker">ISP Network Log System</p>
        <h2>Field and infrastructure activity</h2>
      </div>

      <div className="topbar-actions">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search logs</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search logs"
          />
        </label>

        {canAdd && (
          <button type="button" className="icon-button" onClick={onAddLog} title="Add Log">
            <Plus size={20} aria-hidden="true" />
            <span className="sr-only">Add Log</span>
          </button>
        )}
      </div>
    </header>
  )
}

export default Topbar
