/*
 * Small vector and quaternion helpers for the skills sphere, on the unit
 * sphere in screen-aligned axes: +x right, +y down, +z toward the viewer.
 */

export type Vec3 = { x: number; y: number; z: number };
export type Quat = { w: number; x: number; y: number; z: number };

export const IDENTITY: Quat = { w: 1, x: 0, y: 0, z: 0 };

export function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

export function distanceSq(a: Vec3, b: Vec3): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
}

/** `b` applied first, then `a`. */
export function multiply(a: Quat, b: Quat): Quat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

export function normalizeQuat(q: Quat): Quat {
  const length = Math.hypot(q.w, q.x, q.y, q.z) || 1;
  return { w: q.w / length, x: q.x / length, y: q.y / length, z: q.z / length };
}

/** A rotation by the vector's length (radians) around its direction. */
export function fromRotationVector(v: Vec3): Quat {
  const angle = Math.hypot(v.x, v.y, v.z);
  if (angle < 1e-9) return IDENTITY;
  const s = Math.sin(angle / 2) / angle;
  return { w: Math.cos(angle / 2), x: v.x * s, y: v.y * s, z: v.z * s };
}

/** The shortest rotation taking unit vector `from` onto unit vector `to`. */
export function fromTo(from: Vec3, to: Vec3): Quat {
  const dot = from.x * to.x + from.y * to.y + from.z * to.z;
  if (dot < -0.999999) {
    // Opposite vectors: turn half a revolution around any perpendicular axis.
    const axis = normalize(
      Math.abs(from.x) < 0.9
        ? { x: 0, y: -from.z, z: from.y }
        : { x: -from.z, y: 0, z: from.x },
    );
    return { w: 0, ...axis };
  }
  return normalizeQuat({
    w: 1 + dot,
    x: from.y * to.z - from.z * to.y,
    y: from.z * to.x - from.x * to.z,
    z: from.x * to.y - from.y * to.x,
  });
}

export function rotate(q: Quat, v: Vec3): Vec3 {
  // v' = v + 2w(q × v) + 2 q × (q × v)
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

/** Spherical interpolation from `a` toward `b` by `t` (0-1). */
export function slerp(a: Quat, b: Quat, t: number): Quat {
  let dot = a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z;
  let target = b;
  if (dot < 0) {
    dot = -dot;
    target = { w: -b.w, x: -b.x, y: -b.y, z: -b.z };
  }
  if (dot > 0.9995) {
    return normalizeQuat({
      w: a.w + (target.w - a.w) * t,
      x: a.x + (target.x - a.x) * t,
      y: a.y + (target.y - a.y) * t,
      z: a.z + (target.z - a.z) * t,
    });
  }
  const theta = Math.acos(dot);
  const sin = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sin;
  const wb = Math.sin(t * theta) / sin;
  return {
    w: a.w * wa + target.w * wb,
    x: a.x * wa + target.x * wb,
    y: a.y * wa + target.y * wb,
    z: a.z * wa + target.z * wb,
  };
}
