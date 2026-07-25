"use client";


type Props = {
  title: string;
  iframeTitle: string;
  src: string;
  openLabel?: string;
  missingLabel?: string;
};

export default function EmbeddedRoom({
  title,
  iframeTitle,
  src,
  openLabel = "Відкрити окремо ↗",
  missingLabel = "Не задано",
}: Props) {
 
  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">

        <header className="mb-5 flex items-center gap-3">

          <h1 className="text-2xl font-bold">
            {title}
          </h1>

          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="
                ml-auto
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-sky-600
                px-3
                py-1.5
                text-sm
                font-semibold
                hover:bg-sky-500
              "
            >
              {openLabel}
            </a>
          )}

        </header>

        {!src ? (

          <div
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              p-4
              text-slate-300
            "
          >
            {missingLabel}{" "}
            <code className="text-sky-300">
              {src}
            </code>
          </div>

        ) : (

          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-700
              bg-slate-800
            "
          >
            <iframe
              title={iframeTitle}
              src={src}
              className="w-full"
              style={{
                minHeight: "90vh",
                border: "0",
              }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              allow="clipboard-read; clipboard-write"
            />
          </div>

        )}

      </div>
    </main>
  );
}