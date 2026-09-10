import { getMainWindow } from '.'
import {
  confirmCheck,
  getSilentData,
  PyContactModel,
  sendToPython,
  startPythonExe,
  stopPyProc
} from './python-contact'
import {
  FileDetailRes,
  JobFilesModel,
  JobFilesRes,
  PyDataModel,
  SaveConfigRes,
  UIConfigModel
} from '../shared/type'
import { app, dialog, FileFilter, shell } from 'electron'
import { promises as fs } from 'fs'
import { fileExists } from './utils'
import path from 'path'
import XLSX from 'xlsx'

const userPath = app.getPath('userData')
export const DEFAULT_CONFIG = {
  chromePath: '',
  backlistCompany: [],
  desc_blackwords: [],
  desc_whitewords: [],
  descType: 'black',
  isHunter: 0,
  jobPath: userPath,
  port: 2222,
  delayTime: 400,
  doneCount: 30,
  searchWord: '',
  isAI: 0,
  model: '',
  baseUrl: '',
  apiKey: '',
  score: 80,
  systemPrompt: '你是一个专业的简历分析师',
  resumePath: '',
  startUrl: 'https://www.zhipin.com/web/geek/jobs',
  recordOnly: 0,
}
const FILENAME_FIX = 'job_list'

const getPyConfig = async (): Promise<PyContactModel> => {
  const uiconfigData = await getUserConfig()
  const pyConfig: PyContactModel = {
    type: 'init',
    chrome_path: uiconfigData.chromePath,
    backlist_company: uiconfigData.backlistCompany,
    desc_blackwords: uiconfigData.desc_blackwords,
    desc_whitewords: uiconfigData.desc_whitewords,
    desc_type: uiconfigData.descType,
    is_hunter: uiconfigData.isHunter,
    job_path: uiconfigData.jobPath,
    port: uiconfigData.port,
    delay_time: uiconfigData.delayTime,
    done_count: uiconfigData.doneCount,
    search_word: uiconfigData.searchWord,
    is_ai: uiconfigData.isAI,
    model: uiconfigData.model,
    base_url: uiconfigData.baseUrl,
    api_key: uiconfigData.apiKey,
    score: uiconfigData.score,
    system_prompt: uiconfigData.systemPrompt,
    start_url: uiconfigData.startUrl,
    filename_fix: FILENAME_FIX,
    record_only: uiconfigData.recordOnly,
  }
  if (uiconfigData.jobPath && !(await fileExists(uiconfigData.jobPath))) {
    return Promise.reject('岗位存储路径不存在或无法访问,请确认配置页是否正确配置路径')
  }
  if (uiconfigData.chromePath && !(await fileExists(uiconfigData.chromePath))) {
    return Promise.reject('浏览器路径不存在或无法访问,请确认配置页是否正确配置路径')
  }
  if (uiconfigData.isAI && uiconfigData.resumePath) {
    if (!(await fileExists(uiconfigData.resumePath))) {
      return Promise.reject(
        '简历文件不存在或无法访问,如需要启用AI分析,请选择有效的简历文件,或在配置页关闭AI分析'
      )
    }
    const content = await fs.readFile(uiconfigData.resumePath, 'utf-8')
    if (!content) {
      return Promise.reject('简历无内容,如需要启用AI分析,请选择有效的简历文件,或在配置页关闭AI分析')
    }
    pyConfig.resume_text = content
  }
  return pyConfig
}

export const startJobHunting = async (): Promise<SaveConfigRes> => {
  let configData: PyContactModel
  try {
    configData = await getPyConfig()
  } catch (e) {
    return Promise.resolve({ status: 'error', msg: e as string })
  }
  await startPythonExe()

  const flag = await sendToPython(configData)

  if (!flag) {
    return Promise.resolve({ status: 'error', msg: '进程启动失败' })
  }

  return Promise.resolve({ status: 'success', msg: '开始投递' })
}

export const stopJobHunting = async (): Promise<void> => {
  await stopPyProc()
}

export const confirmPyCheck = (): void => {
  confirmCheck()
}

export const emitPyData = (data: PyDataModel) => {
  const mainWindow = getMainWindow()
  if (mainWindow) {
    mainWindow.webContents.send('PY_DATA', data)
  }
}

