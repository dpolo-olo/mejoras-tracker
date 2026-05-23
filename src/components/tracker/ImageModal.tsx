interface Props {
  src: string
  onClose: () => void
}

export function ImageModal({ src, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm" />
      <div
        className="relative max-w-4xl w-full"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Vista completa"
          className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-navy-900 text-cream-50 rounded-full flex items-center justify-center hover:bg-navy-800 transition-colors shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
