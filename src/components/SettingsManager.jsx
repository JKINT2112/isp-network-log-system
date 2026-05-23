import { Pencil, Plus, Trash2 } from 'lucide-react'
import { deviceTypeOptions, roleOptions } from '../data/sampleConfig'

const emptyMember = { name: '', role: 'Network Engineer', status: 'Active' }
const emptyDevice = {
  name: '',
  type: 'Router',
  ipAddress: '',
  siteBranch: '',
  status: 'Active',
}
const emptyActivity = { name: '', status: 'Active' }

function SettingsManager({
  teamMembers,
  devices,
  activityTypes,
  editingConfig,
  onStartConfigEdit,
  onCancelConfigEdit,
  onSaveMember,
  onSaveDevice,
  onSaveActivity,
  onDeleteMember,
  onDeleteDevice,
  onDeleteActivity,
}) {
  const editingMember = editingConfig.type === 'member' ? editingConfig.item : null
  const editingDevice = editingConfig.type === 'device' ? editingConfig.item : null
  const editingActivity =
    editingConfig.type === 'activity' ? editingConfig.item : null

  return (
    <section className="content-section" aria-labelledby="settings-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1 id="settings-title">System configuration</h1>
        </div>
      </div>

      <ConfigModule
        title="Team Members"
        description="Manage engineers and system users available when creating logs."
        fields={[
          { name: 'name', label: 'Name' },
          { name: 'role', label: 'Role', type: 'select', options: roleOptions },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: ['Active', 'Inactive'],
          },
        ]}
        emptyItem={emptyMember}
        editItem={editingMember}
        items={teamMembers}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'status', label: 'Status', badge: true },
        ]}
        onAdd={(item) => onSaveMember(item)}
        onUpdate={(item) => onSaveMember(item)}
        onEdit={(item) => onStartConfigEdit('member', item)}
        onDelete={onDeleteMember}
        onCancelEdit={onCancelConfigEdit}
      />

      <ConfigModule
        title="Devices / Servers / OLT"
        description="Maintain active network equipment used by the log form."
        fields={[
          { name: 'name', label: 'Device Name' },
          {
            name: 'type',
            label: 'Device Type',
            type: 'select',
            options: deviceTypeOptions,
          },
          { name: 'ipAddress', label: 'IP Address' },
          { name: 'siteBranch', label: 'Site / Branch' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: ['Active', 'Inactive'],
          },
        ]}
        emptyItem={emptyDevice}
        editItem={editingDevice}
        items={devices}
        columns={[
          { key: 'name', label: 'Device Name' },
          { key: 'type', label: 'Type' },
          { key: 'ipAddress', label: 'IP Address' },
          { key: 'siteBranch', label: 'Site / Branch' },
          { key: 'status', label: 'Status', badge: true },
        ]}
        onAdd={(item) => onSaveDevice(item)}
        onUpdate={(item) => onSaveDevice(item)}
        onEdit={(item) => onStartConfigEdit('device', item)}
        onDelete={onDeleteDevice}
        onCancelEdit={onCancelConfigEdit}
      />

      <ConfigModule
        title="Activity Types"
        description="Control the activity options shown in the Add Log workflow."
        fields={[
          { name: 'name', label: 'Activity Name' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: ['Active', 'Inactive'],
          },
        ]}
        emptyItem={emptyActivity}
        editItem={editingActivity}
        items={activityTypes}
        columns={[
          { key: 'name', label: 'Activity Name' },
          { key: 'status', label: 'Status', badge: true },
        ]}
        onAdd={(item) => onSaveActivity(item)}
        onUpdate={(item) => onSaveActivity(item)}
        onEdit={(item) => onStartConfigEdit('activity', item)}
        onDelete={onDeleteActivity}
        onCancelEdit={onCancelConfigEdit}
      />
    </section>
  )
}

function ConfigModule({
  title,
  description,
  fields,
  emptyItem,
  editItem,
  items,
  columns,
  onAdd,
  onUpdate,
  onEdit,
  onDelete,
  onCancelEdit,
}) {
  const formId = `config-${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`
  const formValue = editItem || emptyItem

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData)

    const nextItem = editItem ? { ...editItem, ...data } : data

    if (editItem) {
      onUpdate(nextItem)
      return
    }

    onAdd(nextItem)
    event.currentTarget.reset()
  }

  return (
    <article className="config-module">
      <div className="config-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <form
        className="config-form"
        id={formId}
        key={editItem?.id || `${formId}-new`}
        onSubmit={handleSubmit}
      >
        {fields.map((field) => (
          <label key={field.name}>
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

        <div className="config-actions">
          {editItem && (
            <button type="button" className="secondary-button" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
          <button type="submit" className="primary-button">
            <Plus size={16} aria-hidden="true" />
            {editItem ? 'Save Changes' : `Add ${title.replaceAll(' / ', ' ')}`}
          </button>
        </div>
      </form>

      <div className="config-list">
        {items.map((item) => (
          <div className="config-row" key={item.id}>
            {columns.map((column) => (
              <div key={column.key}>
                <span className="user-label">{column.label}</span>
                {column.badge ? (
                  <span className={`user-status ${item[column.key].toLowerCase()}`}>
                    {item[column.key]}
                  </span>
                ) : (
                  <strong>{item[column.key]}</strong>
                )}
              </div>
            ))}
            <div className="row-actions">
              <button
                type="button"
                className="table-icon-button"
                onClick={() => onEdit(item)}
                title={`Edit ${title}`}
              >
                <Pencil size={16} aria-hidden="true" />
                <span className="sr-only">Edit {title}</span>
              </button>
              <button
                type="button"
                className="table-icon-button danger"
                onClick={() => onDelete(item)}
                title={`Delete ${title}`}
              >
                <Trash2 size={16} aria-hidden="true" />
                <span className="sr-only">Delete {title}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

export default SettingsManager
