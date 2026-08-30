import { promises as fs } from 'fs'
import fsSync from 'fs'
import crypto from 'crypto'
import { app } from 'electron'
import path from 'path'
import { exec } from 'child_process'

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export const sleep = (ms): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export const writeSysLog = async (status, data): Promise<void> => {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs')
    const logFileFull = path.join(logDir, 'system.log')

    // 确保日志目录存在
    await fs.mkdir(logDir, { recursive: true })

    // 写入日志（追加）
    const timestamp = new Date().toISOString()
    const line = `[${timestamp}] [${status}] ${data}\n`
    await fs.appendFile(logFileFull, line, 'utf-8')
  } catch (error) {
    console.error(error)
  }
}

const getDriveSerial = (): Promise<{ valid: boolean; data?: any }> => {
  return new Promise((resolve) => {
    exec('wmic diskdrive get SerialNumber', (err, stdout) => {
      if (err) {
        writeSysLog('error', `命令执行失败：wmic diskdrive get SerialNumber，${err}`)
        resolve({ valid: false })
        return
      }
      const arr = stdout.split('\n')
      const data = arr.map((item) => item.replaceAll('\r', '').trim())
      writeSysLog('info', `本地硬盘序列号：${data.join(',')}`)
      resolve({ valid: true, data })
    })
  })
}

const getCPUSerial = (): Promise<{ valid: boolean; data?: any }> => {
  return new Promise((resolve) => {
    exec('wmic cpu get processorid', (err, stdout) => {
      if (err) {
        writeSysLog('error', `命令执行失败：wmic cpu get processorid，${err}`)
        resolve({ valid: false })
        return
      }
      const arr = stdout.split('\n')
      const data = arr.map((item) => item.replaceAll('\r', '').trim())
      writeSysLog('info', `本地CPU序列号：${data[1]}`)
      resolve({ valid: true, data: data[1] })
    })
  })
}

export const validateLicense1 = async (): Promise<{ valid: boolean; reason?: string }> => {
  try {
    const userPath = app.getPath('userData')
    const publicKey =
      '-----BEGIN PUBLIC KEY-----\n' +
      'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3WNHjqpP9Wg/hvGTxX/Z\n' +
      'RNr/d/P4E7zpCwJAvO8KeEtlo9OyAFojpTanfbITFNL47TFfP5lqMUUPdXNu/m1s\n' +
      `rrgusTgl1nDwMC4l5rNDuV8jjeMY2PKqVwi0pWrX86+zPROK1i54TyM0T7s1vzwV\n` +
      'e89ZjCeI3LcK1RwYo+spkQY4tLyzEfG4sSy7UCwx+LYsfRvXCGw7AZg8B3mIfsfb\n' +
      '9YAzvdlDht8iixMxeAkj1DGHEE2lvpmDqpAbxjFx+dYTYLeSAck08YrgBPuJwvbR\n' +
      'GNA+bOXgnLib8Pmg1YHZrL3Tlg8MKegeesoddQAEa/YqXGCwHLC6oVb+bmgoT29v\n' +
      `LQIDAQAB\n` +
      '-----END PUBLIC KEY-----'
    let licenseRaw: string
    try {
      licenseRaw = fsSync.readFileSync(path.join(userPath, 'keys', 'license.data'), 'utf8')
    } catch {
      return { valid: false, reason: 'license文件不存在' }
    }
    const license = JSON.parse(licenseRaw)
    const verify = crypto.createVerify('SHA256')
    verify.update(license.payload)
    const isValid = verify.verify(publicKey, Buffer.from(license.signature, 'base64'))
    if (!isValid) return { valid: false, reason: '签名无效' }
    const data = JSON.parse(license.payload)
    // 验证电脑信息是否匹配
    const serialRes = await getDriveSerial()
    if (!serialRes.valid) {
      return { valid: false, reason: '获取不到本地硬盘序列号' }
    }
    const matchS = (serialRes.data as string[]).find((item) => item === data.disk)
    if (!matchS) {
      return { valid: false, reason: '硬盘序列号未匹配' }
    }
    const cpuRes = await getCPUSerial()
    if (!cpuRes.valid) {
      return { valid: false, reason: '获取不到CPU序列号' }
    }
    if (cpuRes.data !== data.cpu) {
      return { valid: false, reason: 'CPU序列号未匹配' }
    }

    if (Date.now() > new Date(data.expire).getTime()) return { valid: false, reason: '已过期' }
    return { valid: true }
  } catch (e) {
    return { valid: false, reason: (e as { message: string }).message }
  }
}

export const validateLicense = async (): Promise<{ valid: boolean; reason?: string }> => {
  if (Date.now() > new Date('2026-09-15').getTime()) return { valid: false, reason: '已过期' }
  return { valid: true }
}
