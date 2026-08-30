import { onBeforeMount } from 'vue'

export default function useDebounce(): { call: (callback: () => void) => void } {
  let timer: any = null

  const call = (callback: () => void): void => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      callback()
    }, 500)
  }

  onBeforeMount(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })

  return { call }
}
