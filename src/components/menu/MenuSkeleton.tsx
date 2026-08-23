export function MenuSkeleton() {
  return (
    <div className="menu-skeleton" role="status" aria-label="Loading menu">
      <span className="sr-only">Loading menu</span>
      <div className="skeleton skeleton--tabs" />
      {[0, 1, 2].map((item) => (
        <div className="skeleton-card" key={item} aria-hidden="true">
          <div className="skeleton skeleton--image" />
          <div className="skeleton-card__copy">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--price" />
          </div>
        </div>
      ))}
    </div>
  )
}
