(function() {
    const canvas = document.getElementById('led-monitor-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    const mouse = {
        x: null,
        y: null,
        radius: 120
    };

    let rotationAngle = 0;
    const rotationSpeed = 0.005;
    const tiltAngle = 0.4; // Slightly tilted axis (~23 degrees)
    const perspective = 600;

    window.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    });

    window.addEventListener('mouseout', function() {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor(x, y, z, color) {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.baseX = x;
            this.baseY = y;
            this.baseZ = z;
            this.color = color;
            this.size = 2;
            this.vx = 0;
            this.vy = 0;
            this.friction = 0.95;
            this.spring = 0.08;
            this.repulsion = 7;
        }

        draw(projX, projY, projSize, opacity) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(this.x, this.y, projSize, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        update(targetX, targetY) {
            // Force towards rotated target point
            let dxTarget = targetX - this.x;
            let dyTarget = targetY - this.y;
            this.vx += dxTarget * this.spring;
            this.vy += dyTarget * this.spring;

            // Force from mouse
            if (mouse.x !== null) {
                let dxMouse = mouse.x - this.x;
                let dyMouse = mouse.y - this.y;
                let distance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                
                if (distance < mouse.radius) {
                    let force = (mouse.radius - distance) / mouse.radius;
                    this.vx -= (dxMouse / distance) * force * this.repulsion;
                    this.vy -= (dyMouse / distance) * force * this.repulsion;
                }
            }

            // Apply friction and update position
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    function init() {
        const container = canvas.closest('.home_right_img');
        const rect = container ? container.getBoundingClientRect() : canvas.parentNode.getBoundingClientRect();
        
        canvas.width = rect.width;
        canvas.height = rect.height || 500;

        particles = [];
        const radius = 170; // Bigger as requested
        const latitudeCount = 20;
        const longitudeCount = 35;
        const colorBase = '#854fee';

        for (let i = 0; i <= latitudeCount; i++) {
            const phi = Math.PI * (i / latitudeCount);
            for (let j = 0; j < longitudeCount; j++) {
                const theta = 2 * Math.PI * (j / longitudeCount);
                
                const baseX = radius * Math.sin(phi) * Math.cos(theta);
                const baseY = radius * Math.cos(phi);
                const baseZ = radius * Math.sin(phi) * Math.sin(theta);

                // Alternate colors slightly for a premium look
                const color = (i + j) % 2 === 0 ? '#854fee' : '#4458dc';
                particles.push(new Particle(baseX, baseY, baseZ, color));
            }
        }
    }

    function rotate(x, y, z, angleY, angleX) {
        // Rotate around Y axis
        let cosY = Math.cos(angleY);
        let sinY = Math.sin(angleY);
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;

        // Rotate around X axis (for tilt)
        let cosX = Math.cos(angleX);
        let sinX = Math.sin(angleX);
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        return { x: x1, y: y2, z: z2 };
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rotationAngle += rotationSpeed;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            // 1. Calculate rotated 3D position
            const rotated = rotate(p.baseX, p.baseY, p.baseZ, rotationAngle, tiltAngle);

            // 2. Project 3D to 2D
            const scale = perspective / (perspective + rotated.z);
            const targetX = rotated.x * scale + centerX;
            const targetY = rotated.y * scale + centerY;

            // 3. Update particle physics towards the projected target
            p.update(targetX, targetY);

            // 4. Draw particle with depth-based effects
            const opacity = (rotated.z + 170) / 340 * 0.7 + 0.3; // More visible if closer
            const dotSize = p.size * scale;
            p.draw(targetX, targetY, dotSize, opacity);
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', function() {
        init();
    });

    init();
    animate();
})();
