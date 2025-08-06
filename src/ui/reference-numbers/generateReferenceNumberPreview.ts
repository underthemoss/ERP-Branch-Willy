interface GenerateReferenceNumberPreviewOptions {
  template: string;
  seqPadding?: number;
  startAt?: number;
  projectCode?: string;
  parentProjectCode?: string;
}

export function generateReferenceNumberPreview({
  template,
  seqPadding = 4,
  startAt = 1,
  projectCode,
  parentProjectCode,
}: GenerateReferenceNumberPreviewOptions): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Generate sequence number with padding
  const seqStr = String(startAt).padStart(seqPadding, "0");

  // Replace template tokens with individual date segments and project codes
  return template
    .replace(/\{YYYY\}/g, String(year))
    .replace(/\{YY\}/g, String(year).slice(-2))
    .replace(/\{MM\}/g, month)
    .replace(/\{DD\}/g, day)
    .replace(/\{seq\}/g, seqStr)
    .replace(/\{projectCode\}/g, projectCode || "PROJECT123")
    .replace(/\{parentProjectCode\}/g, parentProjectCode || "PARENT456");
}
