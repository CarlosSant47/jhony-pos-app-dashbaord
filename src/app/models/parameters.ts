export type ParameterDataType = 'STRING' | 'BOOLEAN' | 'JSON' | 'INTEGER' | 'FLOAT';

export interface ApplicationRecord {
  id: string;
  key: string;
  description: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

/** Body for POST / PUT /v1/applications (shape assumed; adjust to the backend contract). */
export interface ApplicationPayload {
  key: string;
  description: string;
  active: boolean;
}

/** Item returned by GET /v1/data-types. Only `id` and the type name are relied upon. */
export interface DataTypeRecord {
  id: string;
  name?: string;
  key?: string;
  code?: string;
  dataType?: string;
}

export interface ParameterRecord {
  id: string;
  applicationId: string;
  applicationKey: string;
  dataTypeId: string;
  dataType: ParameterDataType;
  key: string;
  value: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

/** Body for POST / PUT /v1/applications/{id}/parameters. `value` is always a string. */
export interface ParameterPayload {
  applicationId: string;
  dataTypeId: string;
  key: string;
  value: string;
  description: string;
}

/** Normalized upper-case type name of a data-type record (e.g. 'JSON'). */
export const dataTypeName = (t: DataTypeRecord): string =>
  (t.name ?? t.key ?? t.code ?? t.dataType ?? '').toUpperCase();
