document.addEventListener('DOMContentLoaded', function() {
    const registrationData = sessionStorage.getItem('lastRegistration');
    if (!registrationData) {
        window.location.href = 'index.html';
        return;
    }

    const { id, qrText } = JSON.parse(registrationData);
    document.getElementById('registrationId').textContent = id;
    generateQRCode(qrText);
    setupDownloadButton();

    function generateQRCode(text) {
        const container = document.getElementById('qrcode');
        if (!container) return;
    
        container.innerHTML = ''; 
    
        const img = document.createElement('img');
        img.alt = 'QR Code';
    
        new QRCode(container, {
            text: text,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    

    function setupDownloadButton() {
        const downloadBtn = document.getElementById('downloadBtn');
        if (!downloadBtn) return;
        
        downloadBtn.addEventListener('click', function() {
            const canvas = document.querySelector('#qrcode canvas');
            if (!canvas) {
                alert('QR-код не сгенерирован');
                return;
            }
            
            try {
                const link = document.createElement('a');
                link.download = `qr-code-${id}.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) {
                console.error('Ошибка скачивания QR-кода:', e);
                alert('Ошибка при скачивании QR-кода');
            }
        });
    }
});