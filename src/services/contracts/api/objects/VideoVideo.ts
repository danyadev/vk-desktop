export type VideoVideo = {
  type?: 'interactive' | 'video' | 'music_video' | 'movie' | 'live' | 'short_video' | 'story' | 'video_message'
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
}

export type VideoVideoFull = VideoVideo & {
  files?: { external?: string }
}

export type VideoVideoImage = {
  id?: string
  url: string
  width: number
  height: number
  theme?: 'light' | 'dark'
  with_padding?: 1
  size?: string
}
