'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MAP_THEMES, ThemeKey, PIPE_MODELS, PIPE_NAMES } from '@/lib/pipes'
import { slotColorsToArray } from '@/lib/colors'

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID = 1
const BASE_SCALE = 0.333   // matches desktop
const MERGE_RADIUS = 1.5
const MERGE_SCALE = 1.75

// ─── Three.js helpers ─────────────────────────────────────────────────────────

function toFlat(mesh: THREE.Mesh) {
  const conv = (m: THREE.Material) => new THREE.MeshBasicMaterial({
    color: (m as THREE.MeshStandardMaterial).color?.clone() ?? new THREE.Color(0xcccccc),
    side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  })
  mesh.material = Array.isArray(mesh.material) ? mesh.material.map(conv) : conv(mesh.material)
}

function makePipeMat(hex: string) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(hex),
    side: THREE.DoubleSide,
    toneMapped: false,
  })
}

function snapGrid(v: number) { return Math.round(v / GRID) * GRID }
function cellKey(x: number, z: number) { return `${x}|${z}` }

function loadGLB(url: string): Promise<THREE.Group> {
  return new Promise((res, rej) => new GLTFLoader().load(url, g => res(g.scene), undefined, rej))
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlacedEntry {
  x: number; z: number; y: number; scale: number
  obj: THREE.Object3D; modelFile: string; colors: string[]
  photos: string[]
}

interface BubbleAnim {
  mesh: THREE.Mesh; bx: number; bz: number; baseY: number
  vx: number; vz: number; maxSpread: number; maxH: number
  startMs: number; delay: number; duration: number
}

interface FloatingBubble {
  mesh: THREE.Mesh
  cellKey: string
  centerX: number; centerY: number; centerZ: number
  radius: number
  theta: number
  phi: number
  thetaSpeed: number
  phiSpeed: number
  radiusSpeed: number
  radiusAmplitude: number
  baseRadius: number
  phase: number
}

interface CamAnim {
  fromTarget: THREE.Vector3; toTarget: THREE.Vector3
  fromPos: THREE.Vector3;    toPos: THREE.Vector3
  startMs: number;           durationMs: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapDefault() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const mapFieldRef = useRef<THREE.Object3D | null>(null)
  const currentMapRef = useRef<THREE.Group | null>(null)
  const gradMeshRef = useRef<THREE.LineSegments | null>(null)
  const highlightRef = useRef<THREE.Mesh | null>(null)
  const selectedHighlightRef = useRef<THREE.Mesh | null>(null)
  const markerRef = useRef<THREE.Object3D | null>(null)
  const rafRef = useRef(0)
  const bubblesRef = useRef<BubbleAnim[]>([])
  const floatingBubblesRef = useRef<FloatingBubble[]>([])
  const placedRef = useRef<Map<string, PlacedEntry>>(new Map())
  const markerPosRef = useRef<{ x: number; z: number; y: number } | null>(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const surfaceYRef = useRef(0)   // map surface world-Y, set after GLB loads
  const prevCameraRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const camAnimRef = useRef<CamAnim | null>(null)
  const isFirstLoadRef = useRef(true)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const cameraHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // State
  const [theme, setTheme] = useState<ThemeKey>('blue')
  const [gridMode, setGridMode] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ x: number; z: number } | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [nameToast, setNameToast] = useState<{ text: string; id: number } | null>(null)
  const [photoPopup, setPhotoPopup] = useState<{ photos: string[] } | null>(null)
  const [locationActive, setLocationActive] = useState(false)
  const [cameraVisible, setCameraVisible] = useState(true)
  const [themeOpen, setThemeOpen] = useState(false)
  const themeContainerRef = useRef<HTMLDivElement>(null)

  // ── Scene init ──
  useEffect(() => {
    const canvas = canvasRef.current!
    const W = window.innerWidth
    const H = window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(MAP_THEMES.blue.bg)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(22, W / H, 0.1, 2000)
    // 45° azimuth, 35° elevation from horizontal
    camera.position.set(70, 56, 70)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    // Match desktop: AgXToneMapping + exposure 1.3
    // Pipe materials use toneMapped:false to bypass and show exact colors
    renderer.toneMapping = THREE.AgXToneMapping
    renderer.toneMappingExposure = 1.3
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxPolarAngle = Math.PI / 2.2
    controls.minPolarAngle = 0
    controls.minDistance = 8
    controls.maxDistance = 300
    controls.zoomSpeed = 0.4
    controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_ROTATE,
    }
    controlsRef.current = controls

    const hideCameraBtn = () => {
      if (cameraHideTimer.current) clearTimeout(cameraHideTimer.current)
      cameraHideTimer.current = setTimeout(() => setCameraVisible(false), 800)
    }
    const showCameraBtn = () => {
      if (cameraHideTimer.current) clearTimeout(cameraHideTimer.current)
      setCameraVisible(true)
    }
    controls.addEventListener('start', hideCameraBtn)
    controls.addEventListener('end', showCameraBtn)

    // Hover highlight
    const hlGeo = new THREE.PlaneGeometry(GRID - 0.05, GRID - 0.05)
    hlGeo.rotateX(-Math.PI / 2)
    const hl = new THREE.Mesh(hlGeo, new THREE.MeshBasicMaterial({
      color: 0x008CBF, opacity: 0.3, transparent: true, depthWrite: false, depthTest: false,
    }))
    hl.visible = false; hl.renderOrder = 2
    scene.add(hl)
    highlightRef.current = hl

    // Selected (fixed) highlight
    const selGeo = new THREE.PlaneGeometry(GRID - 0.05, GRID - 0.05)
    selGeo.rotateX(-Math.PI / 2)
    const sel = new THREE.Mesh(selGeo, new THREE.MeshBasicMaterial({
      color: 0x008CBF, opacity: 1, transparent: false, depthWrite: false, depthTest: false,
    }))
    sel.visible = false; sel.renderOrder = 3
    scene.add(sel)
    selectedHighlightRef.current = sel

    // Tick
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      controls.update()

      // Bubble animations
      const now = performance.now()
      bubblesRef.current = bubblesRef.current.filter(b => {
        const elapsed = now - b.startMs - b.delay
        if (elapsed < 0) return true
        const t = Math.min(1, elapsed / b.duration)
        if (t >= 1) { scene.remove(b.mesh); return false }
        const spread = b.maxSpread * (1 - Math.pow(1 - t, 2))
        b.mesh.position.x = b.bx + b.vx * spread
        b.mesh.position.z = b.bz + b.vz * spread
        b.mesh.position.y = b.baseY + b.maxH * 4 * t * (1 - t)
        const FADE = 0.85
        const alpha = t > FADE ? 1 - Math.pow((t - FADE) / (1 - FADE), 2) : 1;
        (b.mesh.material as THREE.MeshBasicMaterial).opacity = alpha
        return true
      })

      // Floating bubble animation (spherical orbit)
      const nowSec = performance.now() / 1000
      floatingBubblesRef.current.forEach(b => {
        b.theta += b.thetaSpeed * 0.016
        b.phi += b.phiSpeed * 0.016
        if (b.phi > Math.PI * 0.4) { b.phi = Math.PI * 0.4; b.phiSpeed *= -1 }
        if (b.phi < -Math.PI * 0.4) { b.phi = -Math.PI * 0.4; b.phiSpeed *= -1 }
        const r = b.baseRadius + Math.sin(nowSec * b.radiusSpeed + b.phase) * b.radiusAmplitude
        b.mesh.position.x = b.centerX + r * Math.cos(b.phi) * Math.cos(b.theta)
        b.mesh.position.z = b.centerZ + r * Math.cos(b.phi) * Math.sin(b.theta)
        b.mesh.position.y = b.centerY + r * Math.sin(b.phi)
      })

      // Camera focus animation (ease-out cubic)
      if (camAnimRef.current) {
        const ca = camAnimRef.current
        const t = Math.min(1, (performance.now() - ca.startMs) / ca.durationMs)
        const e = 1 - Math.pow(1 - t, 3)
        controls.target.lerpVectors(ca.fromTarget, ca.toTarget, e)
        camera.position.lerpVectors(ca.fromPos, ca.toPos, e)
        if (t >= 1) { camAnimRef.current = null; controls.update() }
      }

      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      controls.removeEventListener('start', hideCameraBtn)
      controls.removeEventListener('end', showCameraBtn)
      renderer.dispose()
    }
  }, [])

  // ── Load map theme ──
  const loadMap = useCallback(async (themeKey: ThemeKey) => {
    const scene = sceneRef.current!
    const t = MAP_THEMES[themeKey]

    if (currentMapRef.current) {
      scene.remove(currentMapRef.current)
      currentMapRef.current = null
      mapFieldRef.current = null
    }

    const gltf = await loadGLB(`/maps/${t.file}`)
    gltf.traverse(obj => {
      if (obj instanceof THREE.Mesh) toFlat(obj)
      if (obj.name === t.fieldName) mapFieldRef.current = obj
    })
    if (themeKey === 'yellow') {
      gltf.traverse(obj => {
        if (!(obj instanceof THREE.Mesh)) return
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m: THREE.Material) => { m.toneMapped = false })
      })
    }
    scene.add(gltf)
    scene.updateMatrixWorld(true)
    currentMapRef.current = gltf

    scene.background = new THREE.Color(t.bg)

    // Measure surface Y: raycast downward at map center against full scene
    const box = new THREE.Box3().setFromObject(gltf)
    const mc = box.getCenter(new THREE.Vector3())
    const groundRc = new THREE.Raycaster()
    groundRc.set(new THREE.Vector3(mc.x, box.max.y + 10, mc.z), new THREE.Vector3(0, -1, 0))
    const target = mapFieldRef.current ?? gltf
    const groundHits = groundRc.intersectObject(target, true)
    if (groundHits.length > 0) {
      surfaceYRef.current = groundHits[0].point.y
    } else if (mapFieldRef.current) {
      const fb = new THREE.Box3().setFromObject(mapFieldRef.current)
      surfaceYRef.current = fb.max.y
    } else {
      surfaceYRef.current = box.min.y + (box.max.y - box.min.y) * 0.15 // best-guess ground
    }
    console.log('[map] fieldName:', t.fieldName, '| found:', !!mapFieldRef.current, '| surfaceY:', surfaceYRef.current)

    // Set camera target to map center
    const center = box.getCenter(new THREE.Vector3())

    // ── Marker placement — sessionStorage 우선, 없으면 랜덤 생성 ──
    const savedPos = sessionStorage.getItem('markerPos')
    if (savedPos) {
      try {
        const { x, z, y } = JSON.parse(savedPos)
        markerPosRef.current = { x, z, y }
        placeMarker(x, y, z)
      } catch { /* ignore, fall through to random */ }
    }
    if (!markerPosRef.current && mapFieldRef.current) {
      const mbox = new THREE.Box3().setFromObject(mapFieldRef.current)
      const rc = new THREE.Raycaster()
      let placed = false
      for (let attempt = 0; attempt < 30; attempt++) {
        const marginX = (mbox.max.x - mbox.min.x) * 0.2
        const marginZ = (mbox.max.z - mbox.min.z) * 0.2
        const rx = mbox.min.x + marginX + Math.random() * (mbox.max.x - mbox.min.x - marginX * 2)
        const rz = mbox.min.z + marginZ + Math.random() * (mbox.max.z - mbox.min.z - marginZ * 2)
        rc.set(new THREE.Vector3(rx, mbox.max.y + 10, rz), new THREE.Vector3(0, -1, 0))
        const hits = rc.intersectObject(mapFieldRef.current, true)
        if (hits.length > 0) {
          const { x, y, z } = hits[0].point
          markerPosRef.current = { x, z, y: y + 0.5 }
          placeMarker(x, y, z)
          sessionStorage.setItem('markerPos', JSON.stringify({ x, z, y: y + 0.5 }))
          placed = true
          break
        }
      }
      if (!placed) {
        const cx = (mbox.min.x + mbox.max.x) / 2
        const cz = (mbox.min.z + mbox.max.z) / 2
        const cy = mbox.max.y + 0.5
        markerPosRef.current = { x: cx, z: cz, y: cy }
        placeMarker(cx, cy, cz)
        sessionStorage.setItem('markerPos', JSON.stringify({ x: cx, z: cz, y: cy }))
      }
    }

    // [2] First load: focus camera on my location
    if (isFirstLoadRef.current && markerPosRef.current) {
      const { x, y, z } = markerPosRef.current
      controlsRef.current!.target.set(x, y - 0.5, z)
      cameraRef.current!.position.set(x + 30, y + 24, z + 30)
      controlsRef.current!.update()
      isFirstLoadRef.current = false
    } else {
      controlsRef.current!.target.copy(center)
      cameraRef.current!.position.set(center.x + 70, center.y + 56, center.z + 70)
      controlsRef.current!.update()
    }

    // [6] Update highlight colors for theme
    const hlColor = themeKey === 'blue' ? 0xFBD600 : themeKey === 'yellow' ? 0x018CBF : 0x008CBF
    const hlMat = highlightRef.current?.material as THREE.MeshBasicMaterial | undefined
    const selMat = selectedHighlightRef.current?.material as THREE.MeshBasicMaterial | undefined
    if (hlMat) hlMat.color.set(hlColor)
    if (selMat) selMat.color.set(hlColor)

    setMapLoaded(true)
  }, [])

  useEffect(() => { loadMap('blue') }, [loadMap])

  function placeMarker(x: number, y: number, z: number, themeKey: ThemeKey = theme) {
    const scene = sceneRef.current!
    if (markerRef.current) scene.remove(markerRef.current)

    // yellow 테마에서는 파란 마커, 나머지는 노란 마커
    const markerColor = themeKey === 'yellow' ? 0x018CBF : 0xFBD600

    const group = new THREE.Group()
    group.position.set(x, y + 0.28, z)

    const outerGeo = new THREE.RingGeometry(0.4, 0.52, 48)
    outerGeo.rotateX(-Math.PI / 2)
    const outer = new THREE.Mesh(outerGeo, new THREE.MeshBasicMaterial({
      color: markerColor, opacity: 1, transparent: false, depthWrite: false, toneMapped: false,
    }))
    group.add(outer)

    const innerGeo = new THREE.CircleGeometry(0.28, 48)
    innerGeo.rotateX(-Math.PI / 2)
    const inner = new THREE.Mesh(innerGeo, new THREE.MeshBasicMaterial({
      color: markerColor, opacity: 1, transparent: false, depthWrite: false, toneMapped: false,
    }))
    group.add(inner)

    group.visible = false
    group.renderOrder = 10
    scene.add(group)
    markerRef.current = group
  }

  // ── Grid overlay ──
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    if (gradMeshRef.current) {
      scene.remove(gradMeshRef.current)
      gradMeshRef.current = null
    }

    if (!gridMode || !mapFieldRef.current) return

    const box = new THREE.Box3().setFromObject(mapFieldRef.current)
    const minX = Math.floor(box.min.x), maxX = Math.ceil(box.max.x)
    const minZ = Math.floor(box.min.z), maxZ = Math.ceil(box.max.z)
    const y = (surfaceYRef.current > 0 ? surfaceYRef.current : box.max.y) + 0.02

    const pts: number[] = []
    for (let x = minX; x <= maxX; x++) {
      pts.push(x, y, minZ, x, y, maxZ)
    }
    for (let z = minZ; z <= maxZ; z++) {
      pts.push(minX, y, z, maxX, y, z)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      color: 0xffffff, opacity: 0.4, transparent: true,
    }))
    lines.renderOrder = 1
    scene.add(lines)
    gradMeshRef.current = lines
  }, [gridMode, mapLoaded])

  // ── Touch/mouse events ──
  const getHit = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const mapField = mapFieldRef.current
    if (!canvas || !mapField) return null
    const rect = canvas.getBoundingClientRect()
    mouseRef.current.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!)
    const hits = raycasterRef.current.intersectObject(mapField, true)
    return hits[0] ?? null
  }, [])

  const onCanvasClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number, clientY: number
    if ('touches' in e) {
      const t = e.changedTouches[0]
      clientX = t.clientX; clientY = t.clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }

    // Check pipe objects first
    const wrappers = [...placedRef.current.values()].map(p => p.obj)
    if (wrappers.length > 0) {
      mouseRef.current.set(
        ((clientX - canvasRef.current!.getBoundingClientRect().left) / canvasRef.current!.clientWidth) * 2 - 1,
        -((clientY - canvasRef.current!.getBoundingClientRect().top) / canvasRef.current!.clientHeight) * 2 + 1,
      )
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!)
      const pipeHits = raycasterRef.current.intersectObjects(wrappers, true)
      if (pipeHits.length > 0) {
        const hitMesh = pipeHits[0].object
        for (const entry of placedRef.current.values()) {
          let node: THREE.Object3D | null = hitMesh
          while (node) {
            if (node === entry.obj) {
              // [2] Animate camera target to clicked pipe
              const fromTarget = controlsRef.current!.target.clone()
              const toTarget = new THREE.Vector3(entry.x, entry.y, entry.z)
              const startMs = performance.now()
              const dur = 600
              const animTarget = () => {
                const t = Math.min(1, (performance.now() - startMs) / dur)
                const ev = 1 - Math.pow(1 - t, 3)
                controlsRef.current!.target.lerpVectors(fromTarget, toTarget, ev)
                controlsRef.current!.update()
                if (t < 1) requestAnimationFrame(animTarget)
              }
              requestAnimationFrame(animTarget)
              setPhotoPopup({ photos: entry.photos })
              return
            }
            node = node.parent
          }
        }
      }
    }

    const hit = getHit(clientX, clientY)
    if (!hit) return

    if (gridMode) {
      const sx = snapGrid(hit.point.x), sz = snapGrid(hit.point.z)
      setSelectedCell({ x: sx, z: sz })
      if (selectedHighlightRef.current) {
        selectedHighlightRef.current.position.set(sx, hit.point.y + 0.05, sz)
        selectedHighlightRef.current.visible = true
      }
    }
  }, [gridMode, getHit])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gridMode) return
    const hit = getHit(e.clientX, e.clientY)
    if (hit) {
      const sx = snapGrid(hit.point.x), sz = snapGrid(hit.point.z)
      highlightRef.current!.position.set(sx, hit.point.y + 0.05, sz)
      highlightRef.current!.visible = true
    }
  }, [gridMode, getHit])

  // ── Go to camera ──
  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Save cell position before navigating
    if (selectedCell) {
      sessionStorage.setItem('selectedCell', JSON.stringify(selectedCell))
    } else if (markerPosRef.current) {
      const sx = snapGrid(markerPosRef.current.x)
      const sz = snapGrid(markerPosRef.current.z)
      sessionStorage.setItem('selectedCell', JSON.stringify({ x: sx, z: sz }))
    }
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      try {
        sessionStorage.setItem('capturedImage', dataUrl)
      } catch {
        sessionStorage.setItem('capturedImage', canvas.toDataURL('image/jpeg', 0.5))
      }
      router.push('/extract')
    }
    img.src = objectUrl
    e.target.value = ''
  }

  // ── Focus marker (toggle) ──
  const focusMarker = useCallback(() => {
    const controls = controlsRef.current!
    const camera = cameraRef.current!

    if (locationActive) {
      // Deselect: hide marker + restore previous camera state
      if (markerRef.current) markerRef.current.visible = false
      if (prevCameraRef.current) {
        controls.target.copy(prevCameraRef.current.target)
        camera.position.copy(prevCameraRef.current.pos)
        controls.update()
        prevCameraRef.current = null
      }
      setLocationActive(false)
    } else {
      if (!markerPosRef.current) return
      // Save current camera state before moving
      prevCameraRef.current = {
        pos: camera.position.clone(),
        target: controls.target.clone(),
      }
      const { x, y, z } = markerPosRef.current
      const fromTarget = controls.target.clone()
      const toTarget = new THREE.Vector3(x, y - 0.5, z)
      const fromCamPos = camera.position.clone()
      const toCamPos = new THREE.Vector3(x + 20, y + 16, z + 20)
      const startMs = performance.now()
      const dur = 700
      const animFocus = () => {
        const t = Math.min(1, (performance.now() - startMs) / dur)
        const ev = 1 - Math.pow(1 - t, 3)
        controls.target.lerpVectors(fromTarget, toTarget, ev)
        camera.position.lerpVectors(fromCamPos, toCamPos, ev)
        controls.update()
        if (t < 1) requestAnimationFrame(animFocus)
      }
      requestAnimationFrame(animFocus)
      if (markerRef.current) markerRef.current.visible = true
      setLocationActive(true)
    }
  }, [locationActive])

  // ── Theme switch ──
  const switchTheme = useCallback(async (key: ThemeKey) => {
    setTheme(key)
    await loadMap(key)
  }, [loadMap])

  // ── Theme dropdown outside click ──
  useEffect(() => {
    if (!themeOpen) return
    const handler = (e: MouseEvent) => {
      if (themeContainerRef.current && !themeContainerRef.current.contains(e.target as Node)) {
        setThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [themeOpen])

  // ── Load pipes (single effect to prevent duplicate spawning) ──
  // localStorage = source of truth for all pipes
  // sessionStorage.newPipe = marker for which pipe to animate (newly added)
  useEffect(() => {
    if (!mapLoaded) return

    // Read new-pipe marker from sessionStorage — used for animation only
    const newRaw = sessionStorage.getItem('newPipe')
    if (newRaw) sessionStorage.removeItem('newPipe')
    let newPos: { x: number; z: number } | null = null
    try { if (newRaw) newPos = JSON.parse(newRaw) } catch {}

    // Spawn all pipes from localStorage (single source of truth)
    let stored: PlacedEntry[] = []
    try { stored = JSON.parse(localStorage.getItem('pipes') ?? '[]') } catch { return }

    // [2] Filter: only spawn entries with valid colors and modelFile
    const valid = stored.filter(p =>
      p.modelFile &&
      Array.isArray(p.colors) && p.colors.length > 0
    )

    valid.forEach(p => {
      if (placedRef.current.has(cellKey(p.x, p.z))) return
      const isNew = !!newPos && p.x === newPos.x && p.z === newPos.z
      const scale = p.scale ?? BASE_SCALE
      spawnPipe(p.x, p.z, 0, scale, p.colors, p.modelFile, p.photos ?? [], isNew)
        .then(() => {
          if (!isNew) spawnFloatingBubbles(p.x, p.z, surfaceYRef.current, scale, cellKey(p.x, p.z))

          // [2] 새 파이프일 때 마커 위치를 랜덤 1~3칸 이동
          if (isNew && markerPosRef.current && mapFieldRef.current) {
            const pos = markerPosRef.current
            const fieldBox = new THREE.Box3().setFromObject(mapFieldRef.current!)
            const move = Math.floor(Math.random() * 3) + 1
            const angle = Math.random() * Math.PI * 2
            const newX = Math.max(fieldBox.min.x, Math.min(fieldBox.max.x,
              pos.x + Math.round(Math.cos(angle) * move)))
            const newZ = Math.max(fieldBox.min.z, Math.min(fieldBox.max.z,
              pos.z + Math.round(Math.sin(angle) * move)))
            const newMarkerPos = { x: newX, z: newZ, y: pos.y }
            markerPosRef.current = newMarkerPos
            sessionStorage.setItem('markerPos', JSON.stringify(newMarkerPos))
            if (markerRef.current) markerRef.current.position.set(newX, pos.y, newZ)
          }
        })
        .catch(err => console.error('[pipe load] failed:', err))
    })
  }, [mapLoaded])

  // ── Spawn pipe ──
  async function spawnPipe(
    x: number, z: number, _y: number, scale: number,
    colors: string[], modelFile: string, photos: string[], animate = true,
  ) {
    const scene = sceneRef.current
    if (!scene) { console.error('[spawnPipe] scene not ready'); return }

    // [1] Validate colors
    if (!colors || colors.length === 0) {
      console.warn('[spawnPipe] no colors provided — skipping', modelFile)
      return
    }
    const validColors = colors.filter(c => c && c.length > 1)
    if (validColors.length === 0) {
      console.warn('[spawnPipe] all colors invalid — skipping', modelFile)
      return
    }

    // Surface Y — use measured value; raycast as fallback; hardcoded last resort
    let y = surfaceYRef.current
    if (y === 0) {
      const fieldOrMap = mapFieldRef.current ?? currentMapRef.current
      if (fieldOrMap) {
        const rc = new THREE.Raycaster()
        rc.set(new THREE.Vector3(x, 200, z), new THREE.Vector3(0, -1, 0))
        const hits = rc.intersectObject(fieldOrMap, true)
        y = hits.length > 0 ? hits[0].point.y : 1.2
        surfaceYRef.current = y
      } else {
        y = 1.2   // known map surface default
      }
    }

    console.log('[spawnPipe] loading', modelFile, '→ pos', x, y, z, 'colors', colors)
    let model: THREE.Group
    try {
      model = await loadGLB(`/pipe_models/${encodeURIComponent(modelFile)}`)
    } catch (err) {
      console.error('[spawnPipe] GLB load failed:', err)
      return
    }

    // Material name → color index (same as desktop NAME_TO_IDX)
    const NAME_TO_IDX: Record<string, number> = {
      Milk: 0, Brown: 1, Skyblue: 2,
      'Material.015': 3, 'Material.014': 4, inside_green: 5,
    }

    // Apply colors: name match first → traversal index → original mat color → fallback
    let meshIdx = 0
    model.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return
      const applyMat = (mat: THREE.Material): THREE.MeshBasicMaterial => {
        const nameIdx = NAME_TO_IDX[mat.name]
        let hex: string | undefined =
          nameIdx !== undefined ? validColors[nameIdx] : undefined
        if (!hex) hex = validColors[meshIdx]
        if (!hex) {
          const c = (mat as THREE.MeshStandardMaterial).color
          if (c) hex = `#${c.getHexString()}`
        }
        return makePipeMat(hex ?? '#cccccc')
      }
      if (Array.isArray(child.material)) {
        child.material = child.material.map(applyMat)
      } else {
        child.material = applyMat(child.material)
      }
      meshIdx++
    })

    // Center model on its bounding box (matches desktop)
    model.updateWorldMatrix(true, true)
    const mbox = new THREE.Box3().setFromObject(model)
    const mcenter = new THREE.Vector3()
    mbox.getCenter(mcenter)
    model.position.set(-mcenter.x, -mbox.min.y, -mcenter.z)

    const wrapper = new THREE.Group()
    wrapper.position.set(x, y, z)
    wrapper.rotation.y = Math.floor(Math.random() * 12) * (Math.PI / 6)
    wrapper.scale.setScalar(animate ? 0 : scale)
    wrapper.add(model)
    scene.add(wrapper)
    console.log('[spawnPipe] added to scene at', x, y, z)

    const entry: PlacedEntry = { x, z, y, scale, obj: wrapper, modelFile, colors, photos }
    placedRef.current.set(cellKey(x, z), entry)

    if (animate) {
      // ── Phase 1: ease-out-back spawn (500ms) ──
      await new Promise<void>(resolve => {
        const startMs = performance.now()
        const dur = 500
        const anim = () => {
          const t = Math.min(1, (performance.now() - startMs) / dur)
          const c1 = 1.70158, c3 = c1 + 1
          const e = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
          wrapper.scale.setScalar(scale * e)
          if (t < 1) requestAnimationFrame(anim)
          else resolve()
        }
        requestAnimationFrame(anim)
      })

      // Bubble effect on spawn
      spawnBubbles(x, y, z)
      // Floating bubbles appear 1s after spawn
      setTimeout(() => spawnFloatingBubbles(x, z, y, scale, cellKey(x, z)), 1000)

      // ── Merge check ──
      let nearEntry: PlacedEntry | null = null
      let nearKey = ''
      let nearDist = Infinity
      for (const [k, e] of placedRef.current) {
        if (k === cellKey(x, z)) continue
        const d = Math.hypot(e.x - x, e.z - z)
        if (d > 0 && d <= MERGE_RADIUS * 2 && d < nearDist) {
          nearEntry = e; nearKey = k; nearDist = d
        }
      }

      if (nearEntry) {
        // ── Phase 2: fly to midpoint + scale to 0 (500ms) ──
        const mx = Math.round((x + nearEntry.x) / 2)
        const mz = Math.round((z + nearEntry.z) / 2)
        const my = (y + nearEntry.y) / 2
        const midVec = new THREE.Vector3(mx, my, mz)
        const fromPosA = wrapper.position.clone()
        const fromPosB = nearEntry.obj.position.clone()
        const fromScaleA = scale, fromScaleB = nearEntry.scale

        await new Promise<void>(resolve => {
          const startMs = performance.now()
          const dur = 500
          const anim = () => {
            const t = Math.min(1, (performance.now() - startMs) / dur)
            const e = t * t * t  // ease-in cubic
            wrapper.position.lerpVectors(fromPosA, midVec, e)
            wrapper.scale.setScalar(fromScaleA * (1 - e))
            nearEntry!.obj.position.lerpVectors(fromPosB, midVec, e)
            nearEntry!.obj.scale.setScalar(fromScaleB * (1 - e))
            if (t < 1) requestAnimationFrame(anim)
            else resolve()
          }
          requestAnimationFrame(anim)
        })

        // Remove both objects + their floating bubbles
        scene.remove(wrapper)
        scene.remove(nearEntry.obj)
        removeFloatingBubbles(cellKey(x, z))
        removeFloatingBubbles(nearKey)
        placedRef.current.delete(cellKey(x, z))
        placedRef.current.delete(nearKey)

        // Merge photos and update localStorage
        const mergedPhotos = [...photos, ...nearEntry.photos]
        const mergedScale = Math.max(scale, nearEntry.scale) * MERGE_SCALE
        const allPipes = JSON.parse(localStorage.getItem('pipes') ?? '[]')
        const filtered = allPipes.filter((p: PlacedEntry) =>
          !(p.x === x && p.z === z) && !(p.x === nearEntry!.x && p.z === nearEntry!.z)
        )

        // ── Phase 3: spawn merged object at midpoint (500ms) ──
        const mergedModelFile = PIPE_MODELS[Math.floor(Math.random() * PIPE_MODELS.length)]
        await spawnPipe(mx, mz, my, mergedScale, colors, mergedModelFile, mergedPhotos, true)

        // Save merged to localStorage
        const mergedEntry = placedRef.current.get(cellKey(mx, mz))
        if (mergedEntry) {
          filtered.push({
            x: mx, z: mz, y: my, scale: mergedScale,
            modelFile: mergedModelFile, colors, photos: mergedPhotos,
          })
          localStorage.setItem('pipes', JSON.stringify(filtered))
        }
        return
      }

      // ── No merge: camera focus + toast ──
      const DIST = 30
      const elev = 12 * Math.PI / 180
      const azim = 45 * Math.PI / 180
      camAnimRef.current = {
        fromTarget: controlsRef.current!.target.clone(),
        toTarget:   new THREE.Vector3(x, y, z),
        fromPos:    cameraRef.current!.position.clone(),
        toPos:      new THREE.Vector3(
          x + DIST * Math.cos(elev) * Math.cos(azim),
          y + DIST * Math.sin(elev),
          z + DIST * Math.cos(elev) * Math.sin(azim),
        ),
        startMs:    performance.now(),
        durationMs: 900,
      }
      const name = PIPE_NAMES[modelFile] ?? modelFile
      const id = Date.now()
      setNameToast({ text: name, id })
      setTimeout(() => setNameToast(null), 2400)
    }
  }

  function spawnBubbles(x: number, y: number, z: number) {
    const scene = sceneRef.current!
    const count = 8 + Math.floor(Math.random() * 8)
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.2, 8, 6)
      const mat = new THREE.MeshBasicMaterial({ color: 0xffe000, transparent: true, opacity: 1, toneMapped: false })
      const mesh = new THREE.Mesh(geo, mat)
      const angle = Math.random() * Math.PI * 2
      mesh.position.set(x, y, z)
      scene.add(mesh)
      bubblesRef.current.push({
        mesh, bx: x, bz: z, baseY: y,
        vx: Math.cos(angle), vz: Math.sin(angle),
        maxSpread: 1.5 + Math.random() * 2,
        maxH: 2 + Math.random() * 3,
        startMs: performance.now(),
        delay: Math.random() * 300,
        duration: 1000 + Math.random() * 1000,
      })
    }
  }

  function removeFloatingBubbles(key: string) {
    const scene = sceneRef.current!
    floatingBubblesRef.current.filter(b => b.cellKey === key).forEach(b => scene.remove(b.mesh))
    floatingBubblesRef.current = floatingBubblesRef.current.filter(b => b.cellKey !== key)
  }

  function spawnFloatingBubbles(x: number, z: number, y: number, scale: number, key: string) {
    const scene = sceneRef.current!
    removeFloatingBubbles(key)
    const BASE = 0.25
    const stage = Math.max(1, Math.round(Math.log(scale / BASE) / Math.log(1.75)) + 1)
    const count = 4 * Math.pow(2, stage - 1)
    const maxRadius = 4 * Math.pow(2, stage - 1)
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.2, 8, 6)
      const mat = new THREE.MeshBasicMaterial({ color: 0xFFD700, toneMapped: false })
      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)
      const baseRadius = maxRadius * (0.3 + Math.random() * 0.7)
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI * 0.8
      floatingBubblesRef.current.push({
        mesh, cellKey: key,
        centerX: x, centerY: y + 1.5, centerZ: z,
        radius: baseRadius,
        theta, phi,
        thetaSpeed: (0.3 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1),
        phiSpeed: (0.2 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
        radiusSpeed: 0.4 + Math.random() * 0.6,
        radiusAmplitude: baseRadius * 0.3,
        baseRadius,
        phase: Math.random() * Math.PI * 2,
      })
    }
  }

  // (sessionStorage new-pipe is now handled inside the combined effect above)

  // [3] Move marker every 1 minute
  useEffect(() => {
    if (!mapLoaded) return
    const interval = setInterval(() => {
      if (!markerPosRef.current || !mapFieldRef.current) return
      const directions = [
        { dx: 2, dz: 0 }, { dx: -2, dz: 0 },
        { dx: 0, dz: 2 }, { dx: 0, dz: -2 },
        { dx: 2, dz: 2 }, { dx: -2, dz: 2 },
        { dx: 2, dz: -2 }, { dx: -2, dz: -2 },
      ]
      const dir = directions[Math.floor(Math.random() * directions.length)]
      const fieldBox = new THREE.Box3().setFromObject(mapFieldRef.current!)
      const safeMinX = fieldBox.min.x + (fieldBox.max.x - fieldBox.min.x) * 0.2
      const safeMaxX = fieldBox.max.x - (fieldBox.max.x - fieldBox.min.x) * 0.2
      const safeMinZ = fieldBox.min.z + (fieldBox.max.z - fieldBox.min.z) * 0.2
      const safeMaxZ = fieldBox.max.z - (fieldBox.max.z - fieldBox.min.z) * 0.2
      const newX = Math.max(safeMinX, Math.min(safeMaxX, markerPosRef.current.x + dir.dx))
      const newZ = Math.max(safeMinZ, Math.min(safeMaxZ, markerPosRef.current.z + dir.dz))
      const newY = markerPosRef.current.y
      markerPosRef.current = { x: newX, z: newZ, y: newY }
      sessionStorage.setItem('markerPos', JSON.stringify({ x: newX, z: newZ, y: newY }))
      if (markerRef.current) {
        markerRef.current.position.set(newX, newY, newZ)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [mapLoaded])

  // Sync body background + theme-color meta to current theme
  useEffect(() => {
    document.body.style.background = MAP_THEMES[theme].bg
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', MAP_THEMES[theme].bg)
    }
    return () => { document.body.style.background = '' }
  }, [theme])

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: MAP_THEMES[theme].bg }}>
      {/* Three.js canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none', filter: MAP_THEMES[theme].filter }}
        onMouseMove={onMouseMove}
        onClick={onCanvasClick}
        onTouchEnd={(e) => { onCanvasClick(e); setCameraVisible(true); if (cameraHideTimer.current) clearTimeout(cameraHideTimer.current) }}
      />

      {/* Loading */}
      {!mapLoaded && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: MAP_THEMES[theme].bg, color: '#fff', fontSize: 16,
          fontFamily: 'Pretendard, sans-serif', pointerEvents: 'none',
        }}>맵 로딩 중…</div>
      )}

      {/* ── Right-side controls ── */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .theme-dropdown {
          animation: slideDown 0.2s ease forwards;
        }
      `}</style>
      <div style={{
        position: 'absolute', top: 64, right: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        {/* Glass pill */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: 8, width: 52,
          background: 'rgba(237,237,237,0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '0.862px solid rgba(255,255,255,0.7)',
          borderRadius: 861,
        }}>
          <button
            onClick={() => { if (gridMode) { setGridMode(false); setSelectedCell(null); if (highlightRef.current) highlightRef.current.visible = false; if (selectedHighlightRef.current) selectedHighlightRef.current.visible = false } }}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: !gridMode ? '#F0EAD6' : 'transparent',
              boxShadow: !gridMode ? 'inset 2px 2px 4.3px rgba(0,0,0,0.14)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <Image src={!gridMode ? '/icons/map_selected.svg' : '/icons/map_unselected.svg'} alt="지도" width={24} height={24} style={{ objectFit: 'contain' }} />
          </button>
          <button
            onClick={() => { setGridMode(g => !g); setSelectedCell(null); if (highlightRef.current) highlightRef.current.visible = false; if (selectedHighlightRef.current) selectedHighlightRef.current.visible = false }}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: gridMode ? '#F0EAD6' : 'transparent',
              boxShadow: gridMode ? 'inset 2px 2px 4.3px rgba(0,0,0,0.14)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <Image src={gridMode ? '/icons/grid_selected.svg' : '/icons/Grid_unselected.svg'} alt="그리드" width={24} height={24} style={{ objectFit: 'contain' }} />
          </button>
        </div>

        {/* Location button */}
        <button
          onClick={focusMarker}
          style={{
            width: 48, height: 48, borderRadius: '50%', border: '0.862px solid rgba(255,255,255,0.7)',
            background: 'rgba(237,237,237,0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 4,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={locationActive ? '/icons/location_selected.svg?v=3' : '/icons/location_unselected.svg?v=3'} alt="내 위치" width={36} height={36} style={{ objectFit: 'contain' }} />
        </button>

        {/* Theme toggle */}
        <div ref={themeContainerRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setThemeOpen(o => !o)}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(237,237,237,0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '0.862px solid rgba(255,255,255,0.7)',
              cursor: 'pointer', flexShrink: 0, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: MAP_THEMES[theme].bg,
              border: '2px solid rgba(255,255,255,0.6)',
            }} />
          </button>
          {themeOpen && (
            <div className="theme-dropdown" style={{
              position: 'absolute', top: 56, right: 0,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {(['blue', 'default', 'yellow'] as ThemeKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => { switchTheme(key); setThemeOpen(false) }}
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'transparent',
                    border: theme === key ? '2.5px solid rgba(255,255,255,0.9)' : '0.862px solid rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: MAP_THEMES[key].bg,
                    border: theme === key ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.4)',
                    transform: theme === key ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.15s',
                  }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Camera button */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        style={{
          position: 'absolute', bottom: 100,
          left: '50%',
          transform: cameraVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(120px)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          width: 64, height: 64, borderRadius: '50%', border: 'none',
          background: '#FFD900', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0px 4px 2px rgba(0,0,0,0.1)', flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/Camera.svg?v=2" alt="카메라" width={36} height={36} style={{ objectFit: 'contain' }} />
      </button>

      {/* Hidden file input — no capture so iOS shows camera/album sheet */}
      <input ref={cameraInputRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={handleImageSelected} />

      {/* Grid selected indicator */}
      {gridMode && selectedCell && (
        <div style={{
          position: 'absolute', top: 64, left: 20,
          background: 'rgba(255,217,0,0.92)', borderRadius: 20,
          padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#3A2E1A',
          fontFamily: 'Pretendard, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          위치 선택 ({selectedCell.x}, {selectedCell.z})
        </div>
      )}

      {/* Name toast */}
      {nameToast && (
        <>
          <style>{`
            @keyframes nameSlide {
              0%   { transform: translate(-50%, 20px); opacity: 0; }
              17%  { transform: translate(-50%, 0);    opacity: 1; }
              83%  { transform: translate(-50%, 0);    opacity: 1; }
              100% { transform: translate(-50%, -20px); opacity: 0; }
            }
          `}</style>
          <div key={nameToast.id} style={{
            position: 'absolute', top: 56, left: '50%',
            fontFamily: 'Pretendard, sans-serif', fontSize: 22, fontWeight: 700,
            color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none', whiteSpace: 'nowrap',
            animation: 'nameSlide 2.4s ease forwards',
          }}>
            {nameToast.text}
          </div>
        </>
      )}

      {/* Photo popup */}
      {photoPopup && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}
          onClick={() => setPhotoPopup(null)}>
          <div style={{
            position: 'absolute', right: 16, bottom: 90,
            background: '#1a1a2e', borderRadius: 14, padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)', pointerEvents: 'all',
            maxWidth: 300,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#aaa', fontSize: 12 }}>사진 {photoPopup.photos.length}장</span>
              <button onClick={() => setPhotoPopup(null)}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {photoPopup.photos.map((src, i) => (
                <img key={i} src={src} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
