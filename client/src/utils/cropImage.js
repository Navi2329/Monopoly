// client/src/utils/cropImage.js

/**
 * This function was adapted from the react-image-crop official documentation.
 * @param {HTMLImageElement} image - Image File Object
 * @param {Object} crop - crop Object
 * @returns {Promise<Blob>}
 */
export function getCroppedImg(image, crop) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      resolve(blob);
    }, 'image/jpeg');
  });
}
