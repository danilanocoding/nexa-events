document.addEventListener('DOMContentLoaded', function () {
    const video = document.getElementById('qr-video');
    const startBtn = document.getElementById('start-scan');
    const stopBtn = document.getElementById('stop-scan');
    const resultDiv = document.getElementById('scan-result');
    const participantsTable = document.getElementById('participants-table');
    const manualCodeForm = document.getElementById('manualCodeForm');
    const manualCodeInput = document.getElementById('manualCodeInput');
    const manualCodeResult = document.getElementById('manualCodeResult');
    
    let scannerActive = false;
    let lastScannedCode = null;
    let lastScanTime = 0;
    const eventId = sessionStorage.getItem('currentEventId');

    if (!eventId) {
        alert('Мероприятие не выбрано!');
        window.location.href = 'organizer.html';
        return;
    }

    loadParticipants();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Ваш браузер не поддерживает доступ к камере');
        startBtn.disabled = true;
        return;
    }

    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    stopBtn.addEventListener('click', stopScanning);
    startBtn.addEventListener('click', () => {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        startScanning().catch(() => {
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';
        });
    });
    startScanning().catch(() => {});
    manualCodeForm.addEventListener('submit', handleManualCodeSubmit);

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Требуется авторизация. Пожалуйста, войдите.');
                return;
            }

            fetch(`http://localhost:5000/api/export/${eventId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => {
                if (!res.ok) throw new Error('Ошибка экспорта');
                return res.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `export_${eventId}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(err => alert('Ошибка: ' + err.message));
        });
    }

    async function startScanning() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 1280, height: 720 }
            });

            video.srcObject = stream;
            await video.play();

            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            scannerActive = true;

            scanFrame();
        } catch (err) {
            showError(`Ошибка доступа к камере: ${err.message}`);
        }
    }

    function stopScanning() {
        scannerActive = false;
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    }

    function scanFrame() {
        if (!scannerActive) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                const now = Date.now();
                if (code.data !== lastScannedCode || (now - lastScanTime) > 2500) {
                    lastScannedCode = code.data;
                    lastScanTime = now;
                    handleScannedCode(code.data).catch(() => {});
                }
            }
        }

        requestAnimationFrame(scanFrame);
    }

    function handleManualCodeSubmit(e) {
        e.preventDefault();
        const code = manualCodeInput.value.trim();
        
        if (!code) {
            showManualResult('Введите код участника', 'danger');
            return;
        }

        handleScannedCode(code)
            .then(() => {
                manualCodeInput.value = ''; 
            })
            .catch(error => {
                showManualResult(error.message, 'danger');
            });
    }

    function handleScannedCode(code) {
        return fetch('http://localhost:5000/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_code: eventId,
                unique_code: code
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    const message = data.message || 'Отметка произведена';
                    showManualResult(message, 'success');
                    loadParticipants();
                } else {
                    throw new Error(data.message || 'Ошибка при сканировании');
                }
                return data;
            })
            .catch(error => {
                showError(error.message);
                showManualResult(error.message, 'danger');
                throw error;
            });
    }

    function loadParticipants() {
        fetch(`/api/participants/${eventId}`)
            .then(response => response.json())
            .then(participants => {
                if (!participants || participants.length === 0) {
                    participantsTable.innerHTML = '<tr><td colspan="5" class="text-center">Нет зарегистрированных участников</td></tr>';
                    return;
                }

                participantsTable.innerHTML = participants.map((p, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${p.full_name || ''}</td>
                        <td>${p.group || ''}</td>
                        <td>
                            ${p.visited
                                ? '<span class="badge bg-success">Присутствовал</span>'
                                : '<span class="badge bg-secondary">Не явился</span>'}
                        </td>
                    </tr>
                `).join('');
            })
            .catch(error => {
                console.error('Ошибка загрузки участников:', error);
                participantsTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Ошибка загрузки данных</td></tr>';
            });
    }

    function showSuccess(message) {
        resultDiv.innerHTML = `<div class="alert alert-success">${message}</div>`;
        resultDiv.style.display = 'block';
        setTimeout(() => { resultDiv.style.display = 'none'; }, 3000);
    }

    function showError(message) {
        manualCodeResult.innerHTML = `<div class="alert alert-danger">${message}</div>`;
        manualCodeResult.style.display = 'block';
        setTimeout(() => { manualCodeResult.style.display = 'none'; }, 3000);
    }

    function showManualResult(message, type) {
        manualCodeResult.innerHTML = `
            <div class="alert alert-${type}">
                ${message}
            </div>
        `;
        manualCodeResult.style.display = 'block';
        setTimeout(() => {
            manualCodeResult.style.display = 'none';
        }, 3000);
    }
});