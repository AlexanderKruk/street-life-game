export function clothingHygieneCap(cleanliness: number) {
  return cleanliness >= 70 ? 100 : cleanliness >= 40 ? 80 : 60
}
