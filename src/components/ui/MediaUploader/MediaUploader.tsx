'use client';

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/cn';
import styles from './MediaUploader.module.scss';

export interface UploadedMedia {
  url: string;
  kind: 'image' | 'video';
  mimeType: string;
  size: number;
}

interface MediaUploaderProps {
  /** Accept images, videos, or both (default). */
  accept?: 'image' | 'video' | 'both';
  /** Allow multiple files in a single pick (default true). */
  multiple?: boolean;
  /** Friendly label above the drop zone. */
  label?: string;
  /** Helper text below the label. */
  hint?: string;
  /** Disable picking — e.g. when the parent says "already at the cap". */
  disabled?: boolean;
  /** Resolved when at least one file successfully uploads. */
  onUploaded: (uploaded: UploadedMedia[]) => void;
}

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

/** State of a single in-flight upload row. */
interface PendingRow {
  id: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  message?: string;
  progress?: number;
}

/**
 * MediaUploader — drag-and-drop or click-to-pick image/video uploader.
 * POSTs each file to /media/upload with the user's access token, then
 * forwards the resolved URLs to the parent via onUploaded.
 */
export function MediaUploader({
  accept = 'both',
  multiple = true,
  label = 'Drop files or browse',
  hint,
  disabled,
  onUploaded,
}: MediaUploaderProps) {
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [over, setOver] = useState(false);

  const acceptAttr =
    accept === 'image'
      ? IMAGE_MIMES.join(',')
      : accept === 'video'
        ? VIDEO_MIMES.join(',')
        : [...IMAGE_MIMES, ...VIDEO_MIMES].join(',');

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!accessToken) {
        setRows((prev) => [
          {
            id: 'no-auth',
            name: '',
            status: 'error',
            message: 'Sign in to upload files.',
          },
          ...prev,
        ]);
        return;
      }

      const accepted = files.filter((f) => {
        if (accept === 'image') return IMAGE_MIMES.includes(f.type);
        if (accept === 'video') return VIDEO_MIMES.includes(f.type);
        return IMAGE_MIMES.includes(f.type) || VIDEO_MIMES.includes(f.type);
      });
      if (accepted.length === 0) return;

      /* Track each upload in its own row so users see per-file progress. */
      const taskRows: PendingRow[] = accepted.map((f) => ({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        status: 'uploading',
        progress: 0,
      }));
      setRows((prev) => [...taskRows, ...prev]);

      const succeeded: UploadedMedia[] = [];

      await Promise.all(
        accepted.map(async (file, i) => {
          const row = taskRows[i]!;
          try {
            const uploaded = await uploadFile(file, accessToken, (pct) => {
              setRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, progress: pct } : r)),
              );
            });
            succeeded.push(uploaded);
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id ? { ...r, status: 'done', progress: 100 } : r,
              ),
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, status: 'error', message } : r)),
            );
          }
        }),
      );

      if (succeeded.length > 0) onUploaded(succeeded);
    },
    [accept, accessToken, onUploaded],
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length > 0) void handleFiles(files);
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled) setOver(true);
  };
  const onDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(false);
  };
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) void handleFiles(files);
  };

  return (
    <div className={styles.root}>
      <label
        htmlFor={inputId}
        className={cn(
          styles.dropzone,
          over && styles.dropzoneOver,
          disabled && styles.dropzoneDisabled,
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className={styles.dropzoneIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              d="M12 16V4M12 4l-5 5M12 4l5 5M4 20h16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={styles.dropzoneLabel}>{label}</span>
        {hint ? <span className={styles.dropzoneHint}>{hint}</span> : null}
        <input
          ref={fileInput}
          id={inputId}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          disabled={disabled}
          className={styles.fileInput}
          onChange={onChange}
        />
      </label>

      {rows.length > 0 ? (
        <ul className={styles.list}>
          {rows.map((row) => (
            <li key={row.id} className={cn(styles.row, styles[`row_${row.status}`])}>
              <span className={styles.rowName}>{row.name || row.message}</span>
              <span className={styles.rowMeta}>
                {row.status === 'uploading'
                  ? `${row.progress ?? 0}%`
                  : row.status === 'done'
                    ? 'Uploaded'
                    : row.message}
              </span>
              {row.status === 'uploading' ? (
                <span
                  className={styles.rowBar}
                  style={{ inlineSize: `${row.progress ?? 0}%` }}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ─── XHR upload — gives us progress events fetch can't ───────────────── */
function uploadFile(
  file: File,
  token: string,
  onProgress: (pct: number) => void,
): Promise<UploadedMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/media/upload`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as {
            data: UploadedMedia;
          };
          resolve(json.data);
        } catch {
          reject(new Error('Bad server response'));
        }
      } else {
        try {
          const json = JSON.parse(xhr.responseText) as {
            error?: { message?: string };
          };
          reject(new Error(json.error?.message ?? 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));

    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}
