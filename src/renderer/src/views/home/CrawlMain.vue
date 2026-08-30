<template>
  <div class="home">
    <button
      v-if="appStore.huntingStatus === 'stop'"
      :class="`home-start-btn primary ${showingProcessData.length ? 'top-left' : 'middle'}`"
      @click="startHunting"
    >
      {{ showingProcessData.length ? '重新投递' : '开始投递' }}
    </button>
    <button v-else class="home-start-btn primary top-left" @click="stopHunting">停止投递</button>
    <div v-if="appStore.huntingStatus !== 'stop' || showingProcessData.length" style="height: 100%">
      <ul class="home-process-list">
        <li
          v-for="data in showingProcessData"
          :key="data.id"
          :class="`home-process-item ${data.type}`"
        >
          <span>【{{ TypeMap[data.type] }}】 {{ data.data }}</span>
        </li>
        <li v-if="appStore.huntingStatus !== 'stop'" :class="`home-process-item`">
          <span>【执行中...】</span>
        </li>
      </ul>
    </div>
    <div v-if="dialogShow" class="home-dialog">
      <div class="home-dialog-container">
        <span>
          请依次确认好以下内容，如已确认并操作完毕，请点击“<strong>确认</strong>”按钮。“取消”按钮则将<strong>停止当前投递操作</strong>。
        </span>
        <ul>
          <li>
            1.
            刚才已打开一个浏览器窗口，请确认是否正确加载BOSS直聘岗位列表页，如未正常加载，请<strong>刷新页面</strong>。
          </li>
          <li>2. 是否已经登录，如未登录，请先<strong>手动登录</strong>。</li>
        </ul>
        <footer>
          <button @click="onCancel">取消</button>
          <button class="primary" @click="onConfirm">确认</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { PyDataModel, SaveConfigRes } from '@shared/type'
import useDebounce from '@renderer/hooks/useDebounce'
import { useAppStore } from '@renderer/stores/appStore'

const TypeMap = {
  data: '过程数据',
  done: '已完成',
  error: '异常信息',
  exit: '程序退出'
}

const debounce = useDebounce()
const appStore = useAppStore()

const dialogShow = ref(false)
const processData = ref<PyDataModel[]>([])

const showingProcessData = computed(() => {
  return processData.value.filter((item) => item.type !== 'pending')
})

const dataHandler = (_, data: PyDataModel): void => {
  if (data.type === 'pending') {
    dialogShow.value = true
  }
  processData.value.push(data)
  if (data.type === 'done' || data.type === 'error' || data.type === 'exit') {
    appStore.changeHuntingStatus('stop')
  }
}

onMounted(async () => {
  window.electron.ipcRenderer.removeListener('PY_DATA', dataHandler)
  window.electron.ipcRenderer.on('PY_DATA', dataHandler)
  const silentData: PyDataModel[] = await window.electron.ipcRenderer.invoke('GET_SILENT_DATA')
  if (silentData.length && silentData[silentData.length - 1].type === 'pending') {
    dialogShow.value = true
  } else {
    processData.value = silentData
  }
})

const onCancel = (): void => {
  debounce.call(() => {
    if (dialogShow.value) {
      dialogShow.value = false
    }

    window.electron.ipcRenderer.send('STOP_HUNTING')
    appStore.changeHuntingStatus('stop')
  })
}

const onConfirm = (): void => {
  debounce.call(() => {
    dialogShow.value = false
    window.electron.ipcRenderer.send('PY_COMFIRM')
  })
}

const startHunting = (): void => {
  debounce.call(async () => {
    const dialog = appStore.showDialog({
      width: 500,
      content:
        '开始执行之后，简历及岗位存储文件夹下的文件都不可打开或操作，可在“岗位列表页”查看已投递的岗位。\n\n执行后会启动一个浏览器窗口，除了一开始的登录和筛选操作，直到执行结束，请勿进行其他操作。\n\n确认开始投递？',
      ok: {
        callback: async () => {
          dialog.close()
          appStore.changeHuntingStatus('start')
          processData.value = []
          const res: SaveConfigRes = await window.electron.ipcRenderer.invoke('START_HUNTING')
          if (res.status === 'success') {
            appStore.changeHuntingStatus('process')
          } else {
            appStore.showDialog({
              content: res.msg as string,
              cancel: { callback: () => appStore.changeHuntingStatus('stop') }
            })
          }
        }
      },
      cancel: { text: '取消' }
    })
  })
}

const stopHunting = (): void => {
  debounce.call(() => {
    const dialog = appStore.showDialog({
      content: '投递程序正在执行中，确认停止投递？',
      ok: {
        callback: () => {
          debounce.call(() => {
            window.electron.ipcRenderer.send('STOP_HUNTING')
            appStore.changeHuntingStatus('stop')
            dialog.close()
          })
        }
      },
      cancel: { text: '取消' }
    })
  })
}

onBeforeMount(() => {
  window.electron.ipcRenderer.removeListener('PY_DATA', dataHandler)
})
</script>
<style lang="css" scoped>
.home {
  height: 100%;
  width: 100%;
}
.home-start-btn {
  cursor: pointer;
  box-shadow: 0 0 20px rgb(15, 76, 129);
  position: absolute;
}
.home-start-btn.top-left {
  top: 30px;
  right: 25px;
  z-index: 10;
}
.home-start-btn.middle {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.home-dialog {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
}
.home-dialog-container {
  width: 400px;
  background-color: #fff;
  padding: 20px;
  border-radius: 20px;
}
.home-dialog-container footer {
  display: flex;
  justify-content: end;
  align-items: center;
  height: 40px;
  gap: 10px;
  margin-top: 20px;
}

.home-process-list {
  padding: 20px;
  overflow: auto;
  height: 100%;
}
.home-process-item {
  padding: 20px;
  border: 1px solid #87ceeb;
  box-shadow: 0 0 15px rgb(135, 206, 235, 0.5);
  margin-bottom: 15px;
  border-radius: 10px;
}
.home-process-item.done {
  border: 1px solid #50c878;
  box-shadow: 0 0 10px rgb(80, 200, 120, 0.5);
}
.home-process-item.error {
  border: 1px solid rgb(255, 36, 0);
  box-shadow: 0 0 10px rgb(255, 36, 0, 0.5);
}
.home-process-item.warning {
  border: 1px solid rgb(255, 255, 0);
  box-shadow: 0 0 10px rgb(255, 255, 0, 0.5);
}
.home-process-item span {
  white-space: pre-wrap;
}
</style>
