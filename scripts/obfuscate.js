const fs = require('fs')
const path = require('path')
const JavaScriptObfuscator = require('javascript-obfuscator')

const mainFile = path.join(__dirname, '../out/main/index.js')

// 读取主进程代码
const sourceCode = fs.readFileSync(mainFile, 'utf8')

// 混淆（只混淆主进程，渲染进程不需要）
const result = JavaScriptObfuscator.obfuscate(sourceCode, {
  compact: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  deadCodeInjection: false,
  controlFlowFlattening: false,
  renameGlobals: false
})

// 覆盖原文件
fs.writeFileSync(mainFile, result.getObfuscatedCode(), 'utf8')
console.log('✅ 主进程代码已混淆')