export const getPySilentData = (): Promise<PyDataModel[]> => {
  return Promise.resolve(getSilentData())
}

export const getUserConfig = async (): Promise<UIConfigModel> => {
  const configFile = userPath + '\\config.json'
  const is_exist = await fileExists(configFile)
  if (!is_exist) {
    return Promise.resolve(DEFAULT_CONFIG)
  }
  try {
    const data = await fs.readFile(configFile, 'utf-8')

    const parseConfig = JSON.parse(data) as UIConfigModel
    parseConfig.recordOnly = parseConfig.recordOnly || 0

    return Promise.resolve(parseConfig)
  } catch (e) {
    return Promise.reject(`配置文件读取异常,请确认 ${configFile} 是否正常,或把数据备份后删除该文件`)
  }
}

const FilterMap: Record<string, FileFilter> = {
  chromePath: { extensions: ['exe'], name: '浏览器应用程序: msedge.exe 或 chrome.exe' },
  resumePath: { extensions: ['txt', 'md'], name: 'Markdown / 文本' }
}

export const selectPath = async (params: {
  pathType: 'file' | 'dir'
  defaultPath: string
  field: string
}): Promise<string | null> => {
  const filter: FileFilter = FilterMap[params.field]
  const result = await dialog.showOpenDialog({
    properties: [params.pathType === 'dir' ? 'openDirectory' : 'openFile'],
    filters: filter ? [filter] : [],
    defaultPath: params.defaultPath
    // properties: ['openFile'] // 选择文件
    // properties: ['openFile', 'multiSelections'] // 选择多个文件[reference:1]
    // defaultPath: 'C:\\Users\\YourName\\Documents' // 设置默认路径[reference:2]
  })

  if (!result.canceled) {
    return result.filePaths[0] // 返回选中的路径
  }
  return null
}

export const saveConfig = async (configData: UIConfigModel): Promise<string> => {
  try {
    const configFile = userPath + '\\config.json'
    // 1. 确保目录存在（如果路径包含子目录）
    const dir = path.dirname(configFile)
    await fs.mkdir(dir, { recursive: true })

    // 2. 将数据转为 JSON 字符串（格式化，便于阅读）
    const jsonContent = JSON.stringify(configData, null, 2)

    // 3. 写入文件（覆盖已存在的文件）
    await fs.writeFile(configFile, jsonContent, { encoding: 'utf-8' })
    return Promise.resolve('success')
  } catch (e) {
    return Promise.reject(e)
  }
}

export const getJobFileList = async (): Promise<JobFilesRes> => {
  try {
    const config = await getUserConfig()
    const jobPath = config.jobPath
    if (!jobPath) {
      return { status: 'error', msg: '未配置岗位存储路径' }
    }
    let dirList = await fs.readdir(jobPath)
    dirList = dirList.filter((item) => item.includes(FILENAME_FIX))
    if (!dirList.length) {
      return { status: 'success', files: {} }
    }
    const items: JobFilesModel = {}
    for (let i = 0; i <= dirList.length - 1; i++) {
      const dir = dirList[i]
      const fullpath = `${jobPath}\\${dir}`
      let fileList = await fs.readdir(fullpath)
      fileList = fileList.filter((item) => item.includes(FILENAME_FIX))
      items[dir] = fileList.map((file) => ({ name: file, full: `${fullpath}\\${file}` }))
    }
    return { status: 'success', files: items }
  } catch (e) {
    return { status: 'error', msg: e as string }
  }
}

export const getFileDetail = (params: { filePath: string }): Promise<FileDetailRes> => {
  let workbook
  // 读取文件
  try {
    workbook = XLSX.readFile(params.filePath)
  } catch (e) {
    return Promise.resolve({
      status: 'error',
      msg: '文件读取异常，请确认是否打开文件，或文件是否存在异常。'
    })
  }

  // 获取第一个工作表的数据，转为 JSON 数组
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet)
  return Promise.resolve({
    status: 'success',
    data,
  })
}

export const jumpWeb = (link: string): void => {
  shell.openExternal(link) // 在外部浏览器中打开
}
