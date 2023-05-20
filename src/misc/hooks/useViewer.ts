import { useViewerStore } from 'store/viewer'

export function useViewer() {
  const { viewer } = useViewerStore()

  if (!viewer) {
    throw new Error('useViewer был вызван при отсутствии viewer')
  }

  return viewer
}
