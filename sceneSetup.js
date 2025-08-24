import * as THREE from 'three';
export function setupScene(container) {
    // Renderer
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent background initially
    container.appendChild(renderer.domElement);
    // Scene
    var scene = new THREE.Scene();
    // Add subtle ambient light
    var ambientLight = new THREE.AmbientLight(0xaaaaaa, 0.5); // Soft white light
    scene.add(ambientLight);
    // Add directional light for highlights
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    // Camera
    var camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 5); // Positioned slightly above and back
    camera.lookAt(0, 0, 0); // Look towards the center where the piano might be
    // Starfield Background
    var starGeometry = new THREE.BufferGeometry();
    var starVertices = [];
    for(var i = 0; i < 10000; i++){
        var x = THREE.MathUtils.randFloatSpread(2000); // Spread stars wider
        var y = THREE.MathUtils.randFloatSpread(2000);
        var z = THREE.MathUtils.randFloatSpread(2000);
        // Only add stars that are reasonably far out
        if (Math.sqrt(x * x + y * y + z * z) > 100) {
            starVertices.push(x, y, z);
        }
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    var starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.0,
        sizeAttenuation: true // Stars farther away appear smaller
    });
    var stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    // Set initial scene background color (Removed to allow transparency)
    // scene.background = new THREE.Color(0x050010); // Dark purple/blue space - Commented out or removed
    return {
        scene: scene,
        camera: camera,
        renderer: renderer,
        stars: stars,
        createShootingStarMesh: createShootingStarMesh
    };
}
// Function to create a single shooting star mesh
function createShootingStarMesh() {
    // Simple line geometry for the trail
    var points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(0, 0, -1)); // Short tail pointing back
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        linewidth: 2.5,
        transparent: true,
        opacity: 0.9,
        depthWrite: false // Prevent stars from interfering with depth of objects behind them (like the piano)
    });
    var shootingStar = new THREE.Line(geometry, material);
    // --- Initial Properties (to be set in Game.js) ---
    // Position: Randomly set high up and far out
    var radius = 600 + Math.random() * 300; // Start a bit closer (600-900 units)
    var theta = Math.random() * Math.PI * 2; // Angle around Y
    var phi = Math.acos(Math.random() * 1.6 - 0.8); // Bias towards more horizontal trajectories (less straight down/up)
    shootingStar.position.setFromSphericalCoords(radius, phi, theta);
    // Velocity: Pointing roughly towards the center, but with variation
    var velocity = new THREE.Vector3();
    velocity.subVectors(new THREE.Vector3(0, 0, 0), shootingStar.position).normalize(); // Point towards origin
    // Add some randomness to the direction
    velocity.x += THREE.MathUtils.randFloatSpread(0.3);
    velocity.y += THREE.MathUtils.randFloatSpread(0.3);
    velocity.z += THREE.MathUtils.randFloatSpread(0.4); // Slightly more direction variation
    velocity.normalize();
    velocity.multiplyScalar(THREE.MathUtils.randFloat(250, 450)); // Increased speed
    shootingStar.userData.velocity = velocity;
    shootingStar.userData.lifetime = 0; // Track how long it has lived
    shootingStar.userData.maxLifetime = THREE.MathUtils.randFloat(2, 4); // Live for slightly shorter time due to higher speed
    shootingStar.renderOrder = 0; // Ensure stars render before piano
    return shootingStar;
}
