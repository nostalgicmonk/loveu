        
/*
 * Settings
 */
var settings = {
  particles: {
    length:   500, // maximum amount of particles
    duration:   2, // particle duration in sec
    velocity: 100, // particle velocity in pixels/sec
    effect: -0.75, // play with this for a nice effect
    size:      30, // particle size in pixels
  },
  colors: {
    heart: '#ea80b0',  // 添加颜色设置
    text: '#ea80b0'
  }
};

/*
 * RequestAnimationFrame polyfill by Erik M?ller
 */
(function(){var b=0;var c=["ms","moz","webkit","o"];for(var a=0;a<c.length&&!window.requestAnimationFrame;++a){window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"]}if(!window.requestAnimationFrame){window.requestAnimationFrame=function(h,e){var d=new Date().getTime();var f=Math.max(0,16-(d-b));var g=window.setTimeout(function(){h(d+f)},f);b=d+f;return g}}if(!window.cancelAnimationFrame){window.cancelAnimationFrame=function(d){clearTimeout(d)}}}());

/*
 * Point class
 */
var Point = (function() {
  function Point(x, y) {
    this.x = (typeof x !== 'undefined') ? x : 0;
    this.y = (typeof y !== 'undefined') ? y : 0;
  }
  Point.prototype.clone = function() {
    return new Point(this.x, this.y);
  };
  Point.prototype.length = function(length) {
    if (typeof length == 'undefined')
      return Math.sqrt(this.x * this.x + this.y * this.y);
    this.normalize();
    this.x *= length;
    this.y *= length;
    return this;
  };
  Point.prototype.normalize = function() {
    var length = this.length();
    this.x /= length;
    this.y /= length;
    return this;
  };
  return Point;
})();

/*
 * Particle class
 */

var Particle = (function() {
  function Particle() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
  }
  Particle.prototype.initialize = function(x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * settings.particles.effect;
    this.acceleration.y = dy * settings.particles.effect;
    this.age = 0;
  };
  Particle.prototype.update = function(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
  };
  Particle.prototype.draw = function(context, image) {
    function ease(t) {
      return (--t) * t * t + 1;
    }
    var size = image.width * ease(this.age / settings.particles.duration);
    context.globalAlpha = 1 - this.age / settings.particles.duration;
    context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
  };
  return Particle;
})();

/*
 * ParticlePool class
 */
var ParticlePool = (function() {
  var particles,
      firstActive = 0,
      firstFree   = 0,
      duration    = settings.particles.duration;
  
  function ParticlePool(length) {
    // create and populate particle pool
    particles = new Array(length);
    for (var i = 0; i < particles.length; i++)
      particles[i] = new Particle();
  }
  ParticlePool.prototype.add = function(x, y, dx, dy) {
    particles[firstFree].initialize(x, y, dx, dy);
    
    // handle circular queue
    firstFree++;
    if (firstFree   == particles.length) firstFree   = 0;
    if (firstActive == firstFree       ) firstActive++;
    if (firstActive == particles.length) firstActive = 0;
  };
  ParticlePool.prototype.update = function(deltaTime) {
    var i;
    
    // update active particles
    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++)
        particles[i].update(deltaTime);
    }
    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].update(deltaTime);
      for (i = 0; i < firstFree; i++)
        particles[i].update(deltaTime);
    }
    
    // remove inactive particles
    while (particles[firstActive].age >= duration && firstActive != firstFree) {
      firstActive++;
      if (firstActive == particles.length) firstActive = 0;
    }
    
    
  };
  ParticlePool.prototype.draw = function(context, image) {
    // draw active particles
    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++)
        particles[i].draw(context, image);
    }
    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].draw(context, image);
      for (i = 0; i < firstFree; i++)
        particles[i].draw(context, image);
    }
  };
  return ParticlePool;
})();

/*
 * Putting it all together
 */
(function() {
  // 等待页面加载完成
  window.addEventListener('load', function() {
    // 创建 canvas 元素
    var canvas = document.createElement('canvas');
    canvas.id = 'heartCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    // 监听文字特效完成事件
    window.addEventListener('textAnimationComplete', function() {
      var context = canvas.getContext('2d'),
          particles = new ParticlePool(settings.particles.length),
          particleRate = settings.particles.length / settings.particles.duration,
          time;
    
    // get point on heart with -PI <= t <= PI
    // 修改爱心大小参数
    function pointOnHeart(t) {
      return new Point(
        320 * Math.pow(Math.sin(t), 3),  // 从160增加到320
        260 * Math.cos(t) - 100 * Math.cos(2 * t) - 40 * Math.cos(3 * t) - 20 * Math.cos(4 * t) + 50  // 所有参数翻倍
      );
    }
    
    // 创建心形图像
    var image = (function() {
      var canvas  = document.createElement('canvas'),
          context = canvas.getContext('2d');
      canvas.width  = settings.particles.size;
      canvas.height = settings.particles.size;
      
      function to(t) {
        var point = pointOnHeart(t);
        point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
        point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
        return point;
      }
      
      context.beginPath();
      var t = -Math.PI;
      var point = to(t);
      context.moveTo(point.x, point.y);
      while (t < Math.PI) {
        t += 0.01;
        point = to(t);
        context.lineTo(point.x, point.y);
      }
      context.closePath();
      context.fillStyle = settings.colors.heart;  // 使用颜色变量
      context.fill();
      
      var image = new Image();
      image.src = canvas.toDataURL();
      return image;
    })();
    
    function render() {
      requestAnimationFrame(render);
      
      var newTime = new Date().getTime() / 1000,
          deltaTime = newTime - (time || newTime);
      time = newTime;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      var amount = particleRate * deltaTime;
      for (var i = 0; i < amount; i++) {
        var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
        var dir = pos.clone().length(settings.particles.velocity);
        particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
      }
      
      particles.update(deltaTime);
      particles.draw(context, image);
      
      // 添加文字，使用百分比计算位置
      context.font = '30px Arial';
      context.fillStyle = settings.colors.text;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      // 将文字位置设置在爱心高度的三分之二处
      var heartHeight = 520; // 爱心的总高度（260 * 2）
      var offsetY = (heartHeight / 3) * 2; // 计算三分之二的位置
      context.fillText('💗我会永远陪着你', canvas.width / 2, canvas.height / 2 - offsetY * 0.3);
    }
    
    function onResize() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    
    onResize();
    window.addEventListener('resize', onResize);
    render();
    });
  });
})();