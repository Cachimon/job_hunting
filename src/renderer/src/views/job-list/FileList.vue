<template>
  <div class="file-list">
    <span class="file-list-desc"> 以下是岗位存储路径下的文件列表，可选择其一查看岗位列表。 </span>
    <button :class="`${loading ? 'disabled' : ''}`" @click="fresh">刷新列表</button>
    <main :class="`file-list-main ${loading ? 'default-loading' : ''}`">
      <div v-if="dirFileMap" class="file-list-container">
        <div v-for="(files, dir) in dirFileMap" :key="dir" class="file-list-dir">
          <h4 :title="showingStatusMap.get(dir) ? '展开' : '收起'" @click="() => toggleStatus(dir)">
            {{ dir }}<i :class="showingStatusMap.get(dir) ? 'arrow-down' : 'arrow-up'"></i>
          </h4>
          <ul :class="`file-list-dir-item ${showingStatusMap.get(dir) ? 'close' : 'open'}`">
            <li
              v-for="file in files"
              :key="file.full"
              class="file-list-item"
              @click="() => viewDetail(file.full)"
            >
              <span title="查看文件">{{ file.name }}</span>
              <!-- <button>查看</button> -->
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@renderer/stores/appStore'
import { JobFilesModel, JobFilesRes } from '@shared/type'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{ goDetail: [full: string] }>()

const showingStatusMap = ref<Map<string, number>>(new Map())

const appStore = useAppStore()
const dirFileMap = ref<JobFilesModel>()
const loading = ref(false)

onMounted(async () => {
  await getJobList()
})

const getJobList = async (): Promise<void> => {
  loading.value = true
  const res: JobFilesRes = await window.electron.ipcRenderer.invoke('GET_JOB_LIST')
  setTimeout(() => {
    loading.value = false
    if (res.status === 'success') {
      dirFileMap.value = res.files
    } else {
      appStore.showDialog({
        content: `读取岗位列表失败：${res.msg}`
      })
    }
  }, 200)
}

const toggleStatus = (dir: string): void => {
  const newStatus = showingStatusMap.value.get(dir) ? 0 : 1
  showingStatusMap.value.set(dir, newStatus)
}

const viewDetail = (full: string): void => {
  emit('goDetail', full)
}

const fresh = async (): Promise<void> => {
  if (loading.value) {
    return
  }
  await getJobList()
}
</script>

<style scoped>
.file-list {
  height: 100%;
}
.file-list-desc {
  color: #707070;
}
.file-list button {
  margin-top: 10px;
  margin-bottom: 10px;
}
.file-list-main {
  height: 460px;
  overflow: auto;
  padding: 10px 15px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, .1);
  position: relative;
}
.file-list-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.file-list-dir h4 {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 8px;
}
.file-list-dir h4 i {
  transition: all linear .3s;
}
.file-list-dir-item {
  padding-left: 50px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-list-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-left: 20px;
  width: 400px;
  color: rgb(0, 71, 171);
  cursor: pointer;
}
/* .file-list-item span {
  flex: 0 0 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-list-item button {
  padding: 5px 10px;
} */
/* 向上箭头：底部边框有颜色，左右边框透明 */
.arrow-up {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(0, 0, 0, .3);
  margin-top: 3px;
}

/* 向下箭头：顶部边框有颜色，左右边框透明 */
.arrow-down {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(0, 0, 0, .3);
  margin-top: 3px;
}
</style>
