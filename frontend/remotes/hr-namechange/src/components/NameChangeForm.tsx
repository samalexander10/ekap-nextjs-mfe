import React, { useState, useRef } from 'react';
import { submitNameChange } from '../services/nameChangeService';

interface Props {
  onComplete: (requestId: string) => void;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const CURRENT_NAME = 'Jane Smith';

const DOC_TYPES = [
  { value: '', label: 'Select document type...' },
  { value: 'Marriage Certificate', label: 'Marriage Certificate' },
  { value: 'Court Order', label: 'Court Order' },
  { value: 'Affidavit', label: 'Notarized Affidavit' },
];

const s: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 14, outline: 'none', backgroundColor: '#fff', width: '100%',
  },
  inputReadOnly: {
    padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e7eb',
    fontSize: 14, backgroundColor: '#f9fafb', color: '#6b7280', width: '100%',
  },
  select: {
    padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 14, backgroundColor: '#fff', width: '100%',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '20px',
    paddingRight: 36, appearance: 'none',
  },
  uploadZone: {
    border: '2px dashed #93c5fd', borderRadius: 8, padding: '20px 16px',
    textAlign: 'center', cursor: 'pointer', backgroundColor: '#eff6ff',
    color: '#3b82f6', fontSize: 14,
  },
  uploadZoneActive: {
    border: '2px dashed #3b82f6', borderRadius: 8, padding: '20px 16px',
    textAlign: 'center', cursor: 'pointer', backgroundColor: '#dbeafe',
    color: '#1d4ed8', fontSize: 14,
  },
  preview: {
    marginTop: 8, borderRadius: 8, border: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
    backgroundColor: '#f9fafb',
  },
  previewImg: { width: 64, height: 64, objectFit: 'cover', borderRadius: 6, flexShrink: 0 },
  previewFileBadge: {
    width: 64, height: 64, borderRadius: 6, backgroundColor: '#e0e7ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#4f46e5', flexShrink: 0,
  },
  previewMeta: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 },
  previewName: { fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewSize: { fontSize: 12, color: '#6b7280' },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#9ca3af', fontSize: 20, padding: '2px 6px', lineHeight: 1, flexShrink: 0,
  },
  submitBtn: {
    padding: '12px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
    backgroundColor: '#1e3a5f', color: '#fff', fontWeight: 700, fontSize: 15,
    width: '100%', marginTop: 4,
  },
  submitBtnDisabled: {
    padding: '12px 20px', borderRadius: 8, border: 'none',
    backgroundColor: '#9ca3af', color: '#fff', fontWeight: 700, fontSize: 15,
    cursor: 'not-allowed', width: '100%', marginTop: 4,
  },
  successCard: {
    borderRadius: 10, border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4',
    padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  successTitle: { fontSize: 16, fontWeight: 700, color: '#15803d', margin: 0 },
  successBody: { fontSize: 14, color: '#166534', margin: 0 },
  successId: {
    backgroundColor: '#dcfce7', borderRadius: 6, padding: '6px 12px',
    fontFamily: 'monospace', fontSize: 13, color: '#14532d', fontWeight: 600,
    display: 'inline-block',
  },
  successNote: { fontSize: 12, color: '#4b7c5a', margin: 0 },
  errorCard: {
    borderRadius: 10, border: '1px solid #fecaca', backgroundColor: '#fef2f2',
    padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8,
  },
  errorTitle: { fontSize: 14, fontWeight: 700, color: '#dc2626', margin: 0 },
  errorBody: { fontSize: 13, color: '#7f1d1d', margin: 0 },
  retryBtn: {
    alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 6, border: 'none',
    backgroundColor: '#dc2626', color: '#fff', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', marginTop: 4,
  },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  required: { color: '#dc2626' },
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getExt(name: string): string {
  return name.split('.').pop()?.toUpperCase() ?? 'FILE';
}

export const NameChangeForm: React.FC<Props> = ({ onComplete }) => {
  const [newLastName, setNewLastName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [requestId, setRequestId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadHover, setUploadHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadHover(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canSubmit = newLastName.trim().length > 0 && documentType !== '' && file !== null && status !== 'submitting';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setStatus('submitting');
    try {
      const result = await submitNameChange(CURRENT_NAME, newLastName.trim(), documentType, file);
      setRequestId(result.id);
      setStatus('success');
      setTimeout(() => onComplete(result.id), 2000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={s.successCard}>
        <p style={s.successTitle}>Request Submitted Successfully</p>
        <p style={s.successBody}>
          Your legal name change request has been received. HR will process it within 3–5 business days
          and you will receive a confirmation email.
        </p>
        <span style={s.successId}>Request ID: {requestId}</span>
        <p style={s.successNote}>Keep this ID for your records. You will be redirected shortly.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={s.errorCard}>
        <p style={s.errorTitle}>Submission Failed</p>
        <p style={s.errorBody}>{errorMsg}</p>
        <button style={s.retryBtn} onClick={() => { setStatus('idle'); setErrorMsg(''); }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form style={s.form} onSubmit={handleSubmit} noValidate>
      {/* Current name — read-only */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Current Legal Name</label>
        <input style={s.inputReadOnly} value={CURRENT_NAME} readOnly />
        <span style={s.hint}>Your name currently on file — contact HR if this is incorrect</span>
      </div>

      {/* New last name */}
      <div style={s.fieldGroup}>
        <label style={s.label}>New Last Name <span style={s.required}>*</span></label>
        <input
          style={s.input}
          type="text"
          placeholder="Enter your new last name"
          value={newLastName}
          onChange={e => setNewLastName(e.target.value)}
          autoComplete="family-name"
          disabled={status === 'submitting'}
        />
      </div>

      {/* Document type */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Supporting Document Type <span style={s.required}>*</span></label>
        <select
          style={s.select}
          value={documentType}
          onChange={e => setDocumentType(e.target.value)}
          disabled={status === 'submitting'}
        >
          {DOC_TYPES.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* File upload */}
      <div style={s.fieldGroup}>
        <label style={s.label}>Upload Document <span style={s.required}>*</span></label>
        {!file ? (
          <div
            style={uploadHover ? s.uploadZoneActive : s.uploadZone}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setUploadHover(true); }}
            onDragLeave={() => setUploadHover(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            aria-label="Click or drag to upload supporting document"
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
            <div style={{ fontWeight: 600 }}>Click to browse or drag and drop</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>JPEG, PNG, or PDF — max 10 MB</div>
          </div>
        ) : (
          <div style={s.preview}>
            {previewUrl ? (
              <img src={previewUrl} alt="Document preview" style={s.previewImg} />
            ) : (
              <div style={s.previewFileBadge}>{getExt(file.name)}</div>
            )}
            <div style={s.previewMeta}>
              <span style={s.previewName} title={file.name}>{file.name}</span>
              <span style={s.previewSize}>{formatBytes(file.size)}</span>
            </div>
            <button type="button" style={s.removeBtn} onClick={removeFile} aria-label="Remove file">
              ×
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <span style={s.hint}>Accepted: Marriage Certificate, Court Order, or Notarized Affidavit</span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        style={canSubmit ? s.submitBtn : s.submitBtnDisabled}
        disabled={!canSubmit}
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Name Change Request'}
      </button>
    </form>
  );
};
