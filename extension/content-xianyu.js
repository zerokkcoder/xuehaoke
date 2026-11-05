// 学好课 · 闲鱼一键上架 —— 闲鱼发布页脚本
// 读取扩展缓存的素材，自动填充描述（标题并入首行）、价格、封面图，并按需点击发布
(function () {
  const PAYLOAD_KEY = 'xuehaokeXianyuPayload'
  const MAX_AGE = 15 * 60 * 1000

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  function report(result) {
    try {
      chrome.runtime.sendMessage({ type: 'XIANYU_RESULT', result: result })
    } catch {}
  }

  async function waitFor(fn, timeout, interval) {
    const limit = timeout || 20000
    const step = interval || 300
    const start = Date.now()
    while (Date.now() - start < limit) {
      try {
        const v = fn()
        if (v) return v
      } catch {}
      await sleep(step)
    }
    return null
  }

  // 闲鱼发布页类名是哈希值，无法作为选择器，这里按可见性与占位符做启发式定位
  function isVisible(el) {
    return !!el && el.offsetParent !== null && el.getClientRects().length > 0
  }

  // ---- 分类选择 ----
  const CATEGORY_NAME = '笔记资料' // 需要自动选择的闲鱼分类
  const CATEGORY_PARENT = '教育培训' // 该分类若为二级分类，先展开所属一级分类

  function xpathLiteral(s) {
    if (s.indexOf('"') === -1) return `"${s}"`
    if (s.indexOf("'") === -1) return `'${s}'`
    return `concat(${s.split('"').map((p) => `"${p}"`).join(", '\"', ")})`
  }

  // 精确匹配元素自身文本（返回最内层、可见的元素，优先面积小的）
  function findByExactText(text) {
    const result = document.evaluate(
      `//*[normalize-space(text())=${xpathLiteral(text)}]`,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )
    const out = []
    for (let i = 0; i < result.snapshotLength; i++) {
      const el = result.snapshotItem(i)
      if (isVisible(el)) out.push(el)
    }
    return out.sort((a, b) => a.clientHeight * a.clientWidth - b.clientHeight * b.clientWidth)
  }

  // 匹配自身文本包含关键词且文本较短的元素（用于找分类选择器入口）
  function findByShortText(keyword, maxLen) {
    const result = document.evaluate(
      `//*[contains(text(), ${xpathLiteral(keyword)})]`,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )
    const seen = new Set()
    const out = []
    for (let i = 0; i < result.snapshotLength; i++) {
      const el = result.snapshotItem(i)
      if (!el || seen.has(el) || !isVisible(el)) continue
      const t = (el.textContent || '').trim()
      if (!t || t.length > maxLen) continue
      seen.add(el)
      out.push(el)
    }
    return out.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)
  }

  // 逐个尝试可能的分类选择器入口，打开后若出现目标分类即视为成功
  async function openCategoryPicker() {
    const candidates = []
    for (const kw of ['选择分类', '请选择分类', '分类']) {
      for (const el of findByShortText(kw, 16)) {
        if (candidates.indexOf(el) === -1) candidates.push(el)
      }
    }
    for (const el of candidates) {
      el.scrollIntoView({ block: 'center' })
      await sleep(150)
      el.click()
      await sleep(700)
      if (findByExactText(CATEGORY_NAME).length) return true
      const parent = findByExactText(CATEGORY_PARENT)
      if (parent.length) {
        parent[0].click()
        await sleep(700)
        if (findByExactText(CATEGORY_NAME).length) return true
      }
    }
    return false
  }

  async function pickCategory() {
    let target = findByExactText(CATEGORY_NAME)[0]
    if (!target) {
      const opened = await openCategoryPicker()
      if (opened) target = findByExactText(CATEGORY_NAME)[0]
    }
    if (!target) return false
    target.scrollIntoView({ block: 'center' })
    await sleep(200)
    target.click()
    return true
  }

  function findEditor() {
    const nodes = Array.from(document.querySelectorAll('[contenteditable="true"]')).filter(isVisible)
    if (!nodes.length) return null
    return nodes.sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth)[0]
  }

  function findPriceInput() {
    const inputs = Array.from(document.querySelectorAll('input')).filter((el) => {
      const type = (el.type || '').toLowerCase()
      return type !== 'file' && type !== 'checkbox' && type !== 'radio' && type !== 'hidden' && isVisible(el)
    })
    const byLabel = inputs.find((el) => /价格|售价|金额|一口价/.test(el.placeholder || ''))
    if (byLabel) return byLabel
    const container = inputs.find((el) => {
      const box = el.closest('div')
      return box && /价格|售价|金额|一口价/.test((box.innerText || '').slice(0, 40))
    })
    if (container) return container
    return inputs.find((el) => (el.type || '').toLowerCase() === 'number') || null
  }

  function setInputValue(input, value) {
    const proto = Object.getPrototypeOf(input)
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')
    if (setter && setter.set) setter.set.call(input, value)
    else input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  function setEditorText(editor, text) {
    editor.focus()
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(editor)
    sel.removeAllRanges()
    sel.addRange(range)
    document.execCommand('delete', false)
    const lines = String(text).split('\n')
    lines.forEach((line, i) => {
      if (i > 0) {
        const ok = document.execCommand('insertLineBreak', false)
        if (!ok) document.execCommand('insertParagraph', false)
      }
      if (line) document.execCommand('insertText', false, line)
    })
    try {
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }))
    } catch {
      editor.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  async function uploadImages(images) {
    const list = Array.isArray(images) ? images.slice(0, 9) : []
    if (!list.length) return 0
    const input = await waitFor(
      () => Array.from(document.querySelectorAll('input[type="file"]')).find((el) => !el.disabled),
      10000
    )
    if (!input) return 0
    const dt = new DataTransfer()
    for (const dataUrl of list) {
      try {
        const blob = await (await fetch(dataUrl)).blob()
        const type = blob.type || 'image/jpeg'
        const ext = (type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
        dt.items.add(new File([blob], `cover-${Date.now()}-${dt.items.length}.${ext}`, { type }))
      } catch {}
    }
    if (!dt.files.length) return 0
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return dt.files.length
  }

  async function clickPublish() {
    const btn = await waitFor(() => {
      const candidates = Array.from(document.querySelectorAll('button, [role="button"]'))
      return candidates.find((el) => {
        const t = (el.innerText || '').replace(/\s/g, '')
        return isVisible(el) && !el.disabled && /^(发布|确认发布|立即发布|发布宝贝|提交)$/.test(t)
      })
    }, 15000)
    if (!btn) return false
    btn.click()
    return true
  }

  async function main() {
    let payload = null
    try {
      const data = await chrome.storage.local.get(PAYLOAD_KEY)
      payload = data ? data[PAYLOAD_KEY] : null
    } catch {
      return
    }
    if (!payload) return
    // 一次素材只消费一次，避免刷新页面重复填充
    await chrome.storage.local.remove(PAYLOAD_KEY)
    if (payload.at && Date.now() - payload.at > MAX_AGE) {
      report({ ok: false, message: '上架素材已过期，请在后台重新点击「上架闲鱼」' })
      return
    }

    const ready = await waitFor(findEditor, 25000)
    if (!ready) {
      report({ ok: false, message: '未找到闲鱼描述编辑框，请确认已登录闲鱼并打开发布页' })
      return
    }

    // 分类要先选，避免切换分类时把已填好的描述/图片清空
    const categoryOk = await pickCategory()
    await sleep(800)

    // 选择分类可能导致表单重渲染，这里重新定位编辑框
    const editor = (await waitFor(findEditor, 8000)) || ready
    const text = [payload.title, payload.description].filter(Boolean).join('\n\n')
    setEditorText(editor, text)

    if (payload.price) {
      await sleep(300)
      const priceInput = findPriceInput()
      if (priceInput) setInputValue(priceInput, String(payload.price))
    }

    await sleep(300)
    const uploaded = await uploadImages(payload.images)

    let submitted = false
    if (payload.autoSubmit) {
      await sleep(1000)
      submitted = await clickPublish()
    }

    const parts = []
    if (categoryOk) parts.push(`分类「${CATEGORY_NAME}」`)
    else parts.push(`分类未自动选中（请手动选「${CATEGORY_NAME}」）`)
    parts.push(`图片 ${uploaded} 张`)

    report({
      ok: true,
      submitted: submitted,
      resourceId: payload.resourceId ?? null,
      message: submitted
        ? `已自动发布（${parts.join('，')}），请回到闲鱼页面确认结果`
        : `已填充标题/描述/价格（${parts.join('，')}），请检查后在闲鱼页面手动点击发布`,
    })
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'XIANYU_FILL') main()
  })

  if (document.readyState === 'complete') main()
  else window.addEventListener('load', main)
})()
