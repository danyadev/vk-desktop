export type DocsDoc = {
  id: number
  owner_id: number
  access_key?: string
  title: string
  type: number
  ext: string
  url?: string
  preview?: {
    photo?: {
      sizes?: Array<{
        src: string
        width: number
        height: number
        type: string
      }>
    }
    video?: {
      src: string
      width: number
      height: number
      file_size: number
    }
  }
}
