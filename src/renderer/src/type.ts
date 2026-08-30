export interface ButtonConfigModel {
  text?: string
  callback?: () => Promise<boolean | void> | void | boolean
}

export interface DialogConfigModel {
  width?: number
  title?: string
  content: string | HTMLElement
  showFooter?: boolean
  ok?: ButtonConfigModel
  cancel?: ButtonConfigModel
}

