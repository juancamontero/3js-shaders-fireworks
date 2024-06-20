import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'

import gsap from 'gsap'

import fireworkVertexShader from './shaders/firework/vertex.glsl'
import fireworkFragmentShader from './shaders/firework/fragment.glsl'
import { Sky } from 'three/examples/jsm/Addons.js'

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  // ? set pixel ratio to update particles sizes
  pixelRatio: Math.min(window.devicePixelRatio, 2),
}
//? to be sent as a uniform in the material
// ? update resolution using pixel ratio
sizes.resolution = new THREE.Vector2(
  sizes.width * sizes.pixelRatio,
  sizes.height * sizes.pixelRatio
)

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // * 3 PIXEL RATIO AND HEIGHT PROPORTION
  // ? to update the resolution uniform so the particles size
  //   sizes.resolution.set(sizes.width, sizes.height)

  // ? update resolution using pixel ratio
  sizes.resolution.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio
  )
  // ? update pixel ratio to update particles sizes
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.set(1.5, 0, 6)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

// * 4 Textures
// ? many textures cause randomly one of the will be use when a new fire works is triggered

const textures = [
  textureLoader.load('/particles/1.png'),
  textureLoader.load('/particles/2.png'),
  textureLoader.load('/particles/3.png'),
  textureLoader.load('/particles/4.png'),
  textureLoader.load('/particles/5.png'),
  textureLoader.load('/particles/6.png'),
  textureLoader.load('/particles/7.png'),
  textureLoader.load('/particles/8.png'),
]

// * 5 FIREWORKS

// * 1 BASE PARTICLES
//? create a function so we handle the click event to generate the particles
const createFirework = (count, position, size, texture, radius, color) => {
  // Geometry
  const positionsArray = new Float32Array(count * 3)
  const sizesArray = new Float32Array(count)
  //* 4-RANDOMNESS
  //? time multiplier for each particles
  const timeMultipliersArray = new Float32Array(count)

  // Generate random positions for the particles
  for (let i = 0; i < count; i++) {
    // lleno los vectores por cada iteración
    const i3 = i * 3

    // * get spherical shape
    const spherical = new THREE.Spherical(
      radius * (0.75 + Math.random() * 0.25), //? so the radius goes from 0.75 to 1.
      Math.random() * Math.PI, // half circumference from top to bottom - Phi
      Math.random() * Math.PI * 2 // full circumference from right to left - Theta
    )

    // * transform the spherical into vec3 position
    const position = new THREE.Vector3().setFromSpherical(spherical)

    positionsArray[i3] = position.x
    positionsArray[i3 + 1] = position.y
    positionsArray[i3 + 2] = position.z
    // Set random sizes for the particles
    sizesArray[i] = Math.random()
    // set random multiplier time for each particle
    //? 1 + random 'cause values below 1.0 make the particle burns slower than the whole animation tima
    timeMultipliersArray[i] = 1 + Math.random()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positionsArray, 3)
  )
  geometry.setAttribute(
    'aSize',
    new THREE.Float32BufferAttribute(sizesArray, 1)
  )
  geometry.setAttribute(
    'aTimeMultiplier',
    new THREE.Float32BufferAttribute(timeMultipliersArray, 1)
  )

  // set texture upside down
  texture.flipY = false

  // Material

  // Material

  const material = new THREE.ShaderMaterial({
    vertexShader: fireworkVertexShader,
    fragmentShader: fireworkFragmentShader,
    uniforms: {
      uSize: new THREE.Uniform(size), // Size of the particles
      uTime: new THREE.Uniform(0), // Time uniform
      //! particles are not resizing when the window is resized
      // ? so a resolution must be send to the vertex as a uniform
      uResolution: new THREE.Uniform(sizes.resolution),
      uTexture: new THREE.Uniform(texture), // Texture uniform
      uColor: new THREE.Uniform(color), // Color uniform
      uProgress: new THREE.Uniform(0), // Progress uniform. it will be use from 0 to 1 to animate
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending, // Additive blending for particles
  })

  // Points
  const firework = new THREE.Points(geometry, material)
  firework.position.copy(position) // Set the position of the firework
  scene.add(firework)

  // * 2 ANIMATE PARTICLES
  //? Function to dispones after animation
  const destroy = () => {
    //! Remove the firework after the animation completes
    scene.remove(firework)
    // Dispose of the geometry and material
    geometry.dispose()
    material.dispose()
    //? the textures can be used again ,so no dispose for them
  }

  // ? to control the progress
  gsap.to(material.uniforms.uProgress, {
    value: 1, // Animate from 0 to 1
    duration: 3, // Duration of the animation (secs),
    ease: 'linear',
    onComplete: destroy,
  })
}

//* 6-RANDOMNESS ON THE CLICKS
const createRandomFirework = () => {
  const count = Math.round(400 + Math.random() * 1000)
  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 2, // X: from -1 to +1
    Math.random(), //Y: from 0 to 1 - only in the sky
    (Math.random() - 0.5) * 2 // Z : from -1 to +1
  )
  const size = 0.1 + Math.random() * 0.1 // 0.1 to 0.2
  const texture = textures[Math.floor(Math.random() * textures.length)]
  const radius = 0.5 + Math.random() // 0 to 1
  const color = new THREE.Color()
  color.setHSL(Math.random(), 1, 0.7) //the 1st partameter goes from 0 (red) to 1.0 (red) ans between all the colors
  createFirework(count, position, size, texture, radius, color)
}

//! CALL FUNCTION
createRandomFirework()
// createFirework(
//   100, // Count
//   new THREE.Vector3(), // Position
//   0.5, // Size,
//   textures[7], //texture
//   1, //radius
//   new THREE.Color('#8affff') // color
// )

// * CLICK EVENT HANDLE
window.addEventListener('click', () => {
  createRandomFirework()
})

//* 8-SKY  from (https://github.com/mrdoob/three.js/blob/master/examples/webgl_shaders_sky.html)
// Add Sky
const sky = new Sky()
sky.scale.setScalar(450000)
scene.add(sky)

const sun = new THREE.Vector3()

const skyParameters = {
  turbidity: 10,
  rayleigh: 3,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.95,
  elevation: -2.2,
  azimuth: 180,
  exposure: renderer.toneMappingExposure
}

const updateSky = () => {
  const uniforms = sky.material.uniforms
  uniforms['turbidity'].value = skyParameters.turbidity
  uniforms['rayleigh'].value = skyParameters.rayleigh
  uniforms['mieCoefficient'].value = skyParameters.mieCoefficient
  uniforms['mieDirectionalG'].value = skyParameters.mieDirectionalG

  const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation)
  const theta = THREE.MathUtils.degToRad(skyParameters.azimuth)

  sun.setFromSphericalCoords(1, phi, theta)

  uniforms['sunPosition'].value.copy(sun)

  renderer.toneMappingExposure = skyParameters.exposure
  renderer.render(scene, camera)
}

gui.add(skyParameters, 'turbidity', 0.0, 20.0, 0.1).onChange(updateSky)
gui.add(skyParameters, 'rayleigh', 0.0, 4, 0.001).onChange(updateSky)
gui.add(skyParameters, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(updateSky)
gui.add(skyParameters, 'mieDirectionalG', 0.0, 1, 0.001).onChange(updateSky)
gui.add(skyParameters, 'elevation', -3, 10, 0.01).onChange(updateSky)
gui.add(skyParameters, 'azimuth', -180, 180, 0.1).onChange(updateSky)
gui.add(skyParameters, 'exposure', 0, 1, 0.0001).onChange(updateSky)

updateSky()

/**
 * Animate
 */
const tick = () => {
  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
