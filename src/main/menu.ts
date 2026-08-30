import { app, Menu } from 'electron'

// 1. 定义菜单模板
const template = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          /* 新建逻辑 */
        }
      },
      {
        label: '打开',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          /* 打开逻辑 */
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  },
  {
    label: '编辑',
    submenu: [
      { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
      { type: 'separator' },
      { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
    ]
  }
  // 可以继续添加 '视图', '窗口', '帮助' 等菜单
]

// 2. 从模板构建菜单并设置为应用菜单
const loadMenu = (): void => {
  const menu = Menu.buildFromTemplate(template as Electron.MenuItemConstructorOptions[])
  Menu.setApplicationMenu(menu)
}
export default loadMenu
