// 学好课 · 闲鱼一键上架 —— 后台页面桥接脚本
// 在后台页面与扩展之间转发消息：页面 -> window.postMessage -> 扩展后台；扩展结果 -> 页面
(function () {
  const EXT_TAG = 'xuehaoke-xianyu-ext'
  const PAGE_TAG = 'xuehaoke-admin'

  function post(type, extra) {
    window.postMessage(Object.assign({ source: EXT_TAG, type: type }, extra || {}), '*')
  }

  window.addEventListener('message', async (e) => {
    const d = e.data
    if (!d || typeof d !== 'object' || d.source !== PAGE_TAG) return
    if (d.type === 'PING') {
      post('PONG')
      return
    }
    if (d.type === 'PUBLISH') {
      try {
        const result = await chrome.runtime.sendMessage({ type: 'PUBLISH', payload: d.payload || {} })
        post('PUBLISH_SENT', { result: result || { ok: false, message: '扩展无响应' } })
      } catch (err) {
        post('PUBLISH_SENT', { result: { ok: false, message: String(err && err.message ? err.message : err) } })
      }
    }
  })

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'XIANYU_RESULT') {
      post('PUBLISH_RESULT', { result: msg.result || {} })
    }
  })

  post('READY')
})()
