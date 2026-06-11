'use client';

export function RequestCardSkeleton() {
  return (
    <div className="conn-card-skeleton" aria-hidden="true">
      <div className="conn-skeleton conn-card-skeleton__avatar" />
      <div className="conn-card-skeleton__body">
        <div className="conn-skeleton conn-card-skeleton__name" />
        <div className="conn-skeleton conn-card-skeleton__sub"  />
        <div className="conn-skeleton conn-card-skeleton__tag"  />
      </div>
      <div className="conn-card-skeleton__actions">
        <div className="conn-skeleton conn-card-skeleton__btn" />
        <div className="conn-skeleton conn-card-skeleton__btn" />
      </div>
    </div>
  );
}
