<template>
  <div class="config">
    <!-- <aside>
      <ul class="config-menu" @click="scrollToTarget">
        <li class="config-menu-item" data-type="basic">基础设置</li>
        <li class="config-menu-item" data-type="filter">岗位筛选设置</li>
        <li class="config-menu-item" data-type="ai">AI设置</li>
      </ul>
    </aside> -->
    <main>
      <div ref="basicRef" class="setting-wrap">
        <h2>基础设置</h2>
        <ul class="setting-list">
          <li class="setting-list-item">
            <label for="chromePath" class="setting-item-label required">
              浏览器路径(Edge或谷歌)
            </label>
            <input
              id="chromePath"
              readonly
              :value="configData.chromePath"
              class="config-path-input"
            />
            <button class="config-btn" @click="() => selectPath('chromePath')">选择</button>
          </li>
          <li class="setting-list-item">
            <label for="jobPath" class="setting-item-label">岗位存储路径</label>
            <input id="jobPath" readonly :value="configData.jobPath" class="config-path-input" />
            <button class="config-btn" @click="() => selectPath('jobPath')">选择</button>
          </li>
          <li class="setting-list-item">
            <label for="startUrl" class="setting-item-label">起始链接</label>
            <input id="startUrl" v-model="configData.startUrl" class="config-path-input" />
          </li>
          <li class="setting-list-item">
            <label for="port" class="setting-item-label">端口号</label>
            <input id="port" v-model="configData.port" type="number" />
          </li>
          <li class="setting-list-item">
            <label for="delayTime" class="setting-item-label">每次投递延迟时间</label>
            <input id="delayTime" v-model="configData.delayTime" type="number" />
          </li>
          <li class="setting-list-item">
            <label for="doneCount" class="setting-item-label">投递岗位数</label>
            <input id="doneCount" v-model="configData.doneCount" type="number" />
          </li>
        </ul>
      </div>
      <div ref="filterRef" class="setting-wrap">
        <h2>岗位筛选设置</h2>
        <ul class="setting-list">
          <li class="setting-list-item">
            <label for="searchWord" class="setting-item-label">岗位搜索词</label>
            <input id="searchWord" v-model="configData.searchWord" />
          </li>
          <!-- <li class="setting-list-item">
            <label for="jobType" class="setting-item-label">求职类型</label>
            <select id="jobType" v-model="configData.jobType">
              <option value="all">不限</option>
              <option value="1901">全职</option>
              <option value="1903">兼职</option>
            </select>
          </li> -->
          <li class="setting-list-item">
            <label class="setting-item-label">公司黑名单</label>
            <div class="tag-wrap">
              <span
                v-for="(word, i) in configData.backlistCompany"
                :key="word + i"
                class="tag-item"
              >
                {{ word }}
                <i @click="() => removeCom(i)">×</i>
              </span>
              <input v-model="blackCom" />
              <button :class="`config-btn ${blackCom ? '' : 'disabled'}`" @click="addNewCom">
                新增
              </button>
            </div>
          </li>
          <li class="setting-list-item">
            <label class="setting-item-label">岗位描述关键词</label>
            <div class="desc-wrap">
              <div class="desc-item">
                <label>
                  <input v-model="configData.descType" type="radio" value="black" />黑名单:
                </label>

                <div class="tag-wrap">
                  <span
                    v-for="(word, i) in configData.desc_blackwords"
                    :key="word + i"
                    class="tag-item"
                  >
                    {{ word }}
                    <i @click="() => removeDesc('black', i)">×</i>
                  </span>
                  <input v-model="blackDesc" />
                  <button
                    :class="`config-btn ${blackDesc ? '' : 'disabled'}`"
                    @click="() => addNewDesc('black')"
                  >
                    新增
                  </button>
                </div>
              </div>
              <div class="desc-item">
                <label>
                  <input v-model="configData.descType" type="radio" value="white" />白名单:
                </label>
                <div class="tag-wrap">
                  <span
                    v-for="(word, i) in configData.desc_whitewords"
                    :key="word + i"
                    class="tag-item"
                  >
                    {{ word }}
                    <i @click="() => removeDesc('white', i)">×</i>
                  </span>
                  <input v-model="whiteDesc" />
                  <button
                    :class="`config-btn ${whiteDesc ? '' : 'disabled'}`"
                    @click="() => addNewDesc('white')"
                  >
                    新增
                  </button>
                </div>
              </div>
            </div>
          </li>
          <li class="setting-list-item">
            <label class="setting-item-label">是否投递猎头</label>
            <label> <input v-model="configData.isHunter" type="radio" :value="1" />是 </label>
            <label> <input v-model="configData.isHunter" type="radio" :value="0" />否 </label>
          </li>
        </ul>
      </div>
      <div ref="aiRef" class="setting-wrap">
        <h2>AI设置</h2>
        <ul class="setting-list">
          <li class="setting-list-item">
            <label class="setting-item-label">启用AI分析</label>
            <label> <input v-model="configData.isAI" type="radio" :value="1" />是 </label>
            <label> <input v-model="configData.isAI" type="radio" :value="0" />否 </label>
          </li>
          <li class="setting-list-item">
            <label for="model" :class="`setting-item-label ${configData.isAI ? 'required' : ''}`">
              模型名称
            </label>
            <input id="model" v-model="configData.model" />
          </li>
          <li class="setting-list-item">
            <label for="baseUrl" :class="`setting-item-label ${configData.isAI ? 'required' : ''}`">
              模型链接
            </label>
            <input id="baseUrl" v-model="configData.baseUrl" class="config-path-input" />
          </li>
          <li class="setting-list-item">
            <label for="apiKey" class="setting-item-label">模型API KEY</label>
            <input
              id="apiKey"
              v-model="configData.apiKey"
              :type="apiKeyType"
              class="config-path-input"
            />
            <button v-if="configData.apiKey" class="config-btn" @click="changeApiKeyType">
              {{ apiKeyType === 'password' ? '显示' : '隐藏' }}
            </button>
          </li>
          <li class="setting-list-item">
            <label for="systemPrompt" class="setting-item-label">模型角色提示词</label>
            <input id="systemPrompt" v-model="configData.systemPrompt" />
          </li>
          <li class="setting-list-item">
            <label for="score" class="setting-item-label">通过分数</label>
            <input id="score" v-model="configData.score" type="number" />
          </li>
          <li class="setting-list-item">
            <label
              for="resumePath"
              :class="`setting-item-label ${configData.isAI ? 'required' : ''}`"
            >
              岗位存储路径
            </label>
            <input
              id="resumePath"
              readonly
              :value="configData.resumePath"
              class="config-path-input"
            />
            <button class="config-btn" @click="() => selectPath('resumePath')">选择</button>
          </li>
        </ul>
      </div>
      <button class="primary config-save-btn" @click="save">保存</button>
    </main>
  </div>
