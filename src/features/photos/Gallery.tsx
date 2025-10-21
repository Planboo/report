import { useEffect, useMemo, useState } from 'react';
import { bulkUpdateComments, fetchFileUrls, fetchPhotos } from './api';
import type { NormalizedPhoto } from './types';
import type { PhotoFilters } from './api';

export function Gallery() {
  const [photos, setPhotos] = useState<NormalizedPhoto[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await fetchPhotos({} as PhotoFilters);
        const fileMap = await fetchFileUrls(result.map((r) => r.fileId));
        setPhotos(result.map((r) => ({ ...r, fileUrl: fileMap[r.fileId] })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedItems = useMemo(() => photos.filter((p) => selected[p.source + ':' + p.id]), [photos, selected]);

  async function applyComment() {
    await bulkUpdateComments(
      selectedItems.map((p) => ({ id: p.id, source: p.source, commentField: p.commentField })),
      comment
    );
    setComment('');
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={selectedItems.length ? `Set comment for ${selectedItems.length} items` : 'Select photos to comment'}
          style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', minWidth: 280 }}
        />
        <button onClick={applyComment} disabled={!selectedItems.length || !comment}
          style={{ background: '#111827', color: 'white', border: 0, borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
          Apply Comment
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {photos.map((p) => {
          const key = p.source + ':' + p.id;
          const isSel = !!selected[key];
          return (
            <button key={key} onClick={() => setSelected((s) => ({ ...s, [key]: !s[key] }))}
              style={{
                display: 'grid', gap: 8, textAlign: 'left', background: '#fff', borderRadius: 10, border: isSel ? '2px solid #6366f1' : '1px solid #e5e7eb', padding: 8
              }}>
              <div style={{
                background: '#f3f4f6', height: 120, borderRadius: 8, overflow: 'hidden', display: 'grid', placeItems: 'center'
              }}>
                {p.fileUrl ? (
                  <img src={p.fileUrl} alt={p.name || 'photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>No preview</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#374151' }}>
                <div>{p.type} • {p.name || '—'}</div>
                <div style={{ color: '#6b7280' }}>{p.projectId || ''}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Gallery;

