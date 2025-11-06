export type PhotoType = "cook" | "mixture" | "field";
export type PhotoName = "moisture_photo" | "start_photo";

export type NormalizedPhoto = {
  id: string;
  source: "cooks" | "mixtures" | "fields";
  type: PhotoType;
  name?: PhotoName | string;
  fileId: string;
  fileUrl?: string;
  projectId?: string | number;
  company?: string | number;
  dateCreated?: string;
  commentField?: string; // which field to edit on backend for this record
};

// Placeholder mapping for field keys: update these to match your Directus schema
export const COLLECTION_FIELD_MAP = {
  cooks: {
    file: "photo",
    comment: "cook_comment",
    projectId: "project_id",
    company: "company",
    name: "name",
    dateCreated: "date_created",
    type: "type",
  },
  mixtures: {
    file: "photo",
    comment: "mixture_comment",
    projectId: "project_id",
    company: "company",
    name: "name",
    dateCreated: "date_created",
    type: "type",
  },
  fields: {
    file: "photo",
    comment: "field_comment",
    projectId: "project_id",
    company: "company",
    name: "name",
    dateCreated: "date_created",
    type: "type",
  },
} as const;
