import { ipcMain } from 'electron'
import {
  confirmPyCheck,
  getFileDetail,
  getJobFileList,
  getPySilentData,
  getUserConfig,
  jumpWeb,
  saveConfig,
  selectPath,
  startJobHunting,
  stopJobHunting
} from './handler'
import { UIConfigModel } from '../shared/type'

const registerEvent = (): void => {

  ipcMain.on('STOP_HUNTING', stopJobHunting)

  ipcMain.on('PY_COMFIRM', confirmPyCheck)

  ipcMain.on('JUMP_WEB', (_, link) => jumpWeb(link))

  ipcMain.handle('GET_SILENT_DATA', getPySilentData)

  ipcMain.handle(
    'SELECT_CHROME_PATH',
    (_, params: { pathType: 'file' | 'dir'; defaultPath: string; field: string }) =>
      selectPath(params)
  )

  ipcMain.handle('GET_CONFIG', getUserConfig)

  ipcMain.handle(
    'SAVE_CONFIG',
    async (_, configData: UIConfigModel) => await saveConfig(configData)
  )

  ipcMain.handle('START_HUNTING', startJobHunting)

  ipcMain.handle('GET_JOB_LIST', getJobFileList)

  ipcMain.handle('GET_FILE_DETAIL', (_, params) => getFileDetail(params))
}

export default registerEvent
