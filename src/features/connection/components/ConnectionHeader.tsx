'use client';

import { useRouter } from 'next/navigation';

export function ConnectionHeader() {
  const router = useRouter();

  return (
    <header className="conn-header">
      <button
        className="conn-header__back"
        onClick={() => router.back()}
        aria-label="Go back to connections"
      >
        &#8249;
      </button>
      <div className="conn-header__text">
        <h1 className="conn-header__title">Received requests</h1>
        <p  className="conn-header__subtitle">
          Stay update with your account activity
        </p>
      </div>
    </header>
  );
}
