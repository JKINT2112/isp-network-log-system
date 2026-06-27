import { useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { deviceTypeOptions } from '../data/sampleConfig'

const emptyDevice = {
  name: '',
  type: 'Router',
  ipAddress: '',
  siteBranch: '',
  status: 'Active',
}
const emptyActivity = { name: '', status: 'Active' }

const deviceFields = [
  { name: 'name', label: 'Device Name' },
  { name: 'type', label: 'Device Type', type: 'select', options: deviceTypeOptions },
  { name: 'ipAddress', label: 'IP Address' },
  { name: 'siteBranch', label: 'Site / Branch' },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
]

const activityFields = [
  { name: 'name', label: 'Activity Name' },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
]

const tabs = [
  { key: 'devices', label: 'Devices' },
  { key: 'activities', label: 'Activity Types' },
]

function SettingsManager({
  devices,
  activityTypes,
  onSaveDevice,
  onSaveActivity,
  onDeleteDevice,
  onDeleteActivity,
}) {
  const [activeTab, setActiveTab] = useState('devices')
  const [modal, setModal] = useState({ open: false, item: null })

  const isDevices = activeTab === 'devices'
  const items = isDevices ? devices : activityTypes
  const fields = isDevices ? deviceFields : activityFields
  const emptyItem = isDevices ? emptyDevice : emptyActivity
  const singular = isDevices ? 'Device' : 'Activity Type'

  const openAdd = () => setModal({ open: true, item: null })
  const openEdit = (item) => setModal({ open: true, item })
  const closeModal = () => setModal({ open: false, item: null })

  const handleSave = async (data) => {
    const save = isDevices ? onSaveDevice : onSaveActivity
    await save(data)
    closeModal()
  }

  const handleDelete = (item) => {
    if (isDevices) {
      onDeleteDevice(item)
    } else {
      onDeleteActivity(item)
    }
  }

  return (
    <section className="content-section" aria-labelledby="settings-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1 id="settings-title">System configuration</h1>
        </div>
      </div>

      <div className="settings-tabs" role="tablist">
        {tabs.map((tab) => {
          const count = tab.key === 'devices' ? devices.length : activityTypes.length
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={activeTab === tab.key ? 'settings-tab active' : 'settings-tab'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="settings-tab-count">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="settings-toolbar">
        <p className="settings-hint">
          {isDevices
            ? 'Network equipment available in the log form.'
            : 'Activity options shown in the Add Log workflow.'}
        </p>
        <button type="button" className="primary-button" onClick={openAdd}>
          <Plus size={16} aria-hidden="true" />
          Add {singular}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <strong>No {isDevices ? 'devices' : 'activity types'} yet</strong>
          <p>Add your first {singular.toLowerCase()} to get started.</p>
        </div>
      ) : (
        <div className="config-cards">
          {items.map((item) => (
            <article className="config-card" key={item.id}>
              <div className="config-card-info">
                <strong>{item.name}</strong>
                <span>
                  {isDevices
                    ? [item.type, item.ipAddress, item.siteBranch]
                        .filter(Boolean)
                        .join(' · ')
                    : 'Activity type'}
                </span>
              </div>
              <span className={`user-status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
              <div className="row-actions">
                <button
                  type="button"
                  className="table-icon-button"
                  onClick={() => openEdit(item)}
                  title={`Edit ${singular}`}
                >
                  <Pencil size={16} aria-hidden="true" />
                  <span className="sr-only">Edit {item.name}</span>
                </button>
                <button
                  type="button"
                  className="table-icon-button danger"
                  onClick={() => handleDelete(item)}
                  title={`Delete ${singular}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span className="sr-only">Delete {item.name}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal.open && (
        <ConfigModal
          title={singular}
          fields={fields}
          item={modal.item}
          emptyItem={emptyItem}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </section>
  )
}

function ConfigModal({ title, fields, item, emptyItem, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(item)
  const formValue = item || emptyItem

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData)
    const nextItem = item ? { ...item, ...data } : data

    setIsSaving(true)
    try {
      await onSave(nextItem)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="config-modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{isEditing ? 'Update' : 'New'}</p>
            <h2 id="config-modal-title">
              {isEditing ? `Edit ${title}` : `Add ${title}`}
            </h2>
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
          {fields.map((field) => (
            <label key={field.name} className="full-span">
              {field.label}
              {field.type === 'select' ? (
                <select name={field.name} defaultValue={formValue[field.name]} required>
                  {field.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  defaultValue={formValue[field.name]}
                  placeholder={field.label}
                  required
                />
              )}
            </label>
          ))}

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
              <Plus size={16} aria-hidden="true" />
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : `Add ${title}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default SettingsManager