</template>

<script setup lang="ts">
import useDebounce from '@renderer/hooks/useDebounce'
import { useAppStore } from '@renderer/stores/appStore'
import { UIConfigModel } from '@shared/type'
import { onMounted, ref, toRaw } from 'vue'

// const basicRef = useTemplateRef<HTMLInputElement>('basicRef')
// const filterRef = useTemplateRef<HTMLInputElement>('filterRef')
// const aiRef = useTemplateRef<HTMLInputElement>('aiRef')
// const typeMap = {
//   basic: basicRef,
//   filter: filterRef,
//   ai: aiRef
// }
const configData = ref<UIConfigModel>({})
const blackCom = ref<string | null>(null)
const blackDesc = ref<string | null>(null)
const whiteDesc = ref<string | null>(null)
const apiKeyType = ref('password')

const debounce = useDebounce()
const appStore = useAppStore()

onMounted(async () => {
  configData.value = await window.electron.ipcRenderer.invoke('GET_CONFIG')
})

const changeApiKeyType = (): void => {
  if (apiKeyType.value === 'password') {
    apiKeyType.value = 'text'
  } else {
    apiKeyType.value = 'password'
  }
}

// const scrollToTarget = (e) => {
//   const configType = e.target.dataset.type
//   const domRef = typeMap[configType]
//   if (domRef) {
//     domRef.value?.scrollIntoView({ behavior: 'smooth' })
//   }
// }

const addNewCom = (): void => {
  debounce.call(() => {
    if (blackCom.value?.trim()) {
      configData.value.backlistCompany?.push(blackCom.value.trim())
      blackCom.value = null
    }
  })
}

