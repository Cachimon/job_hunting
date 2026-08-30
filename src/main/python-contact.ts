import path from 'path'
import { promises as fs } from 'fs'
import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process'
import { app } from 'electron'
import { PyDataModel } from '../shared/type'
import { emitPyData } from './handler'
import { fileExists, sleep } from './utils'
let pyProc: ChildProcessWithoutNullStreams | null = null // 保存子进程引用
const silentData: PyDataModel[] = []
let logFile: string
let loggedWaning = false

/**
 *     chrome_path: str | None = None
    start_url: str | None = None
    port: int = Field(default=2222)
    backlist_company: list[str] = []
    user_dir: str | None = None
    location_list: list[str] = []
    crawl_delay: int = 400
    desc_blackwords: list[str] = []
    desc_whitewords: list[str] = []
    is_hunter: bool = Field(default=False)  # 允许猎头
    is_ai: bool = Field(default=False)
    ai_config: AIConfigMode | None = None
    pass_score: int = 80
    done_count: int = 30
 */

export interface PyContactModel {
  type: string
  chrome_path?: string
  backlist_company?: string[]
  desc_blackwords?: string[]
  desc_whitewords?: string[]
  desc_type?: string
  is_hunter?: number
  job_path?: string
  port?: number
  delay_time?: number
  done_count?: number
  search_word?: string
  is_ai?: number
  model?: string
  base_url?: string
  api_key?: string
  score?: number
  system_prompt?: string
  resume_text?: string
  start_url?: string
  filename_fix: string
}

const writeLog = async (status, data): Promise<void> => {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs')
    const logFileFull = path.join(logDir, logFile)

    // 确保日志目录存在
    await fs.mkdir(logDir, { recursive: true })

    // 写入日志（追加）
    const timestamp = new Date().toISOString()
    const line = `[${timestamp}] [${status}] ${data}\n`
    await fs.appendFile(logFileFull, line, 'utf-8')
  } catch (error) {
    loggedWaning = true
    emitData('warning', `记录日志失败：${error}`, true)
  }
}

const emitData = async (status: string, data?: string, skipLog: boolean = false): Promise<void> => {
  const _data = { type: status, data: data, id: crypto.randomUUID() }
  emitPyData(_data)
  silentData.push(_data)
  if (!skipLog && !loggedWaning) {
    await writeLog(status, data)
  }
}

const handleMsg = async (reply): Promise<void> => {
  if (reply.status === 'test') {
    // 调试需要的内容
    if (!app.isPackaged) {
      console.log(reply)
    }
  } else if (reply.status === 'debug') {
    // 用户不需关注，但需要记录日志的内容
    await writeLog(reply.status, reply.msg)
  } else {
    await emitData(reply.status, reply.msg)
    if (reply.status === 'done' || reply.status === 'error') {
      await stopPyProc()
    }
  }
}

const init = async (): Promise<void> => {
  await stopPyProc()
  silentData.length = 0
  logFile = `${Date.now()}.log`
  loggedWaning = false
}

// 启动 .exe 子进程
export async function startPythonExe(): Promise<void> {
  await init()
  // 获取 .exe 的路径（开发 vs 生产）
  let exePath
  if (app.isPackaged) {
    // 生产环境：exe 放在 resources 目录下
    exePath = path.join(process.resourcesPath, 'job_crawl.exe')
  } else {
    // 开发环境：假设 exe 在项目根目录的 dist 下
    exePath = path.join(__dirname, '..', '..', 'resources', 'job_crawl.exe')
  }

  // 检查文件是否存在
  if (!(await fileExists(exePath))) {
    console.error('找不到 exe 文件:', exePath)
    return
  }

  // 启动子进程
  pyProc = spawn(exePath, [], {
    stdio: ['pipe'] // 使用管道
  })

  // 监听 stdout（接收 Python 的输出）
  pyProc.stdout.on('data', (buffer) => {
    const data = buffer.toString().trim()
    // 按换行符分割
    const lines = data.split('\n')
    // 保留最后一个可能不完整的部分
    // buffer = lines.pop()

    for (const line of lines) {
      if (line.trim()) {
        const reply = JSON.parse(line.trim())
        handleMsg(reply)
      }
    }
    // 将消息转发到渲染进程（可选）
    // mainWindow.webContents.send('python-reply', msg);
  })

  // 监听 stderr（错误输出）
  pyProc.stderr.on('data', (data) => {
    console.error('Python 错误:', data.toString())
  })

  // 监听进程退出
  pyProc.on('close', () => {
    emitData('exit')
    pyProc = null
  })

  // 监听进程错误（如启动失败）
  pyProc.on('error', (err) => {
    emitData('error', `进程启动失败：${err.message}`)
    pyProc?.stdin?.end()
  })
}

// 发送数据到 Python 子进程
export async function sendToPython(data, silent = false): Promise<boolean> {
  let flag = false
  let times = 0
  while (!flag && times < 3) {
    if (pyProc && pyProc.stdin.writable) {
      const msg = JSON.stringify(data) + '\n'
      pyProc.stdin.write(msg)
      flag = true
    } else {
      await sleep(1000)
      times = times + 1
    }
  }
  if (!flag) {
    if (!silent) {
      await emitData('error', '进程启动失败')
    }
    await stopPyProc(true)
  }
  return flag
}

export async function stopPyProc(skipMsg = false): Promise<void> {
  if (!skipMsg) {
    await sendToPython({ type: 'exit' }, true)
  }
  await sleep(500)
  if (pyProc) {
    exec(`taskkill /PID ${pyProc.pid} /T /F`, (err) => {
      if (err) {
        writeLog('error', `taskkill ${pyProc?.pid} 失败`)
      }
      pyProc = null
    })
  } else {
    pyProc = null
  }
}

export const getSilentData = (): PyDataModel[] => {
  return silentData
}

export const confirmCheck = (): void => {
  sendToPython({ type: 'check' })
  silentData.pop()
}
