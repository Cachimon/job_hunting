import { DialogConfigModel } from '@renderer/type'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const huntingStatus = ref('stop')
  const dialogConfigMap = ref<Map<string, DialogConfigModel>>(new Map())

  const changeHuntingStatus = (status: string): void => {
    huntingStatus.value = status
  }

  const showDialog = (config: DialogConfigModel): { close: () => void } => {
    const id = crypto.randomUUID()
    dialogConfigMap.value.set(id, config)

    return {
      close: () => {
        dialogConfigMap.value.delete(id)
      }
    }
  }

  const closeDialog = (id: string): void => {
    dialogConfigMap.value.delete(id)
  }

  return { huntingStatus, dialogConfigMap, changeHuntingStatus, showDialog, closeDialog }
})
