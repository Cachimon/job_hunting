<template>
  <div>
    <header class="app-header">
      <ul class="app-menu" @click="onMenuClick">
        <li
          v-for="item in menuList"
          :key="item.path"
          :class="`${
            item.huntingDisabled && appStore.huntingStatus !== 'stop'
              ? 'disabled'
              : activeMenu === item.path
                ? 'selected'
                : ''
          }`"
          :data-path="item.path"
          :data-disabled="item.huntingDisabled"
        >
          {{ item.text }}
        </li>
      </ul>
    </header>
    <main class="app-main">
      <div style="position: relative; height: 100%;">
        <RouterView />
      </div>
    </main>
    <div v-for="[key, item] in appStore.dialogConfigMap" :key="key" class="app-dialog">
      <div class="app-dialog-container" :style="{ width: `${item.width || 350}px` }">
        <div v-if="item.title" class="app-dialog-title">{{ item.title }}</div>
        <div class="app-dialog-content">{{ item.content }}</div>
        <div v-if="item.showFooter !== false" class="app-dialog-footer">
          <button v-if="item.ok" class="primary" @click="() => onConfirm(item)">
            {{ item.ok?.text || '确认' }}
          </button>
          <button @click="() => onCancel(key, item)">{{ item.cancel?.text || '好的' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAppStore } from './stores/appStore'
import { DialogConfigModel } from './type'
import useDebounce from './hooks/useDebounce'

const menuList = [
  {
    path: '/home',
    text: '首页'
  },
  {
    path: '/job-list',
    text: '岗位列表',
  },
  {
    path: '/config',
    text: '个人设置',
    huntingDisabled: true,
  },
]
const appStore = useAppStore()
const activeMenu = ref<string>('/home')
const router = useRouter()
const debounce = useDebounce()

const onMenuClick = (e) => {
  const disabled = e.target.dataset.disabled
  if (
    (disabled && appStore.huntingStatus !== 'stop') ||
    activeMenu.value === e.target.dataset.path
  ) {
    return
  }
  activeMenu.value = e.target.dataset.path
  router.push(activeMenu.value)
}

const onConfirm = (config: DialogConfigModel): void => {
  debounce.call(async () => {
    await config.ok?.callback?.()
  })
}

const onCancel = (id: string, config: DialogConfigModel): void => {
  debounce.call(async () => {
    if (config.cancel?.callback) {
      const res = await config.cancel.callback()
      if (res === false) {
        return
      }
    }
    appStore.closeDialog(id)
  })
}
</script>

<style>
.app-header {
  border-bottom: 1px solid #eee;
  height: 40px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}
.app-menu {
  display: flex;
  height: 100%;
}
.app-menu li {
  cursor: pointer;
  padding: 0 15px;
  display: flex;
  align-items: center;
  border-radius: 5px;
  transition: background-color linear .2s;
}
.app-menu li.disabled {
  color: #999;
  cursor: not-allowed;
  opacity: 0.7;
}
.app-menu li.selected {
  background-color: #98B4D4;
  cursor: text;
}
.app-main {
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  padding-top: 40px;
}
.app-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, .5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.app-dialog-container {
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, .5);
  border-radius: 10px;

}
.app-dialog-title {
  padding: 10px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, .1);
  font-size: 18px;

}
.app-dialog-content {
  padding: 20px;
  white-space: pre-wrap;
}
.app-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 10px 20px;
  border-top: 1px solid rgba(0, 0, 0, .1);
  gap: 10px;
}
.app-dialog-footer button {
  padding: 7px 13px;
}
</style>