const addNewDesc = (type: 'black' | 'white'): void => {
  debounce.call(() => {
    if (blackDesc.value?.trim() && type === 'black') {
      configData.value.desc_blackwords?.push(blackDesc.value.trim())
      blackDesc.value = null
    }
    if (whiteDesc.value?.trim() && type === 'white') {
      configData.value.desc_whitewords?.push(whiteDesc.value.trim())
      whiteDesc.value = null
    }
  })
}

const removeCom = (i: number): void => {
  debounce.call(() => {
    configData.value.backlistCompany?.splice(i, 1)
  })
}

const removeDesc = (type: 'black' | 'white', i: number): void => {
  debounce.call(() => {
    if (type === 'black') {
      configData.value.desc_blackwords?.splice(i, 1)
    } else {
      configData.value.desc_whitewords?.splice(i, 1)
    }
  })
}

const selectPath = async (pathType: string): Promise<void> => {
  const params = {
    field: pathType,
    pathType: ['chromePath', 'resumePath'].includes(pathType) ? 'file' : 'dir',
    defaultPath: configData.value[pathType]
  }
  const path = await window.electron.ipcRenderer.invoke('SELECT_CHROME_PATH', params)
  if (path) {
    configData.value[pathType] = path // 更新响应式变量
  }
}

const save = async (): Promise<void> => {
  debounce.call(async () => {
    const needFinish: string[] = []
    if (!configData.value.chromePath) {
      needFinish.push('浏览器路径')
    }
    if (configData.value.isAI) {
      if (!configData.value.model) {
        needFinish.push('模型名称')
      }
      if (!configData.value.baseUrl) {
        needFinish.push('模型链接')
      }
      if (!configData.value.resumePath) {
        needFinish.push('简历文件路径')
      }
    }
    if (needFinish.length) {
      appStore.showDialog({
        content: `请完成以下字段的选择或填写:\n${needFinish.join(',')}`,
      })
      return
    }
    const dialog = appStore.showDialog({ content: '保存中,请稍候...' })
    try {
      await window.electron.ipcRenderer.invoke('SAVE_CONFIG', toRaw(configData.value))
      dialog.close()
      appStore.showDialog({ content: '保存成功' })
    } catch (e) {
      dialog.close()
      appStore.showDialog({
        title: '保存异常,请联系运维人员.',
        content: e as string,
      })
    }
  })
}
</script>

<style lang="css" scoped>
.config {
  height: 100%;
  display: flex;
}
.config-btn {
  padding: 5px 15px;
}
aside {
  flex: 0 0 150px;
}
.config-menu {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 0, 0, 0.4);
}
.config-menu-item {
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
}
main {
  width: 100%;
  overflow: auto;
  padding: 10px 20px;
  position: relative;
}
.config-save-btn {
  position: fixed;
  top: 60px;
  right: 10px;
  box-shadow: 0 0 20px rgb(15, 76, 129);
}
.setting-wrap {
  margin-bottom: 40px;
}
.setting-wrap h2 {
  margin-bottom: 20px;
}
.setting-list {
  display: flex;
  gap: 15px;
  flex-direction: column;
}
.setting-list-item {
  display: flex;
  gap: 10px;
  align-items: start;
}
.setting-item-label {
  flex: 0 0 150px;
  position: relative;
}
.setting-item-label.required::before {
  content: '*';
  color: red;
  position: absolute;
  left: -10px;
  top: 0;
}
.config-path-input {
  width: 600px;
}
.tag-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.tag-wrap input {
  width: 150px;
}
.tag-item {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  position: relative;
  padding: 5px 10px;
}
.tag-item i {
  position: absolute;
  top: -6px;
  right: -4px;
  font-size: 20px;
  height: 18px;
  width: 18px;
  border: 1px solid #707070;
  color: #707070;
  border-radius: 9px;
  line-height: 14px;
  text-align: center;
  cursor: pointer;
}
.tag-item i:hover {
  color: rgb(0, 102, 255);
  border: 1px solid rgb(0, 102, 255);
}
.desc-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.desc-item {
  display: flex;
}
.desc-item label {
  display: flex;
  align-items: center;
  flex: 0 0 100px;
}
</style>
