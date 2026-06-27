import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { formatDateTime } from '../utils/dateUtils'
import { formatRole } from '../utils/formatRole'

const statusClassMap = {
  Pending: 'pending',
  'In Progress': 'progress',
  Completed: 'completed',
  Failed: 'failed',
  Escalated: 'escalated',
}

function LogsTable({ logs, onEditLog, onDeleteLog, canEdit = true }) {
  const [expandedId, setExpandedId] = useState(null)

  const toggleCard = (logId) => {
    setExpandedId((current) => (current === logId ? null : logId))
  }

  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <strong>No logs found</strong>
        <p>Try a different search term or add a new network activity log.</p>
      </div>
    )
  }

  return (
    <>
      <div className="logs-table-wrap">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Engineer</th>
              <th>Site / Branch</th>
              <th>Device / Server</th>
              <th>IP Address</th>
              <th>Activity</th>
              <th>Status</th>
              <th>Remarks</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDateTime(log.dateTime)}</td>
                <td>
                  <strong>{log.engineerName}</strong>
                  <span>{formatRole(log.role)}</span>
                </td>
                <td>{log.siteBranch}</td>
                <td>{log.deviceServer}</td>
                <td>
                  <code>{log.ipAddress}</code>
                </td>
                <td>{log.activityType}</td>
                <td>
                  <span className={`status-badge ${statusClassMap[log.status]}`}>
                    {log.status}
                  </span>
                </td>
                <td className="remarks-cell">{log.remarks}</td>
                {canEdit && (
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="table-icon-button"
                        onClick={() => onEditLog(log)}
                        title="Edit log"
                      >
                        <Pencil size={16} aria-hidden="true" />
                        <span className="sr-only">Edit log</span>
                      </button>
                      <button
                        type="button"
                        className="table-icon-button danger"
                        onClick={() => onDeleteLog(log.id)}
                        title="Delete log"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        <span className="sr-only">Delete log</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="logs-accordion">
        {logs.map((log) => {
          const isExpanded = expandedId === log.id

          return (
            <article
              key={log.id}
              className={`log-card ${isExpanded ? 'expanded' : ''}`}
            >
              <button
                type="button"
                className="log-card-header"
                onClick={() => toggleCard(log.id)}
                aria-expanded={isExpanded}
              >
                <div className="log-card-info">
                  <strong>{log.engineerName}</strong>
                  <span>{formatDateTime(log.dateTime)}</span>
                </div>
                <div className="log-card-meta">
                  <span className={`status-badge ${statusClassMap[log.status]}`}>
                    {log.status}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`log-card-chevron ${isExpanded ? 'open' : ''}`}
                    aria-hidden="true"
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="log-card-body">
                  <div className="log-card-grid">
                    <div className="log-card-field">
                      <span>Role</span>
                      <strong>{formatRole(log.role)}</strong>
                    </div>
                    <div className="log-card-field">
                      <span>Activity</span>
                      <strong>{log.activityType}</strong>
                    </div>
                    <div className="log-card-field">
                      <span>Site / Branch</span>
                      <strong>{log.siteBranch}</strong>
                    </div>
                    <div className="log-card-field">
                      <span>Device / Server</span>
                      <strong>{log.deviceServer}</strong>
                    </div>
                    <div className="log-card-field">
                      <span>IP Address</span>
                      <code>{log.ipAddress}</code>
                    </div>
                  </div>

                  {log.remarks && (
                    <div className="log-card-remarks">
                      <span>Remarks</span>
                      <p>{log.remarks}</p>
                    </div>
                  )}

                  {canEdit && (
                    <div className="log-card-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditLog(log)
                        }}
                      >
                        <Pencil size={16} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-button danger-text"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteLog(log.id)
                        }}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}

export default LogsTable
