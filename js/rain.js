class MatrixRain {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // 配置项
        this.options = {
            fontSize: /Windows/i.test(this.userAgent) ? 16 : 20,
            chars: "ILOVEYOU❤️",
            color: '#6B0536',
            isRandomColor: false,
            speed: 50,
            ...options
        };

        this.init();
    }

    init() {
        // 初始化画布尺寸
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 初始化字体
        this.ctx.font = `${this.options.fontSize}px 微软雅黑`;
        this.words = Array(256).join("1").split("");

        // 开始动画
        this.startAnimation();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.w = this.canvas.width;
        this.h = this.canvas.height;
    }

    color() {
        if (!this.options.isRandomColor) {
            return this.options.color;
        }
        const colors = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'];
        let color = "#";
        for (let i = 0; i < 6; i++) {
            const n = Math.ceil(Math.random() * 15);
            color += colors[n];
        }
        return color;
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
        this.ctx.fillRect(0, 0, this.w, this.h);
        this.ctx.fillStyle = this.color();

        this.words.map((y, n) => {
            const text = this.options.chars.charAt(Math.floor(Math.random() * this.options.chars.length));
            const x = n * 10;
            this.ctx.fillText(text, x, y);
            
            const increment = /Windows/i.test(this.userAgent) ? 16 : 20;
            this.words[n] = (y > (this.h / 2) + Math.random() * this.w) ? 0 : y + increment;
        });
    }

    startAnimation() {
        setInterval(() => this.draw(), this.options.speed);
    }
}


// 页面加载完成后初始化 Matrix 效果
document.addEventListener('DOMContentLoaded', () => {
    const matrix = new MatrixRain('canvas', {
        isRandomColor: false,
        color: '#6B0536',
        speed: 50
    });
});