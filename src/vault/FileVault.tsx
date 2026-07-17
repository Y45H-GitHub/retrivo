import { useState } from 'react';
import { File, FolderOpen, Plus } from '@phosphor-icons/react';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { EmptyState } from '../shared/ui/EmptyState';
import { Collapsible } from '../shared/ui/Collapsible';
import { InlineConfirm } from '../shared/ui/InlineConfirm';
import { ipc } from '../shared/ipc-client';
import type { FileRef } from '../shared/types';

interface FileVaultProps {
  profileId: string;
  files: FileRef[];
  onChanged: () => Promise<void>;
}

export function FileVault({ profileId, files, onChanged }: FileVaultProps) {
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  async function handlePick() {
    const path = await ipc.pickFile();
    if (!path) return;
    setPendingPath(path);
    const base = path.split(/[\\/]/).pop() ?? path;
    setLabel(base);
  }

  async function handleConfirm() {
    if (!pendingPath || !label.trim()) return;
    await ipc.addFile(profileId, label.trim(), pendingPath);
    setPendingPath(null);
    setLabel('');
    await onChanged();
  }

  async function handleDelete(fileId: string) {
    await ipc.deleteFile(fileId);
    await onChanged();
  }

  return (
    <Collapsible
      className="mt-6"
      trigger={
        <div className="flex items-center gap-2">
          <FolderOpen weight="regular" className="h-4 w-4 text-ink-muted" />
          <h3 className="text-caption font-semibold uppercase tracking-wide text-ink-muted">Files</h3>
          <span className="ml-1 rounded-full bg-hover px-1.5 py-0.5 text-caption text-ink-muted">{files.length}</span>
        </div>
      }
    >
      <div className="mb-2 flex justify-end">
        <Button variant="ghost" size="sm" onClick={handlePick}>
          <Plus weight="regular" className="h-3.5 w-3.5" /> Add file
        </Button>
      </div>

      {pendingPath && (
        <div className="mb-3 flex items-center gap-2 rounded-card border border-stroke bg-card p-2 shadow-elevation-1">
          <Input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label for this file"
            onKeyDown={(e) => e.key === 'Enter' && void handleConfirm()}
          />
          <Button size="sm" onClick={handleConfirm} disabled={!label.trim()}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPendingPath(null)}>
            Cancel
          </Button>
        </div>
      )}

      {files.length === 0 && !pendingPath ? (
        <div className="rounded-card border border-dashed border-stroke">
          <EmptyState
            icon={FolderOpen}
            title="No files yet"
            description="Keep shortcuts to documents you upload often — photos, ID scans, signatures."
          />
        </div>
      ) : (
        files.length > 0 && (
          <div className="overflow-hidden rounded-card border border-stroke bg-card shadow-elevation-1">
            {files.map((file, i) => (
              <div
                key={file.id}
                className={
                  'group flex items-center gap-2.5 px-3 py-2 transition-colors duration-fast hover:bg-hover' +
                  (i < files.length - 1 ? ' border-b border-stroke-subtle' : '')
                }
              >
                <File weight="regular" className="h-4 w-4 shrink-0 text-ink-muted" />
                <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">{file.label}</span>
                <span className="max-w-[45%] truncate font-mono text-caption text-ink-muted">{file.filePath}</span>
                <div className="opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-within:opacity-100">
                  <InlineConfirm triggerAriaLabel={`Remove ${file.label}`} onConfirm={() => void handleDelete(file.id)} />
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Collapsible>
  );
}
