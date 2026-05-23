import { Pencil, Trash2 } from 'lucide-react'
import { formatDateTime } from '../utils/dateUtils'

const statusClassMap = {
  Pending: 'pending',
  'In Progress': 'progress',
  Completed: 'completed',
  Failed: 'failed',
  Escalated: 'escalated',
}

const formatRole = (role) => (Array.isArray(role) ? role.join(', ') : role)

function LogsTable({ logs, onEditLog, onDeleteLog }) {
  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <strong>No logs found</strong>
        <p>Try a different search term or add a new network activity log.</p>
      </div>
    )
  }

  return (
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td data-label="Date/Time">{formatDateTime(log.dateTime)}</td>
              <td data-label="Engineer">
                <strong>{log.engineerName}</strong>
                <span>{formatRole(log.role)}</span>
              </td>
              <td data-label="Site / Branch">{log.siteBranch}</td>
              <td data-label="Device / Server">{log.deviceServer}</td>
              <td data-label="IP Address">
                <code>{log.ipAddress}</code>
              </td>
              <td data-label="Activity">{log.activityType}</td>
              <td data-label="Status">
                <span className={`status-badge ${statusClassMap[log.status]}`}>
                  {log.status}
                </span>
              </td>
              <td data-label="Remarks" className="remarks-cell">
                {log.remarks}
              </td>
              <td data-label="Actions">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default LogsTable
