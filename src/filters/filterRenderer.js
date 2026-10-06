import { getPresetById } from './presets'

/**
 * Format date like authentic Dazz Cam 35mm date stamps
 * Example: '26 10 06 (YY MM DD) or '98 04 12
 */
export function formatRetroDate(date = new Date(), format = 'YY MM DD') {
  const d = new Date(date)
  const fullYear = d.getFullYear()
  const yy = String(fullYear).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')

  if (format === 'YY MM DD') {
    return `'${yy} ${mm} ${dd}`
  }
  if (format === 'YYYY.MM.DD') {
    return `${fullYear}.${mm}.${dd}`
  }
  if (format === 'VCR_CLOCK') {
    return `REC ● ${hours}:${mins}  ${dd}/${mm}/${fullYear}`
  }
  return `${dd}.${mm}.${fullYear}`
}

/**
 * Procedural Film Grain generator
 */
function applyFilmGrain(ctx, width, height, intensity = 0.25) {
  if (intensity <= 0) return
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data
  const factor = intensity * 45

  for (let i = 0; i < data.length; i += 4) {
    // Generate subtle noise
    const noise = (Math.random() - 0.5) * factor
    data[i] = Math.min(255, Math.max(0, data[i] + noise))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
  }
  ctx.putImageData(imgData, 0, 0)
}

/**
 * Procedural Vignette generator
 */
function applyVignette(ctx, width, height, intensity = 0.25) {
  if (intensity <= 0) return
  ctx.save()
  const radius = Math.max(width, height) * 0.7
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    radius * 0.45,
    width / 2,
    height / 2,
    radius
  )
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.8, `rgba(0, 0, 0, ${intensity * 0.5})`)
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

/**
 * Procedural Light Leak generator
 */
function applyLightLeak(ctx, width, height, type = 'warm-diagonal') {
  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  if (type === 'warm-diagonal' || type === 'intense-flare') {
    // Warm orange-red flare coming from top-right edge
    const grad1 = ctx.createRadialGradient(
      width * 0.95,
      height * 0.05,
      10,
      width * 0.8,
      height * 0.25,
      width * 0.6
    )
    grad1.addColorStop(0, 'rgba(255, 230, 150, 0.75)')
    grad1.addColorStop(0.2, 'rgba(255, 120, 40, 0.65)')
    grad1.addColorStop(0.5, 'rgba(230, 40, 40, 0.35)')
    grad1.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = grad1
    ctx.fillRect(0, 0, width, height)

    // Side flare streak
    const grad2 = ctx.createLinearGradient(0, height * 0.8, width * 0.35, height)
    grad2.addColorStop(0, 'rgba(255, 90, 30, 0.4)')
    grad2.addColorStop(0.5, 'rgba(255, 180, 50, 0.2)')
    grad2.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = grad2
    ctx.fillRect(0, 0, width, height)
  } else if (type === 'corner-glow') {
    const grad = ctx.createRadialGradient(
      width * 0.05,
      height * 0.95,
      10,
      width * 0.15,
      height * 0.8,
      width * 0.45
    )
    grad.addColorStop(0, 'rgba(255, 170, 70, 0.6)')
    grad.addColorStop(0.4, 'rgba(255, 80, 80, 0.3)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  } else if (type === 'scanlines') {
    // Retro VHS scanlines
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5)
    }
  } else if (type === 'soft-glow') {
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.2,
      width / 2,
      height / 2,
      width * 0.8
    )
    grad.addColorStop(0, 'rgba(255, 240, 220, 0.12)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }

  ctx.restore()
}

/**
 * Render complete photo with preset applied
 * Returns Promise<string> (Data URL)
 */
