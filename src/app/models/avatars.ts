/** Avatar as returned by GET /v1/avatars. */
export interface AvatarRecord {
  id: string;
  s3ResourceId: string;
  url: string;
  createdBy: string;
  createdAt: string;
}
