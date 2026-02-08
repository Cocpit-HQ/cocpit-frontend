export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context not found')
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  )

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0)

  // As Base64 string
  // return canvas.toDataURL('image/jpeg');

  // As Blob (better for large files)
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file)
      } else {
        reject(new Error('Canvas is empty'))
      }
    }, 'image/jpeg')
  })
}

export function getGradientImage(style: string, width = 1080, height = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not found'));
      return;
    }

    let gradient;
    // Map Tailwind classes to Canvas Gradients
    if (style.includes('from-indigo-500 via-purple-500 to-pink-500')) {
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#6366f1'); // indigo-500
      gradient.addColorStop(0.5, '#a855f7'); // purple-500
      gradient.addColorStop(1, '#ec4899'); // pink-500
    } else if (style.includes('from-blue-400 to-emerald-400')) {
      gradient = ctx.createLinearGradient(0, height, width, 0); // tr
      gradient.addColorStop(0, '#60a5fa'); // blue-400
      gradient.addColorStop(1, '#34d399'); // emerald-400
    } else if (style.includes('from-amber-500 to-pink-500')) {
      gradient = ctx.createLinearGradient(0, 0, width, 0); // r
      gradient.addColorStop(0, '#f59e0b'); // amber-500
      gradient.addColorStop(1, '#ec4899'); // pink-500
    } else if (style.includes('from-gray-900 to-gray-600')) {
      gradient = ctx.createLinearGradient(width, 0, 0, height); // bl
      gradient.addColorStop(0, '#111827'); // gray-900
      gradient.addColorStop(1, '#4b5563'); // gray-600
    } else {
      // Default black or extract from style if it's a color
      gradient = '#000000';
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate gradient blob'));
    }, 'image/jpeg');
  });
}

/**
 * Creates a padded image (letterboxed/pillarboxed) to fit a specific aspect ratio.
 */
export async function getPaddedImg(
  imageSrc: string,
  aspect: number,
  fillColor = '#000000'
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not found');
  }

  const { width, height } = image;
  const imageAspect = width / height;

  let targetWidth, targetHeight;

  // Determine target dimensions based on aspect ratio
  // We want the resulting image to maintain the source resolution quality
  if (aspect > imageAspect) {
    // Target is wider than image (pillarbox - bars on sides)
    // Height is the constraint (match source height), width increases
    targetHeight = height;
    targetWidth = height * aspect;
  } else {
    // Target is taller than image (letterbox - bars on top/bottom)
    // Width is the constraint (match source width), height increases
    targetWidth = width;
    targetHeight = width / aspect;
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Fill background
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw image centered
  const x = (targetWidth - width) / 2;
  const y = (targetHeight - height) / 2;

  ctx.drawImage(image, x, y);

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg');
  });
}
