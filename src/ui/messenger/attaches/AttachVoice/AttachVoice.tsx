import { computed, defineComponent, InputEvent, onUnmounted, shallowRef } from 'vue'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import { useEnv } from 'hooks'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon16Text, Icon20ChevronUp, Icon32PauseCircle, Icon32PlayCircle } from 'assets/icons'
import './AttachVoice.css'

type Props = {
  voice: Attach.Voice
  message?: Message.Message | Message.Foreign
}

export const AttachVoice = defineComponent<Props>((props) => {
  const { lang, api } = useEnv()

  const audio = new Audio(props.voice.linkMp3)
  const isPlaying = shallowRef(false)
  const isDraggingProgress = shallowRef(false)
  const progress = shallowRef(0)
  const time = shallowRef(formatTime(props.voice.duration))
  const showTranscript = shallowRef(false)
  let rAFId = 0

  const transcriptNotReadyStatus = computed(() => {
    if (props.voice.transcriptState === 'error') {
      return lang.use('me_voice_transcription_error')
    }

    if (props.voice.transcriptState === 'in_progress') {
      return lang.use('me_voice_transcription_in_progress')
    }

    if (!props.voice.transcript) {
      return lang.use('me_voice_transcript_empty')
    }
  })

  const onRangeChange = (event: InputEvent<HTMLInputElement>) => {
    audio.pause()
    audio.currentTime = (+event.target.value / 100) * props.voice.duration
    progress.value = audio.currentTime / props.voice.duration
    audio.play()
  }

  const updateProgress = () => {
    if (!isDraggingProgress.value) {
      progress.value = audio.currentTime / props.voice.duration
    }

    rAFId = requestAnimationFrame(updateProgress)
  }

  const togglePlay = () => {
    if (isPlaying.value) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const markAsListened = () => {
    if (props.voice.wasListened) {
      return
    }

    if (!props.message?.peerId || !props.message.cmid || props.message.isOut) {
      return
    }

    props.voice.wasListened = true

    api.fetch('messages.markAsPlayed', {
      peer_id: props.message.peerId,
      cmid: props.message.cmid
    })
  }

  audio.addEventListener('play', () => {
    markAsListened()

    isPlaying.value = true
    rAFId = requestAnimationFrame(updateProgress)
  })

  audio.addEventListener('pause', () => {
    isPlaying.value = false
    cancelAnimationFrame(rAFId)
  })

  audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime === 0 ? props.voice.duration : audio.currentTime
    time.value = formatTime(currentTime)
  })

  audio.addEventListener('ended', () => {
    if (!isDraggingProgress.value) {
      progress.value = 0
    }
  })

  onUnmounted(() => {
    audio.pause()
  })

  const inputElement = computed(() => (
    <input
      class="AttachVoice__range"
      type="range"
      step="0.1"
      value={progress.value * 100}
      min="0"
      max="100"
      onChange={(event) => onRangeChange(event)}
      onTouchstart={() => (isDraggingProgress.value = true)}
      onTouchend={() => (isDraggingProgress.value = false)}
      onMousedown={() => (isDraggingProgress.value = true)}
      onMouseup={() => (isDraggingProgress.value = false)}
    />
  ))

  return () => (
    <div class="AttachVoice">
      <div class="AttachVoice__player">
        <ButtonIcon
          class="AttachVoice__playButton"
          onClick={togglePlay}
          icon={
            isPlaying.value
              ? <Icon32PauseCircle withUnlistenedDot={!props.voice.wasListened} />
              : <Icon32PlayCircle withUnlistenedDot={!props.voice.wasListened} />
          }
        />

        <div class="AttachVoice__track">
          {inputElement.value}
          <span class="AttachVoice__time">{time.value}</span>
        </div>
        <ButtonIcon
          class="AttachVoice__toggleTranscription"
          shiftOnClick
          icon={showTranscript.value ? <Icon20ChevronUp /> : <Icon16Text />}
          onClick={() => (showTranscript.value = !showTranscript.value)}
        />
      </div>
      {showTranscript.value && (
        <div
          class={['AttachVoice__transcript', {
            'AttachVoice__transcript--notReady': transcriptNotReadyStatus.value
          }]}
        >
          {transcriptNotReadyStatus.value ?? props.voice.transcript}
        </div>
      )}
    </div>
  )
}, {
  props: ['voice', 'message']
})

const formatTime = (seconds: number) => {
  const date = new Date()
  date.setMinutes(0, seconds)
  return date.getMinutes() + ':' + String(date.getSeconds()).padStart(2, '0')
}
