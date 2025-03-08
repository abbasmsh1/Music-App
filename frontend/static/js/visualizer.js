let canvas;
let ctx;
let analyser;
let dataArray;
let animationId;

function initVisualizer() {
    canvas = document.getElementById('visualizer');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    
    resize();
    window.addEventListener('resize', resize);

    // Set up audio analyzer
    if (audioContext && !analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    // Start animation
    animate();
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!analyser) return;

    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    ctx.fillStyle = '#282828';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw visualizer
    const barWidth = canvas.width / dataArray.length;
    const centerY = canvas.height / 2;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let i = 0; i < dataArray.length; i++) {
        const x = i * barWidth;
        const height = (dataArray[i] / 255) * canvas.height * 0.5;
        
        // Draw mirrored bars
        ctx.fillStyle = `hsl(${(i / dataArray.length) * 120 + 120}, 100%, 50%)`;
        ctx.fillRect(x, centerY - height, barWidth - 1, height);
        ctx.fillRect(x, centerY, barWidth - 1, height);
    }
}

// Initialize visualizer when audio is ready
document.addEventListener('DOMContentLoaded', () => {
    const checkAudio = setInterval(() => {
        if (audioContext) {
            initVisualizer();
            clearInterval(checkAudio);
        }
    }, 100);
}); 