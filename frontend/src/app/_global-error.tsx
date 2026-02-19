'use client';

export default function GlobalError({ error }: { error: Error }) {
  console.error(error);
  return (
    <html>
      <body>
        <h2>Something went wrong</h2>
        <p>Please refresh the page or try again later.</p>
      </body>
    </html>
  );
}
