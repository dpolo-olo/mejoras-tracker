import { useRef, useCallback, useEffect } from 'react'

interface Props {
  onImageSelected: (file: File) => void
}

export function UploadZone({ onImageSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      onImageSelected(file)
    },
    [onImageSelected],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find(i =>
        i.type.startsWith('image/'),
      )
      if (item) {
        const file = item.getAsFile()
        if (file) handleFile(file)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFile])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-cream-300 rounded-xl p-10 text-center cursor-pointer hover:border-navy-900 hover:bg-cream-100 transition-colors group"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="w-10 h-10 rounded-full bg-cream-200 group-hover:bg-navy-900 flex items-center justify-center mx-auto mb-3 transition-colors">
        <svg
          className="w-5 h-5 text-navy-600 group-hover:text-cream-50 transition-colors"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <p className="text-sm font-medium text-navy-900">Subir imagen del documento</p>
      <p className="text-xs text-navy-600 mt-1">
        Arrasta una imagen, hace clic, o pega con{' '}
        <kbd className="px-1 py-0.5 text-[10px] font-mono bg-cream-200 rounded border border-cream-300">Ctrl+V</kbd>
      </p>
      <p className="text-[10px] text-cream-500 mt-2">PNG, JPG, WEBP — maximo 20 MB</p>
    </div>
  )
}
