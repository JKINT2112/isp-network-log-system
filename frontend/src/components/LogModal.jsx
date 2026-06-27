import { useState } from 'react'
import { X } from 'lucide-react'
import { addStatusOptions, statusOptions } from '../data/sampleConfig'
import { formatRole } from '../utils/formatRole'

function LogModal({
  initialValues,
  isEditing,
  accessLevel = 'Engineer',
  teamMembers,
  devices,
  activityTypes,
  onClose,
  onSave,
  isSaving = false,
}) {
  const [formData, setFormData] = useState(initialValues)
  const canChangeEngineer = accessLevel === 'Admin'
  const visibleStatuses = isEditing ? statusOptions : addStatusOptions

  const updateField = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }))
  }

  const handleEngineerChange = (memberId) => {
    const member = teamMembers.find((teamMember) => teamMember.id === memberId)

    setFormData((currentData) => ({
      ...currentData,
      engineerId: member?.id || '',
      engineerName: member?.name || '',
      role: formatRole(member),
    }))
  }

  const handleDeviceChange = (deviceId) => {
    const device = devices.find((networkDevice) => networkDevice.id === deviceId)

    setFormData((currentData) => ({
      ...currentData,
      deviceId: device?.id || '',
      deviceServer: device?.name || '',
      ipAddress: device?.ipAddress || '',
      siteBranch: device?.siteBranch || '',
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(formData)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="log-modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{isEditing ? 'Update record' : 'New record'}</p>
            <h2 id="log-modal-title">{isEditing ? 'Edit Network Log' : 'Add Network Log'}</h2>
          </div>
          <button
            type="button"
            className="icon-button quiet"
            onClick={onClose}
            title="Close"
            disabled={isSaving}
          >
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <form className="log-form" onSubmit={handleSubmit}>
          <label>
            Engineer Name
            {canChangeEngineer ? (
              <select
                required
                value={formData.engineerId || ''}
                onChange={(event) => handleEngineerChange(event.target.value)}
              >
                <option value="">Select engineer</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            ) : (
              <input required value={formData.engineerName} readOnly />
            )}
          </label>

          <label>
            Role
            <input
              required
              value={formData.role}
              readOnly
              placeholder="Auto-filled from engineer"
            />
          </label>

          <label>
            Site / Branch
            <input
              required
              value={formData.siteBranch}
              readOnly
              placeholder="Auto-filled from device"
            />
          </label>

          <label>
            Device / Server
            <select
              required
              value={formData.deviceId || ''}
              onChange={(event) => handleDeviceChange(event.target.value)}
            >
              <option value="">Select device</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            IP Address
            <input
              required
              inputMode="decimal"
              value={formData.ipAddress}
              readOnly
              placeholder="Auto-filled from device"
            />
          </label>

          <label>
            Activity Type
            <select
              value={formData.activityType}
              onChange={(event) => updateField('activityType', event.target.value)}
            >
              <option value="">Select activity</option>
              {activityTypes.map((activity) => (
                <option key={activity.id} value={activity.name}>
                  {activity.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={formData.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              {visibleStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="full-span">
            Remarks
            <textarea
              required
              rows="4"
              value={formData.remarks}
              onChange={(event) => updateField('remarks', event.target.value)}
              placeholder="Add concise operational notes"
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Log'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default LogModal
