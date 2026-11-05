// 学好课 · 闲鱼一键上架 —— 后台服务
// 职责：接收后台页面发来的上架素材 -> 把封面图转成 dataURL 缓存到 storage -> 打开/复用闲鱼发布页 -> 回传结果

const PAYLOAD_KEY = 'xuehaokeXianyuPayload'
const PUBLISH_URL = 'https://www.goofish.com/publish'
const ADMIN_MATCHES = [
  'http://localhost/*',
  'http://127.0.0.1/*',
  'https://www.xuehaoke.top/*',
  'https://xuehaoke.top/*',
]

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'PUBLISH') {
    handlePublish(msg.payload || {})
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, message: String(err && err.message ? err.message : err) }))
    return true
  }
  if (msg && msg.type === 'XIANYU_RESULT') {
    broadcastResult(msg.result || {})
  }
  return false
})

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function fetchAsDataUrl(url) {
  const res = await fetch(url, { credentials: 'omit', cache: 'force-cache' })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const type = res.headers.get('content-type') || 'image/jpeg'
  if (!/^image\//.test(type)) throw new Error('非图片资源：' + type)
  const buf = await res.arrayBuffer()
  return `data:${type};base64,${bufferToBase64(buf)}`
}

async function openPublishTab() {
  const tabs = await chrome.tabs.query({ url: 'https://www.goofish.com/*' })
  const existing = tabs.find((t) => typeof t.url === 'string' && t.url.indexOf('/publish') !== -1)
  if (existing && existing.id != null) {
    try {
      await chrome.windows.update(existing.windowId, { focused: true })
    } catch {}
    await chrome.tabs.update(existing.id, { active: true })
    try {
      await chrome.tabs.sendMessage(existing.id, { type: 'XIANYU_FILL' })
      return existing.id
    } catch {
      // 内容脚本未就绪（页面刚打开），直接重新加载发布页
      await chrome.tabs.update(existing.id, { url: PUBLISH_URL, active: true })
      return existing.id
    }
  }
  const tab = await chrome.tabs.create({ url: PUBLISH_URL, active: true })
  return tab.id
}

async function handlePublish(payload) {
  const images = []
  const rawImages = Array.isArray(payload.images) ? payload.images.slice(0, 9) : []
  for (const url of rawImages) {
    if (typeof url !== 'string' || !url) continue
    try {
      images.push(await fetchAsDataUrl(url))
    } catch {
      // 单张图片失败不阻塞整体流程
    }
  }

  await chrome.storage.local.set({
    [PAYLOAD_KEY]: {
      title: String(payload.title || ''),
      description: String(payload.description || ''),
      price: Number(payload.price) || 0,
      resourceId: payload.resourceId ?? null,
      autoSubmit: payload.autoSubmit !== false,
      images,
      at: Date.now(),
    },
  })

  const tabId = await openPublishTab()
  return { ok: true, images: images.length, tabId }
}

async function broadcastResult(result) {
  try {
    const tabs = await chrome.tabs.query({ url: ADMIN_MATCHES })
    for (const t of tabs) {
      if (t.id == null) continue
      try {
        await chrome.tabs.sendMessage(t.id, { type: 'XIANYU_RESULT', result })
      } catch {}
    }
  } catch {}
}
