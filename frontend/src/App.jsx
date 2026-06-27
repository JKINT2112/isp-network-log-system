import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { CheckCircle2, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import StatCard from './components/StatCard'
import LogsTable from './components/LogsTable'
import LogModal from './components/LogModal'
import LoginPage from './components/LoginPage'
import SettingsManager from './components/SettingsManager'
import {
  roleOptions,
  statusOptions,
  accessLevelOptions,
} from './data/sampleConfig'
import { addLog, deleteLog, getLogs, updateLog } from './services/logService'
import {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember as removeTeamMember,
  getDevices,
  addDevice,
  updateDevice,
  deleteDevice as removeDevice,
  getActivityTypes,
  addActivityType,
  updateActivityType,
  deleteActivityType as removeActivityType,
} from './services/configService'
import { logOut } from './services/authService'
import { auth } from './firebase/firebaseConfig'
import { formatRole } from './utils/formatRole'
import { isToday } from './utils/dateUtils'
import './App.css'

const emptyLogForm = {
  engineerId: '',
  engineerName: '',
  role: '',
  deviceId: '',
  siteBranch: '',
  deviceServer: '',
  ipAddress: '',
  activityType: '',
  status: 'In Progress',
  remarks: '',
}

const initialUserForm = {
  name: '',
  email: '',
  role: 'Network Engineer',
  accessLevel: 'Engineer',
  status: 'Active',
}

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [isSavingLog, setIsSavingLog] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [logsError, setLogsError] = useState('')
  const [activeView, setActiveView] = useState('dashboard')
  const [teamMembers, setTeamMembers] = useState([])
  const [devices, setDevices] = useState([])
  const [activityTypes, setActivityTypes] = useState([])
  const [configLoaded, setConfigLoaded] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimerRef = useRef(null)
  const bootstrapped = useRef(false)

  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')
  const [reportStatus, setReportStatus] = useState('')
  const [reportActivity, setReportActivity] = useState('')

  const currentMember = useMemo(() => {
    const email = user?.email?.toLowerCase()
    if (!email) return undefined
    return teamMembers.find((m) => m.email?.toLowerCase() === email)
  }, [teamMembers, user])

  // Fail closed: an unknown user is a Viewer (read-only), never an admin.
  // Admin is only granted to a matched team-member record. The very first
  // sign-in is bootstrapped to Admin by the effect below + Firestore rules.
  const accessLevel = currentMember?.accessLevel || 'Viewer'
  const canAdd = accessLevel === 'Admin' || accessLevel === 'Engineer'
  const canManage = accessLevel === 'Admin'

  const initialLogForm = useMemo(() => {
    if (!currentMember) return emptyLogForm
    return {
      ...emptyLogForm,
      engineerId: currentMember.id,
      engineerName: currentMember.name,
      role: formatRole(currentMember),
    }
  }, [currentMember])

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

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

  const loadConfig = useCallback(async () => {
    try {
      // Members must load for role resolution; only then mark config ready
      // (fail closed — a failed read must not bootstrap or grant access).
      const members = await getTeamMembers()
      setTeamMembers(members)
      setConfigLoaded(true)
    } catch (error) {
      setLogsError(error.message || 'Unable to load configuration.')
      return
    }

    // Devices and activity types are best-effort: a brand-new user has no
    // member record yet, so these reads may be denied until bootstrap runs.
    try {
      const [devs, activities] = await Promise.all([
        getDevices(),
        getActivityTypes(),
      ])
      setDevices(devs)
      setActivityTypes(activities)
    } catch {
      // Loaded again after the member record exists.
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadLogs()
    loadConfig()
  }, [user, loadLogs, loadConfig])

  useEffect(() => {
    if (!user || !configLoaded || bootstrapped.current) return
    // Only a genuinely empty collection triggers bootstrap. The write itself
    // is only permitted for the seed-admin email by the Firestore rules, so a
    // non-owner who happens to sign in first is rejected and stays a Viewer.
    if (teamMembers.length !== 0) return

    bootstrapped.current = true

    const createFirstAdmin = async () => {
      try {
        await addTeamMember({
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          role: 'Admin',
          accessLevel: 'Admin',
          status: 'Active',
        })
        await loadConfig()
      } catch {
        // Not the seed admin — rules rejected the write; remain a Viewer.
      }
    }
    createFirstAdmin()
  }, [user, configLoaded, teamMembers, loadConfig])

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

  const filteredReportLogs = useMemo(() => {
    return logs.filter((log) => {
      if (reportStatus && log.status !== reportStatus) return false
      if (reportActivity && log.activityType !== reportActivity) return false
      if (reportDateFrom) {
        const logDate = new Date(log.dateTime)
        const from = new Date(reportDateFrom)
        from.setHours(0, 0, 0, 0)
        if (logDate < from) return false
      }
      if (reportDateTo) {
        const logDate = new Date(log.dateTime)
        const to = new Date(reportDateTo)
        to.setHours(23, 59, 59, 999)
        if (logDate > to) return false
      }
      return true
    })
  }, [logs, reportStatus, reportActivity, reportDateFrom, reportDateTo])

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
        value: filteredReportLogs.length,
        tone: 'blue',
      },
      {
        label: 'Completed',
        value: filteredReportLogs.filter((log) => log.status === 'Completed').length,
        tone: 'green',
      },
      {
        label: 'Pending/In Progress',
        value: filteredReportLogs.filter((log) =>
          ['Pending', 'In Progress'].includes(log.status),
        ).length,
        tone: 'amber',
      },
      {
        label: 'Failed/Escalated',
        value: filteredReportLogs.filter((log) =>
          ['Failed', 'Escalated'].includes(log.status),
        ).length,
        tone: 'red',
      },
    ],
    [filteredReportLogs],
  )

  const openAddModal = () => {
    setEditingLog(null)
    setIsModalOpen(true)
  }

  const openAddUserModal = () => {
    setEditingUser(null)
    setIsUserModalOpen(true)
  }

  const openEditUserModal = (member) => {
    setEditingUser(member)
    setIsUserModalOpen(true)
  }

  const handleNavigate = (view) => {
    if (view === 'add-log') {
      if (!canAdd) return
      openAddModal()
      return
    }

    if ((view === 'users' || view === 'settings') && !canManage) return

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
    setEditingUser(null)
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

  const handleSaveUser = async (userData) => {
    try {
      if (userData.id) {
        await updateTeamMember(userData.id, userData)
        showToast(`${userData.name} updated`)
      } else {
        await addTeamMember(userData)
        showToast(`${userData.name} added`)
      }
      await loadConfig()
      closeUserModal()
    } catch (error) {
      setLogsError(error.message || 'Unable to save user.')
    }
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

  const handleDeleteMember = async (member) => {
    if (member.email === user?.email) {
      window.alert('You cannot delete your own account.')
      return
    }

    const isUsed = logs.some(
      (log) => log.engineerId === member.id || log.engineerName === member.name,
    )

    const message = isUsed
      ? `${member.name} is already used in logs. Mark inactive instead?`
      : `Delete ${member.name}? This action cannot be undone.`

    if (!window.confirm(message)) return

    try {
      if (isUsed) {
        await updateTeamMember(member.id, { ...member, status: 'Inactive' })
        showToast(`${member.name} marked inactive`)
      } else {
        await removeTeamMember(member.id)
        showToast(`${member.name} deleted`)
      }
      await loadConfig()
    } catch (error) {
      setLogsError(error.message || 'Unable to delete user.')
    }
  }

  const showToast = (message) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }

    setToast(message)
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2400)
  }

  const handleSaveDevice = async (device) => {
    try {
      if (device.id) {
        await updateDevice(device.id, device)
        showToast(`${device.name} updated`)
      } else {
        await addDevice(device)
        showToast(`${device.name} added`)
      }
      await loadConfig()
    } catch (error) {
      setLogsError(error.message || 'Unable to save device.')
    }
  }

  const handleSaveActivity = async (activity) => {
    try {
      if (activity.id) {
        await updateActivityType(activity.id, activity)
        showToast(`${activity.name} updated`)
      } else {
        await addActivityType(activity)
        showToast(`${activity.name} added`)
      }
      await loadConfig()
    } catch (error) {
      setLogsError(error.message || 'Unable to save activity type.')
    }
  }

  const handleDeleteDevice = async (device) => {
    const isUsed = logs.some(
      (log) => log.deviceId === device.id || log.deviceServer === device.name,
    )

    const message = isUsed
      ? `${device.name} is already used in logs. Mark inactive instead?`
      : `Delete ${device.name}? This action cannot be undone.`

    if (!window.confirm(message)) return

    try {
      if (isUsed) {
        await updateDevice(device.id, { ...device, status: 'Inactive' })
        showToast(`${device.name} marked inactive`)
      } else {
        await removeDevice(device.id)
        showToast(`${device.name} deleted`)
      }
      await loadConfig()
    } catch (error) {
      setLogsError(error.message || 'Unable to delete device.')
    }
  }

  const handleDeleteActivity = async (activity) => {
    const isUsed = logs.some((log) => log.activityType === activity.name)

    const message = isUsed
      ? `${activity.name} is already used in logs. Mark inactive instead?`
      : `Delete ${activity.name}? This action cannot be undone.`

    if (!window.confirm(message)) return

    try {
      if (isUsed) {
        await updateActivityType(activity.id, { ...activity, status: 'Inactive' })
        showToast(`${activity.name} marked inactive`)
      } else {
        await removeActivityType(activity.id)
        showToast(`${activity.name} deleted`)
      }
      await loadConfig()
    } catch (error) {
      setLogsError(error.message || 'Unable to delete activity type.')
    }
  }

  const exportCSV = () => {
    if (filteredReportLogs.length === 0) {
      showToast('No logs to export')
      return
    }

    const headers = [
      'Date/Time',
      'Engineer',
      'Role',
      'Site/Branch',
      'Device/Server',
      'IP Address',
      'Activity',
      'Status',
      'Remarks',
    ]

    const rows = filteredReportLogs.map((log) => [
      log.dateTime,
      log.engineerName,
      log.role,
      log.siteBranch,
      log.deviceServer,
      log.ipAddress,
      log.activityType,
      log.status,
      log.remarks,
    ])

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','),
      )
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `network-logs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported')
  }

  if (authLoading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  // Signed in, config loaded, but not on the team and the team isn't empty:
  // fail closed with a clear message instead of a broken, permission-denied app.
  if (configLoaded && !currentMember && teamMembers.length > 0) {
    return <NotAuthorized email={user.email} onLogout={logOut} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={logOut}
        accessLevel={accessLevel}
      />

      <main className="main-panel">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddLog={openAddModal}
          canAdd={canAdd}
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
              {canAdd && (
                <button type="button" className="primary-button" onClick={openAddModal}>
                  <Plus size={18} aria-hidden="true" />
                  Add Log
                </button>
              )}
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
                canEdit={canAdd}
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
              <button type="button" className="primary-button" onClick={exportCSV}>
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
                From
                <input
                  type="date"
                  value={reportDateFrom}
                  onChange={(e) => setReportDateFrom(e.target.value)}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={reportDateTo}
                  onChange={(e) => setReportDateTo(e.target.value)}
                />
              </label>
              <label>
                Status
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Activity Type
                <select
                  value={reportActivity}
                  onChange={(e) => setReportActivity(e.target.value)}
                >
                  <option value="">All activity types</option>
                  {activityTypes.map((activity) => (
                    <option key={activity.id}>{activity.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="report-summary">
              <span className="result-count">
                {filteredReportLogs.length}{' '}
                {filteredReportLogs.length === 1 ? 'record' : 'records'} match filters
              </span>
            </div>
          </section>
        )}

        {activeView === 'users' && canManage && (
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
              {teamMembers.map((member) => (
                <article className="user-card" key={member.id}>
                  <div className="user-card-main">
                    <strong>{member.name}</strong>
                    <span>{member.email || 'No email'}</span>
                  </div>
                  <div>
                    <span className="user-label">Role</span>
                    <b>{formatRole(member)}</b>
                  </div>
                  <div>
                    <span className="user-label">Access</span>
                    <span
                      className={`access-badge ${(member.accessLevel || 'Viewer').toLowerCase()}`}
                    >
                      {member.accessLevel || 'Viewer'}
                    </span>
                  </div>
                  <span className={`user-status ${member.status.toLowerCase()}`}>
                    {member.status}
                  </span>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="table-icon-button"
                      onClick={() => openEditUserModal(member)}
                      title="Edit user"
                    >
                      <Pencil size={16} aria-hidden="true" />
                      <span className="sr-only">Edit user</span>
                    </button>
                    <button
                      type="button"
                      className="table-icon-button danger"
                      onClick={() => handleDeleteMember(member)}
                      title="Delete user"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      <span className="sr-only">Delete user</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'settings' && canManage && (
          <SettingsManager
            devices={devices}
            activityTypes={activityTypes}
            onSaveDevice={handleSaveDevice}
            onSaveActivity={handleSaveActivity}
            onDeleteDevice={handleDeleteDevice}
            onDeleteActivity={handleDeleteActivity}
          />
        )}
      </main>

      {isModalOpen && (
        <LogModal
          initialValues={editingLog || initialLogForm}
          isEditing={Boolean(editingLog)}
          accessLevel={accessLevel}
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
          initialValues={editingUser || initialUserForm}
          isEditing={Boolean(editingUser)}
          isSelf={editingUser?.email === user?.email}
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

function NotAuthorized({ email, onLogout }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <div>
            <strong>ISP Logs</strong>
            <span>NOC Console</span>
          </div>
        </div>

        <h1>Access pending</h1>
        <p>
          You're signed in as <strong>{email}</strong>, but this account isn't on
          the team yet. Ask an administrator to add you, then sign in again.
        </p>

        <button type="button" className="primary-button login-btn" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  )
}

function UserModal({ initialValues, isEditing, isSelf, onClose, onSave }) {
  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData)

    onSave({ ...initialValues, ...data })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" aria-labelledby="user-modal-title" role="dialog">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Users</p>
            <h2 id="user-modal-title">{isEditing ? 'Edit User' : 'Add User'}</h2>
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
            Email
            <input
              name="email"
              type="email"
              defaultValue={initialValues.email}
              placeholder="email@example.com"
              required
              readOnly={isEditing}
            />
            {isEditing && (
              <small className="field-hint">Email is the account key and can't be changed.</small>
            )}
          </label>

          <label>
            Role
            <select name="role" defaultValue={initialValues.role} required>
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>

          <label>
            Access Level
            {isSelf ? (
              <>
                <input value={initialValues.accessLevel} readOnly />
                <input type="hidden" name="accessLevel" value={initialValues.accessLevel} />
              </>
            ) : (
              <select
                name="accessLevel"
                defaultValue={initialValues.accessLevel}
                required
              >
                {accessLevelOptions.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            )}
          </label>

          <label className="full-span">
            Status
            {isSelf ? (
              <>
                <input value={initialValues.status} readOnly />
                <input type="hidden" name="status" value={initialValues.status} />
              </>
            ) : (
              <select name="status" defaultValue={initialValues.status} required>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            )}
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              <Plus size={16} aria-hidden="true" />
              {isEditing ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default App
