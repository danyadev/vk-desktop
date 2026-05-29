export function isPhotoFile(file: File) {
  return ['image/png', 'image/jpeg', 'image/gif'].includes(file.type)
}
