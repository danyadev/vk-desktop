// video_video (fields used by VK Desktop; see vk schema.zip)
export type VideoVideo = {
  id?: number
  owner_id?: number
  access_key?: string
  title?: string
  duration?: number
  width?: number
  height?: number
  image?: VideoVideoImage[]
  first_frame?: VideoVideoImage[]
  player?: string
  type?: 'interactive' | 'video' | 'music_video' | 'movie' | 'live' |
    'short_video' | 'story' | 'video_message'
}

// video_video_full has the same relevant common fields, plus full video files.
export type VideoVideoFull = VideoVideo & {
  files?: { external?: string }
}

// video_video_image
export type VideoVideoImage = {
  id?: string
  url: string
  width: number
  height: number
  theme?: 'light' | 'dark'
  with_padding?: 1
  size?: string
}
