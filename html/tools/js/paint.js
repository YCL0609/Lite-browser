const canvas = document.getElementById('pad');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0, lastY = 0;
let isErasing = false;

resizeCanvas();

canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);
canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDrawing = true;
    isErasing = (e.button === 2);
    [lastX, lastY] = [e.offsetX, e.offsetY];
});
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isErasing) {
        ctx.strokeStyle = isDark ? getComputedStyle(canvas).backgroundColor : 'white';
        ctx.lineWidth = 20;
    } else {
        ctx.strokeStyle = isDark ? 'white' : 'black';
        ctx.lineWidth = 2;
    }
    
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
});


window.addEventListener('resize', resizeCanvas);

document.addEventListener('DOMContentLoaded', () => {
    const noteID = showMessage(null, '左键绘制, 右键擦除, Ctrl+S保存图片');
    setTimeout(() => closeMessage(noteID), 2000);
});
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'canvas-image.png';
        link.href = image;
        link.click();
    }
});

function resizeCanvas() {
    const oldData = canvas.toDataURL();
    const img = new Image();
    img.src = oldData;
    
    img.onload = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.drawImage(img, 0, 0);
    };
}