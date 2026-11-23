import { BaseImage } from './BaseImage'

export type VideoVideo = {
  id?: number
  owner_id?: number
  access_key?: string
  title?: string
  duration?: number
  width?: number
  height?: number
  image?: BaseImage[]
  first_frame?: BaseImage[]
  player?: string
}
