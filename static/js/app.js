const errHandle = (err) => {
    alert(`Error: ${err}`)
}
const throttle = (func, delay) => {
    let tid = null

    return (...arg) => {
        if (tid) return;

        tid = setTimeout(() => {
            func(...arg)
            tid = null
        }, delay)
    }
}

const passwdPrompt = () => {
    const passwd = window.prompt('Please enter password')
    if (passwd == null) return;

    if (!passwd.trim()) {
        alert('password can not be empty!')
    }
    const path = location.pathname
    window.fetch(`${path}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            passwd,
        }),
    })
        .then(res => res.json())
        .then(res => {
            if (res.err !== 0) {
                return errHandle(res.msg)
            }
            if (res.data.refresh) {
                window.location.reload()
            }
        })
        .catch(err => errHandle(err))
}

const renderPlain = (node, text) => {
    if (node) {
        node.innerHTML = DOMPurify.sanitize(text)
    }
}

const renderMarkdown = (node, text) => {
    if (node) {
        const parseText = marked.parse(text)
        node.innerHTML = DOMPurify.sanitize(parseText)
    }
}

window.addEventListener('DOMContentLoaded', function () {
    const $textarea = document.querySelector('#contents')
    const $loading = document.querySelector('#loading')
    const $pwBtn = document.querySelector('.opt-pw')
    const $modeBtn = document.querySelector('.opt-mode > input')
    const $shareBtn = document.querySelector('.opt-share > input')
    const $previewPlain = document.querySelector('#preview-plain')
    const $previewMd = document.querySelector('#preview-md')
    const $shareModal = document.querySelector('.share-modal')
    const $closeBtn = document.querySelector('.share-modal .close-btn')
    const $copyBtn = document.querySelector('.share-modal .opt-button')
    const $shareInput = document.querySelector('.share-modal input')

    renderPlain($previewPlain, $textarea.value)
    renderMarkdown($previewMd, $textarea.value)

    if ($textarea) {
        let saveTimeout; // 保存定时器
        let countdown; // 倒计时定时器

        function clearTimers() {
            clearTimeout(saveTimeout);
            clearTimeout(countdown);
        }

         // 开始倒计时
        function startCountdown() {
            clearTimers();
            $loading.style.display = 'inline-block'; // 显示加载动画

            // 设置倒计时定时器
            let seconds = 10; // 倒计时秒数
            let countdownInterval = setInterval(function () {
                seconds--;
                $loading.textContent = `${seconds} s`; // 更新加载动画中的秒数

                if (seconds <= 0) {
                    clearInterval(countdownInterval); // 清除倒计时定时器
                    $loading.textContent = ''; // 清除加载动画中的秒数

                    // 发送保存请求
                    window.fetch('', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            t: $textarea.value,
                        }),
                    })
                        .then(res => res.json())
                        .then(res => {
                            if (res.err !== 0) {
                                errHandle(res.msg);
                            }
                        })
                        .catch(err => errHandle(err))
                        .finally(() => {
                            $loading.style.display = 'none'; // 隐藏加载动画
                        });
                }
            }, 1000); // 每秒更新一次
        }

        
        $textarea.oninput = function () {
            // 渲染Markdown预览
            renderMarkdown($previewMd, $textarea.value);

            // 清除之前的定时器
            clearTimers();

            // 设置新的定时器
            saveTimeout = setTimeout(startCountdown, 1000); // 1秒后开始倒计时
        };
    }

    if ($pwBtn) {
        $pwBtn.onclick = function () {
            const passwd = window.prompt('Enter a new password(keep empty will remove current password)')
            if (passwd == null) return;

            const path = window.location.pathname
            window.fetch(`${path}/pw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    passwd: passwd.trim(),
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }
                    alert(`Password ${passwd ? 'setting' : 'remove'} success!`)
                })
                .catch(err => errHandle(err))
        }
    }

    if ($modeBtn) {
        $modeBtn.onclick = function (e) {
            const isMd = e.target.checked
            const path = window.location.pathname
            window.fetch(`${path}/setting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mode: isMd ? 'md' : 'plain',
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }

                    window.location.reload()
                })
                .catch(err => errHandle(err))
        }
    }
    
    if ($shareBtn) {
        $shareBtn.onclick = function (e) {
            const isShare = e.target.checked
            const path = window.location.pathname
            window.fetch(`${path}/setting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    share: isShare,
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }

                    if (isShare) {
                        const origin = window.location.origin
                        const url = `${origin}/share/${res.data}`
                        // show modal
                        $shareInput.value = url
                        $shareModal.style.display = 'block'
                    }
                })
                .catch(err => errHandle(err))
        }
    }

    if ($shareModal) {
        $closeBtn.onclick = function () {
            $shareModal.style.display = 'none'

        }
        $copyBtn.onclick = function () {
            clipboardCopy($shareInput.value)
            const originText = $copyBtn.innerHTML
            const originColor = $copyBtn.style.background
            $copyBtn.innerHTML = 'Success!'
            $copyBtn.style.background = 'orange'
            window.setTimeout(() => {
                $shareModal.style.display = 'none'
                $copyBtn.innerHTML = originText
                $copyBtn.style.background = originColor
            }, 1500)
        }
    }

})
