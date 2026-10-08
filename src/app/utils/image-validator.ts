export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 4096;

const ALLOWED = [
  { mime: 'image/jpeg', ext: ['jpg', 'jpeg'] },
  { mime: 'image/png', ext: ['png'] },
  { mime: 'image/webp', ext: ['webp'] },
  { mime: 'image/gif', ext: ['gif'] }
];

/** Detects the real image type from the file's magic bytes (ignores name and declared MIME). */
function sniffMime(b: Uint8Array): string | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG' && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  if (ascii(0, 4) === 'GIF8' && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/**
 * Client-side checks for an avatar upload. Returns an error message, or '' when the file is valid.
 * Checks: size, extension, declared MIME, magic bytes (must agree with both) and that the browser
 * can actually decode it as an image. SVG and any other format are rejected.
 * This does not replace server-side validation, which must repeat these checks.
 */
export async function validateImageFile(file: File): Promise<string> {
  if (file.size === 0) return 'El archivo está vacío.';
  if (file.size > IMAGE_MAX_BYTES) return `La imagen no debe pesar más de ${IMAGE_MAX_BYTES / 1024 / 1024} MB.`;

  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  const allowed = ALLOWED.find(a => a.ext.includes(ext));
  if (!allowed) return 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.';
  if (file.type !== allowed.mime) return 'El tipo del archivo no coincide con su extensión.';

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (sniffMime(head) !== allowed.mime) return 'El contenido del archivo no es una imagen válida.';

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    if (width < 1 || height < 1) return 'La imagen no es válida.';
    if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
      return `Las dimensiones no deben superar ${IMAGE_MAX_DIMENSION}×${IMAGE_MAX_DIMENSION} px.`;
    }
  } catch {
    return 'No se pudo leer la imagen; el archivo está dañado o no es una imagen.';
  }
  return '';
}
