<template>
  <div class="file-datail">
    <div class="op-group">
      <button @click="onBack">返回</button>
      <button :class="`${loading ? 'disabeld' : ''}`" @click="fresh">刷新列表</button>
    </div>
    <div class="query-form">
      <div class="query-form-item">
        <label class="query-form-label">分数：</label>
        <input v-model="scores[0]" class="score" type="number" />~
        <input v-model="scores[1]" class="score" type="number" />
      </div>
      <div class="query-form-item">
        <label class="query-form-label">投递状态：</label>
        <select v-model="filterStatus">
          <option value="">所有</option>
          <option value="已投递">已投递</option>
          <option value="未投递">未投递</option>
        </select>
      </div>
      <button :class="`primary ${loading ? 'disabled' : ''}`" @click="onFilter">过滤</button>
    </div>
    <div :class="`table-wrapper ${loading ? 'default-loading' : ''}`">
      <table class="file-datail-table">
        <thead>
          <tr>
            <th
              v-for="col in jobColumns"
              :key="col.title"
              :style="{ width: `${col.width || 150}px` }"
            >
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableData" :key="`${row['岗位名称']}_${row['公司']}`">
            <td
              v-for="col in jobColumns"
              :key="col.title"
              :style="{ width: `${col.width || 150}px` }"
            >
              <a
                v-if="col.title === '详情链接'"
                :title="row[col.title]"
                @click="() => jumpLink(row[col.title])"
              >
                点击跳转
              </a>
              <span v-else :title="row[col.title]">{{ row[col.title] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useAppStore } from '@renderer/stores/appStore';
import { onMounted, ref, toRaw } from 'vue'
import jobColumns from './columns'

const props = defineProps<{ filePath: string }>()
const emit = defineEmits(['back'])

const tableData = ref<Record<string, string>[]>([])
let originalData: Record<string, string>[] = []
const scores = ref<number[]>([])
const filterStatus = ref()
const loading = ref(false)
const appStore = useAppStore()

onMounted(async () => {
  await getFileDetail()
})

const getFileDetail = async (): Promise<void> => {
  const res = await window.electron.ipcRenderer.invoke('GET_FILE_DETAIL', {
    filePath: props.filePath
  })
  setTimeout(() => {
    loading.value = false
    if (res.status === 'success') {
      originalData = res.data
      onFilter()
    } else {
      appStore.showDialog({ content: res.msg })
    }
  }, 200)
}

const onFilter = (): void => {
  const _scores = toRaw(scores.value)

  tableData.value = originalData.filter((item) => {
    if (_scores.length) {
      if (
        _scores[0] &&
        (!item['分数'] || item['分数'].toLowerCase() === 'nan' || Number(item['分数']) < _scores[0])
      ) {
        return false
      }
      if (
        _scores[1] &&
        (!item['分数'] || item['分数'].toLowerCase() === 'nan' || Number(item['分数']) > _scores[0])
      ) {
        return false
      }
    }
    if (filterStatus.value) {
      return item['投递状态'] === filterStatus.value
    }
    return true
  })
}

const onBack = (): void => {
  emit('back')
}

const fresh = async (): Promise<void> => {
  if (loading.value) {
    return
  }
  loading.value = true
  await getFileDetail()
}

const jumpLink = (link: string): void => {
  window.electron.ipcRenderer.send('JUMP_WEB', link)
}
</script>

<style lang="css" scoped>
.file-datail {
  height: 100%;
}
.op-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 5px;
}
.file-datail button {
  padding: 5px 10px;
}
.query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.query-form-label {
  color: #707070;
}
.query-form-item {
  display: flex;
}
.query-form-item .score {
  width: 70px;
}
.query-form-item select {
  width: 100px;
}
.table-wrapper {
  max-height: 470px;
  overflow: auto;
}
table {
  table-layout: fixed;
  width: 450px;
  border-collapse: collapse;
}
thead th {
  position: sticky;
  top: 0;
  background: #f5f5f5;
  z-index: 2;
}
th, td {
  width: 150px;   /* 如果列多，宽度总和超过容器宽度就会水平滚动 */
  padding: 8px 12px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
