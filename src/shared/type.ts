export interface PyDataModel {
  type: string
  data?: any
  id: string
}

export interface UIConfigModel {
  chromePath?: string
  backlistCompany?: string[]
  desc_blackwords?: string[]
  desc_whitewords?: string[]
  descType?: string
  isHunter?: number
  jobPath?: string
  port?: number
  delayTime?: number
  doneCount?: number
  searchWord?: string
  jobType?: string
  isAI?: number
  model?: string
  baseUrl?: string
  apiKey?: string
  score?: number
  systemPrompt?: string
  resumePath?: string
  startUrl?: string
}

export interface SaveConfigRes {
  status: 'error' | 'success'
  msg?: string
}

export type JobFilesModel = Record<string, Array<{ name: string; full: string }>>

export type JobFilesRes = SaveConfigRes & {
  files?: JobFilesModel
}

export type FileDetailRes = SaveConfigRes & {
  data?: Record<string, string>[]
}