export async function renderPhotoWithPreset({
  sourceElement, // <img> or <video>
  presetId = 'cpm35',
  enableDateStamp = true,
  customDate = new Date(),
  guestNote = '',
  maxWidth = 1600,
  maxHeight = 1200,
}) {
  const preset = getPresetById(presetId)

  // Determine source dimensions
  let srcW = sourceElement.videoWidth || sourceElement.naturalWidth || sourceElement.width || 1280
  let srcH = sourceElement.videoHeight || sourceElement.naturalHeight || sourceElement.height || 720

  // Scale down if overly large while preserving aspect ratio
  let targetW = srcW
  let targetH = srcH
  if (targetW > maxWidth || targetH > maxHeight) {
    const ratio = Math.min(maxWidth / targetW, maxHeight / targetH)
    targetW = Math.round(targetW * ratio)
    targetH = Math.round(targetH * ratio)
  }

  const isPolaroid = preset.frame === 'polaroid'

  // Canvas setup
  let canvasW = targetW
  let canvasH = targetH

  // Polaroid frame padding calculation
  let photoX = 0
  let photoY = 0
  let photoW = targetW
  let photoH = targetH

  if (isPolaroid) {
    const sideMargin = Math.round(targetW * 0.08)
    const topMargin = Math.round(targetW * 0.08)
    const bottomMargin = Math.round(targetW * 0.22) // Classic thick chin
    canvasW = targetW + sideMargin * 2
    canvasH = targetH + topMargin + bottomMargin
    photoX = sideMargin
    photoY = topMargin
  }

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  // Fill Polaroid background if needed
  if (isPolaroid) {
    ctx.fillStyle = '#fbfbfa'
    ctx.fillRect(0, 0, canvasW, canvasH)

    // Subtle paper texture / off-white border shadow
    ctx.strokeStyle = '#e2dfd2'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvasW, canvasH)
  }

  // Draw base photo with CSS filter grading
  ctx.save()
  if (preset.cssFilter && preset.cssFilter !== 'none') {
    ctx.filter = preset.cssFilter
  }

  // Draw image into target slot
  ctx.drawImage(sourceElement, photoX, photoY, photoW, photoH)
  ctx.restore()

  // Apply procedural effects strictly within photo area
  // 1. Light Leaks
  if (preset.lightLeak && preset.lightLeak !== 'none') {
    ctx.save()
    ctx.beginPath()
    ctx.rect(photoX, photoY, photoW, photoH)
    ctx.clip()
    applyLightLeak(ctx, canvasW, canvasH, preset.lightLeak)
    ctx.restore()
  }

  // 2. Vignette
  if (preset.vignetteIntensity > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(photoX, photoY, photoW, photoH)
    ctx.clip()
    applyVignette(ctx, canvasW, canvasH, preset.vignetteIntensity)
    ctx.restore()
  }

  // 3. Film Grain
  if (preset.grainIntensity > 0) {
    ctx.save()
    applyFilmGrain(ctx, canvasW, canvasH, preset.grainIntensity)
    ctx.restore()
  }

  // 4. Retro Date Stamp
  if (enableDateStamp && preset.dateStamp && preset.dateStamp.format !== 'none') {
    ctx.save()
    const stampText = formatRetroDate(customDate, preset.dateStamp.format)
    const fontSize = Math.max(16, Math.round(photoW * 0.038))

    ctx.font = `700 ${fontSize}px 'Share Tech Mono', 'Courier New', monospace`
    ctx.textBaseline = 'bottom'

    if (preset.dateStamp.position === 'frame-bottom' && isPolaroid) {
      // Bottom frame for Polaroid
      ctx.fillStyle = '#2d2d2d'
      ctx.textAlign = 'center'
      ctx.font = `600 ${Math.max(14, Math.round(photoW * 0.03))}px 'Plus Jakarta Sans', sans-serif`
      const displayText = guestNote ? `"${guestNote}" • ${stampText}` : stampText
      ctx.fillText(displayText, canvasW / 2, canvasH - Math.round(photoW * 0.07))
    } else {
      // Classic bottom right orange/green LCD stamp
      ctx.textAlign = 'right'
      ctx.fillStyle = preset.dateStamp.color || '#ff6f00'

      // Glow effect
      ctx.shadowColor = preset.dateStamp.color || '#ff6f00'
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      const marginX = photoX + photoW - Math.round(photoW * 0.04)
      const marginY = photoY + photoH - Math.round(photoH * 0.04)

      // Draw shadow + text
      ctx.fillText(stampText, marginX, marginY)
      ctx.fillText(stampText, marginX, marginY) // Duplicate for vibrant glow
    }

    ctx.restore()
  }

  // Return high-quality JPEG (or PNG if polaroid)
  return canvas.toDataURL('image/jpeg', 0.92)
}
