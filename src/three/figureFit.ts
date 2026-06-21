/**
 * Shared camera config + responsive fit for the morph figure. Imported by BOTH
 * ParticleMorph (the 3D render) and BodyMorph (the HTML label projection) so the
 * anatomy labels stay locked to the figure at every viewport — one source of
 * truth instead of camera constants copied via comment.
 */
export const CAM = { y: 0.1, z: 6, fov: 45 } as const

// World-space half-width of the figure's outstretched fingertips (T-pose) plus
// breathing room. The camera must frame at least this much horizontally.
const HALF_WIDTH = 2.3
const MARGIN = 1.25
const TAN_HALF_FOV = Math.tan(((CAM.fov * Math.PI) / 180) / 2)

/**
 * Camera distance for a given viewport aspect (w/h). The visible horizontal
 * half-extent at distance z is tan(fov/2)·aspect·z; we solve for the z that
 * makes that ≥ HALF_WIDTH·MARGIN, so the full T-pose fits on narrow/portrait
 * viewports instead of the hands running off both edges — but never closer than
 * the design distance on landscape/desktop. Pulling the camera (vs scaling the
 * mesh) leaves world coords untouched, so the reveal/scan shaders stay calibrated.
 */
export function cameraZ(aspect: number): number {
  const needed = (HALF_WIDTH * MARGIN) / (TAN_HALF_FOV * aspect)
  return Math.max(CAM.z, needed)
}
