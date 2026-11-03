export function magic(data) {
  return `<svg>${data.map(() => "<rect/>").join("")}</svg>`;
}
