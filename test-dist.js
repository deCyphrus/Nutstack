function hexToLab(hex) {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

  x /= 95.047;
  y /= 100.000;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

  return [ (116 * y) - 16, 500 * (x - y), 200 * (y - z) ];
}
function colorDistance(idA, idB, LAB) {
  const [L1, a1, b1] = LAB[idA];
  const [L2, a2, b2] = LAB[idB];
  return Math.sqrt(Math.pow(L1 - L2, 2) + Math.pow(a1 - a2, 2) + Math.pow(b1 - b2, 2));
}

const LAB = {
  'white': hexToLab('#ffffff'),
  'light-grey': hexToLab('#cbd5e1'),
  'grey': hexToLab('#52525b'),
  'new-grey': hexToLab('#a1a1aa')
};
console.log('white vs light-grey:', colorDistance('white', 'light-grey', LAB));
console.log('white vs new-grey:', colorDistance('white', 'new-grey', LAB));
