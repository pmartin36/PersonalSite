// A still, as webp with a jpg fallback. Used for every card thumbnail, for
// carousel slides, and for detail heroes that have nothing moving to show.
export default function Still({ image, className = '', eager = false }) {
  return (
    <picture className={className}>
      <source srcSet={image.webp} type="image/webp" />
      <img
        src={image.jpg}
        alt={image.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  )
}
