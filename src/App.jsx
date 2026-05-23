import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Plus, X } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import StatCard from './components/StatCard'
import LogsTable from './components/LogsTable'
import LogModal from './components/LogModal'
import SettingsManager from './components/SettingsManager'
import {
  sampleActivityTypes,
  sampleDevices,
  sampleTeamMembers,
  roleOptions,
  statusOptions,
} from './data/sampleConfig'
import { addLog, deleteLog, getLogs, updateLog } from './services/logService'
import { isToday } from './utils/dateUtils'
import './App.css'

const formatRole = (member) => member.role || (member.roles || []).join(', ')

const initialLogForm = {
  engineerId: '',
  engineerName: '',
  role: '',
  deviceId: '',
  siteBranch: '',
  deviceServer: '',
  ipAddress: '',
  activityType: '',
  status: 'Pending',
  remarks: '',
}

const initialUserForm = {
  name: '',
  role: 'Network Engineer',
  status: 'Active',
}

function App() {
  const [logs, setLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [isSavingLog, setIsSavingLog] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [logsError, setLogsError] = useState('')
  const [activeView, setActiveView] = useState('dashboard')
  const [teamMembers, setTeamMembers] = useState(sampleTeamMembers)
  const [devices, setDevices] = useState(sampleDevices)
  const [activityTypes, setActivityTypes] = useState(sampleActivityTypes)
  const [editingConfig, setEditingConfig] = useState({ type: null, item: null })
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef(null)

  const activeTeamMembers = useMemo(
    () => teamMembers.filter((member) => member.status === 'Active'),
    [teamMembers],
  )

  const activeDevices = useMemo(
    () => devices.filter((device) => device.status === 'Active'),
    [devices],
  )

  const activeActivityTypes = useMemo(
    () => activityTypes.filter((activity) => activity.status === 'Active'),
    [activityTypes],
  )

  const loadLogs = useCallback(async () => {
    setIsLoadingLogs(true)
    setLogsError('')

    try {
      const firestoreLogs = await getLogs()
      setLogs(firestoreLogs)
    } catch (error) {
      setLogsError(error.message || 'Unable to load logs from Firestore.')
    } finally {
      setIsLoadingLogs(false)
    }
  }, [])

  useEffect(() => {
    const loadTimer = window.setTimeout(loadLogs, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadLogs])

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return logs
    }

    return logs.filter((log) =>
      [
        log.engineerName,
        log.role,
        log.siteBranch,
        log.deviceServer,
        log.ipAddress,
        log.activityType,
        log.status,
        log.remarks,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [logs, searchQuery])

  const stats = useMemo(
    () => [
      {
        label: 'Total Logs Today',
        value: logs.filter((log) => isToday(log.dateTime)).length,
        tone: 'blue',
      },
      {
        label: 'Open Issues',
        value: logs.filter((log) =>
          ['Pending', 'In Progress', 'Escalated'].includes(log.status),
        ).length,
        tone: 'amber',
      },
      {
        label: 'Completed Tasks',
        value: logs.filter((log) => log.status === 'Completed').length,
        tone: 'green',
      },
      {
        label: 'Critical Incidents',
        value: logs.filter(
          (log) => log.status === 'Failed' || log.status === 'Escalated',
        ).length,
        tone: 'red',
      },
      {
        label: 'Active Engineers',
        value: new Set(logs.map((log) => log.engineerName).filter(Boolean)).size,
        tone: 'indigo',
      },
    ],
    [logs],
  )

  const reportStats = useMemo(
    () => [
      {
        label: 'Total Logs',
        value: logs.length,
        tone: 'blue',
      },
      {
        label: 'Completed',
        value: logs.filter((log) => log.status === 'Completed').length,
        tone: 'green',
      },
      {
        label: 'Pending/In Progress',
        value: logs.filter((log) => ['Pending', 'In Progress'].includes(log.status))
          .length,
        tone: 'amber',
      },
      {
        label: 'Failed/Escalated',
        value: logs.filter((log) => ['Failed', 'Escalated'].includes(log.status))
          .length,
        tone: 'red',
      },
    ],
    [logs],
  )

  const openAddModal = () => {
    setEditingLog(null)
    setIsModalOpen(true)
  }

  const openAddUserModal = () => {
    setIsUserModalOpen(true)
  }

  const handleNavigate = (view) => {
    if (view === 'add-log') {
      openAddModal()
      return
    }

    if (view === 'logs') {
      loadLogs()
    }

    setActiveView(view)
  }

  const openEditModal = (log) => {
    setEditingLog(log)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingLog(null)
  }

  const closeUserModal = () => {
    setIsUserModalOpen(false)
  }

  const handleSaveLog = async (formData) => {
    const now = new Date().toISOString()

    setIsSavingLog(true)
    setLogsError('')

    try {
      if (editingLog) {
        await updateLog(editingLog.id, {
          ...editingLog,
          ...formData,
          dateTime: editingLog.dateTime,
        })
        await loadLogs()
        showToast('Log updated')
        closeModal()
        return
      }

      await addLog({
        ...formData,
        dateTime: now,
      })
      await loadLogs()
      showToast('Log added')
      closeModal()
    } catch (error) {
      setLogsError(error.message || 'Unable to save log to Firestore.')
    } finally {
      setIsSavingLog(false)
    }
  }

  const handleSaveUser = (userData) => {
    saveConfigItem(setTeamMembers, userData, userData.name)
    closeUserModal()
  }

  const handleDeleteLog = async (logId) => {
    const shouldDelete = window.confirm(
      'Delete this network log? This action cannot be undone.',
    )

    if (!shouldDelete) {
      return
    }

    setLogsError('')

    try {
      await deleteLog(logId)
      await loadLogs()
      showToast('Log deleted')
    } catch (error) {
      setLogsError(error.message || 'Unable to delete log from Firestore.')
    }
  }

  const showToast = (message) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }

    setToast(message)
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2400)
  }

  const saveConfigItem = (setItems, item, label) => {
    if (item.id) {
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, ...item } : currentItem,
        ),
      )
      setEditingConfig({ type: null, item: null })
      showToast(`${label} updated`)
      return
    }

    setItems((currentItems) => [
      ...currentItems,
      {
        id: crypto.randomUUID(),
        ...item,
      },
    ])
    showToast(`${label} added`)
  }

  const deleteConfigItem = ({ item, isUsed, setItems, label }) => {
    const message = isUsed
      ? `${label} is already used in logs. Mark it inactive instead?`
      : `Delete ${label}? This action cannot be undone.`

    if (!window.confirm(message)) {
      return
    }

    if (isUsed) {
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, status: 'Inactive' }
            : currentItem,
        ),
      )
      showToast(`${label} marked inactive`)
      return
    }

    setItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== item.id),
    )
    showToast(`${label} deleted`)
  }

  const handleDeleteMember = (member) => {
    const isUsed = logs.some(
      (log) => log.engineerId === member.id || log.engineerName === member.name,
    )

    deleteConfigItem({
      item: member,
      isUsed,
      setItems: setTeamMembers,
      label: member.name,
    })
  }

  const handleDeleteDevice = (device) => {
    const isUsed = logs.some(
      (log) => log.deviceId === device.id || log.deviceServer === device.name,
    )

    deleteConfigItem({
      item: device,
      isUsed,
      setItems: setDevices,
      label: device.name,
    })
  }

  const handleDeleteActivity = (activity) => {
    const isUsed = logs.some((log) => log.activityType === activity.name)

    deleteConfigItem({
      item: activity,
      isUsed,
      setItems: setActivityTypes,
      label: activity.name,
    })
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={handleNavigate} />

      <main className="main-panel">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddLog={openAddModal}
        />

        {logsError && activeView !== 'logs' && (
          <div className="error-message">{logsError}</div>
        )}

        {activeView === 'dashboard' && (
          <section className="dashboard-section" aria-labelledby="dashboard-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Operations dashboard</p>
                <h1 id="dashboard-title">Network activity overview</h1>
              </div>
              <button type="button" className="primary-button" onClick={openAddModal}>
                <Plus size={18} aria-hidden="true" />
                Add Log
              </button>
            </div>

            <div className="stats-grid">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
          </section>
        )}

        {activeView === 'logs' && (
          <section className="logs-section" aria-labelledby="logs-title">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Live records</p>
                <h2 id="logs-title">Network Logs</h2>
              </div>
              <span className="result-count">
                {filteredLogs.length} {filteredLogs.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {logsError && <div className="error-message">{logsError}</div>}

            {isLoadingLogs ? (
              <div className="empty-state" role="status" aria-live="polite">
                <strong>Loading logs</strong>
                <p>Fetching the latest network activity records.</p>
              </div>
            ) : (
              <LogsTable
                logs={filteredLogs}
                onEditLog={openEditModal}
                onDeleteLog={handleDeleteLog}
              />
            )}
          </section>
        )}

        {activeView === 'reports' && (
          <section className="content-section" aria-labelledby="reports-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Reports</p>
                <h1 id="reports-title">Network log reports</h1>
              </div>
              <button type="button" className="primary-button">
                Export CSV
              </button>
            </div>

            <div className="stats-grid report-grid">
              {reportStats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>

            <div className="filter-panel" aria-label="Report filters">
              <label>
                Date Range
                <input type="date" />
              </label>
              <label>
                Status
                <select defaultValue="">
                  <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
                </select>
              </label>
              <label>
                Activity Type
                <select defaultValue="">
                  <option value="">All activity types</option>
                  {activityTypes.map((activity) => (
                    <option key={activity.id}>{activity.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        {activeView === 'users' && (
          <section className="content-section" aria-labelledby="users-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Users</p>
                <h1 id="users-title">System users</h1>
              </div>
              <button type="button" className="primary-button" onClick={openAddUserModal}>
                <Plus size={18} aria-hidden="true" />
                Add User
              </button>
            </div>

            <div className="users-list">
              {teamMembers.map((user) => (
                <article className="user-card" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>Team member</span>
                  </div>
                  <div>
                    <span className="user-label">Role</span>
                    <b>{formatRole(user)}</b>
                  </div>
                  <span className={`user-status ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'settings' && (
          <SettingsManager
            teamMembers={teamMembers}
            devices={devices}
            activityTypes={activityTypes}
            editingConfig={editingConfig}
            onStartConfigEdit={(type, item) => setEditingConfig({ type, item })}
            onCancelConfigEdit={() => setEditingConfig({ type: null, item: null })}
            onSaveMember={(member) => saveConfigItem(setTeamMembers, member, member.name)}
            onSaveDevice={(device) => saveConfigItem(setDevices, device, device.name)}
            onSaveActivity={(activity) =>
              saveConfigItem(setActivityTypes, activity, activity.name)
            }
            onDeleteMember={handleDeleteMember}
            onDeleteDevice={handleDeleteDevice}
            onDeleteActivity={handleDeleteActivity}
          />
        )}
      </main>

      {isModalOpen && (
        <LogModal
          initialValues={editingLog || initialLogForm}
          isEditing={Boolean(editingLog)}
          teamMembers={activeTeamMembers}
          devices={activeDevices}
          activityTypes={activeActivityTypes}
          onClose={closeModal}
          onSave={handleSaveLog}
          isSaving={isSavingLog}
        />
      )}

      {isUserModalOpen && (
        <UserModal
          initialValues={initialUserForm}
          onClose={closeUserModal}
          onSave={handleSaveUser}
        />
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={18} aria-hidden="true" />
          {toast}
        </div>
      )}
    </div>
  )
}

function UserModal({ initialValues, onClose, onSave }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    onSave(Object.fromEntries(formData))
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" aria-labelledby="user-modal-title" role="dialog">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Users</p>
            <h2 id="user-modal-title">Add User</h2>
          </div>
          <button
            type="button"
            className="icon-button quiet"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="log-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              name="name"
              defaultValue={initialValues.name}
              placeholder="Full name"
              required
            />
          </label>

          <label>
            Role
            <select name="role" defaultValue={initialValues.role} required>
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>

          <label className="full-span">
            Status
            <select name="status" defaultValue={initialValues.status} required>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              <Plus size={16} aria-hidden="true" />
              Add User
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default App
