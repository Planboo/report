import { directus } from '../../lib/directus';
import { readItems, readFiles, updateItems } from '@directus/sdk';
import { COLLECTION_FIELD_MAP } from './types';
import type { NormalizedPhoto, PhotoType } from './types';

export type PhotoFilters = {
  projectId?: string | number;
  company?: string | number;
  type?: PhotoType[];
  name?: string[];
  dateFrom?: string; // ISO
  dateTo?: string; // ISO
};

type DirectusFilter = Record<string, unknown>;

function buildFilter(collection: keyof typeof COLLECTION_FIELD_MAP, filters: PhotoFilters): DirectusFilter {
  const map = COLLECTION_FIELD_MAP[collection];
  const f: DirectusFilter = {};
  if (filters.projectId) f[map.projectId] = { _eq: filters.projectId };
  if (filters.company) f[map.company] = { _eq: filters.company };
  if (filters.type && filters.type.length) f[map.type] = { _in: filters.type };
  if (filters.name && filters.name.length) f[map.name] = { _in: filters.name };
  if (filters.dateFrom || filters.dateTo) {
    f[map.dateCreated] = {};
    if (filters.dateFrom) (f[map.dateCreated] as Record<string, unknown>)._gte = filters.dateFrom;
    if (filters.dateTo) (f[map.dateCreated] as Record<string, unknown>)._lte = filters.dateTo;
  }
  return f;
}

function normalize(collection: keyof typeof COLLECTION_FIELD_MAP, rows: Record<string, unknown>[]): NormalizedPhoto[] {
  const map = COLLECTION_FIELD_MAP[collection];
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    source: collection,
    type: String(row[map.type] ?? '') as PhotoType,
    name: row[map.name] ? String(row[map.name]) : undefined,
    fileId: String(row[map.file] ?? ''),
    projectId: row[map.projectId] ? String(row[map.projectId]) : undefined,
    company: row[map.company] ? String(row[map.company]) : undefined,
    dateCreated: row[map.dateCreated] ? String(row[map.dateCreated]) : undefined,
    commentField: map.comment,
  }));
}

export async function fetchPhotos(filters: PhotoFilters): Promise<NormalizedPhoto[]> {
  const [cooks, mixtures, fields] = await Promise.all([
    directus.request(
      readItems('cooks' as never, {
        filter: buildFilter('cooks', filters),
        fields: ['id', COLLECTION_FIELD_MAP.cooks.file, COLLECTION_FIELD_MAP.cooks.projectId, COLLECTION_FIELD_MAP.cooks.company, COLLECTION_FIELD_MAP.cooks.dateCreated, COLLECTION_FIELD_MAP.cooks.type, COLLECTION_FIELD_MAP.cooks.name],
        limit: 50,
        sort: ['-date_created'],
      } as never)
    ),
    directus.request(
      readItems('mixtures' as never, {
        filter: buildFilter('mixtures', filters),
        fields: ['id', COLLECTION_FIELD_MAP.mixtures.file, COLLECTION_FIELD_MAP.mixtures.projectId, COLLECTION_FIELD_MAP.mixtures.company, COLLECTION_FIELD_MAP.mixtures.dateCreated, COLLECTION_FIELD_MAP.mixtures.type, COLLECTION_FIELD_MAP.mixtures.name],
        limit: 50,
        sort: ['-date_created'],
      } as never)
    ),
    directus.request(
      readItems('fields' as never, {
        filter: buildFilter('fields', filters),
        fields: ['id', COLLECTION_FIELD_MAP.fields.file, COLLECTION_FIELD_MAP.fields.projectId, COLLECTION_FIELD_MAP.fields.company, COLLECTION_FIELD_MAP.fields.dateCreated, COLLECTION_FIELD_MAP.fields.type, COLLECTION_FIELD_MAP.fields.name],
        limit: 50,
        sort: ['-date_created'],
      } as never)
    ),
  ]);

  const normalized = [
    ...normalize('cooks', cooks as Record<string, unknown>[]),
    ...normalize('mixtures', mixtures as Record<string, unknown>[]),
    ...normalize('fields', fields as Record<string, unknown>[]),
  ];

  return normalized;
}

export async function fetchFileUrls(fileIds: string[]): Promise<Record<string, string>> {
  if (!fileIds.length) return {};
  const files = await directus.request(
    readFiles({
      filter: { id: { _in: fileIds } },
      fields: ['id', 'filename_disk'],
      limit: fileIds.length,
    } as never)
  );
  const map: Record<string, string> = {};
  for (const f of files as Record<string, unknown>[]) {
    map[String(f.id)] = `/assets/${f.id}`; // let Directus serve assets via base URL
  }
  return map;
}

export async function bulkUpdateComments(items: Array<Pick<NormalizedPhoto, 'id' | 'source' | 'commentField'>>, comment: string): Promise<void> {
  const groups = new Map<string, Array<{ id: string; field: string }>>();
  for (const item of items) {
    const key = item.source;
    const arr = groups.get(key) ?? [];
    arr.push({ id: item.id, field: item.commentField || 'comment' });
    groups.set(key, arr);
  }
  const promises: Promise<unknown>[] = [];
  for (const [collection, group] of groups.entries()) {
    const ids = group.map((g) => g.id);
    const field = group[0].field;
    promises.push(
      directus.request(updateItems(collection as never, ids, { [field]: comment } as never))
    );
  }
  await Promise.all(promises);
}
