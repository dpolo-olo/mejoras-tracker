import { useState, useRef, useCallback, useEffect } from "react";

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Error"));
    r.readAsDataURL(file);
  });

const ESTADOS = ["Pendiente", "En Progreso", "Completado", "Cancelado"];
const ESTADO_COLOR = {
  Pendiente:     { bg: "#FFF3CD", text: "#856404", border: "#FFDA6A" },
  "En Progreso": { bg: "#CCE5FF", text: "#004085", border: "#74B9FF" },
  Completado:    { bg: "#D4EDDA", text: "#155724", border: "#75B798" },
  Cancelado:     { bg: "#F8D7DA", text: "#721C24", border: "#F1AEB5" },
};

function Badge({ estado }) {
  const c = ESTADO_COLOR[estado] || {};
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {estado}
    </span>
  );
}

export default function MejorasTracker() {

  const [step, setStep]               = useState(0);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [titulo, setTitulo]           = useState("");
  const [form, setForm]               = useState({ estado: "Pendiente", nota: "" });
  const [mejoras, setMejoras]         = useState([]);
  const [editId, setEditId]           = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [error, setError]             = useState("");
  const [modalImg, setModalImg]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [inlineEdit, setInlineEdit]   = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [autoAnalyze, setAutoAnalyze] = useState(false);


  const fileRef = useRef();

  useEffect(() => {
    if (autoAnalyze && imageFile) {
      setAutoAnalyze(false);
      analyzeImage();
    }
  }, [autoAnalyze, imageFile]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) { setError("Selecciona una imagen válida."); return; }
    setError("");
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => { setImagePreview(e.target.result); setAutoAnalyze(true); };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }, []);

  // Paste from clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (step !== 0) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [step]);

  const analyzeImage = async () => {
    if (!imageFile) return;
    setStep(1);
    try {
      const b64 = await toBase64(imageFile);
      const prompt = `Eres un auditor experto en calidad de datos y documentos. Observa esta imagen como si fuera la fotografía de un reporte, tabla, formulario, planilla o documento físico o digital.

Tu único objetivo es detectar ERRORES ESTRUCTURALES Y DE INTEGRIDAD visibles en la imagen. Revisa con prioridad este orden:

1. NOMBRES REPETIDOS EN COLUMNA CENTRAL: si la columna del centro del documento contiene el mismo nombre, palabra o texto más de una vez, ese es el error principal a reportar
2. CAMPOS VACÍOS: celdas, casillas, filas o columnas que deberían tener datos pero están completamente en blanco
3. FILAS O COLUMNAS INCOMPLETAS: registros que tienen algunos campos llenos y otros vacíos
4. DATOS DUPLICADOS: cualquier valor, código o texto que aparezca repetido en lugares donde debería ser único
5. ESPACIOS EN BLANCO ANÓMALOS: secciones del documento que visualmente deberían estar completas pero no lo están

REGLAS ESTRICTAS:
- NO analices el significado de los números
- NO hagas sumas, restas ni ningún cálculo
- NO interpretes qué representan los valores numéricos
- SOLO describe el error estructural o de integridad que ves visualmente

Identifica el error más evidente siguiendo el orden de prioridad y genera un título conciso (máximo 10 palabras) que describa ESE problema específico. Responde ÚNICAMENTE con el título, sin puntuación final, sin comillas, sin explicaciones.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: imageFile.type, data: b64 } },
            { type: "text", text: prompt },
          ]}],
        }),
      });
      const data = await res.json();
      const raw = data.content?.find((b) => b.type === "text")?.text?.trim() || "Mejora sin título";
      setTitulo(raw);
      setStep(2);
    } catch {
      setError("Error al analizar la imagen. Intenta de nuevo.");
      setStep(0);
    }
  };

  const saveMejora = () => {
    setError("");
    if (editId !== null) {
      setMejoras((prev) => prev.map((m) => m.id === editId ? { ...m, titulo, nota: form.nota, estado: form.estado, imagen: imagePreview } : m));
      setEditId(null);
    } else {
      setMejoras((prev) => [{ id: Date.now(), titulo, usuario: "", responsable: "", estado: form.estado, nota: form.nota, imagen: imagePreview, fecha: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) }, ...prev]);
    }
    setStep(3); setImageFile(null); setImagePreview(null); setTitulo(""); setForm({ estado: "Pendiente", nota: "" });
  };

  const startEdit = (m) => { setImagePreview(m.imagen); setTitulo(m.titulo); setForm({ estado: m.estado, nota: m.nota }); setEditId(m.id); setStep(2); };
  const doDelete = () => { setMejoras((prev) => prev.filter((m) => m.id !== deleteConfirm)); setDeleteConfirm(null); };
  const startInline = (id, field, value) => setInlineEdit({ id, field, value });
  const commitInline = () => { if (!inlineEdit) return; setMejoras((prev) => prev.map((m) => m.id === inlineEdit.id ? { ...m, [inlineEdit.field]: inlineEdit.value } : m)); setInlineEdit(null); };

  const mejorasFiltradas = filtroEstado === "Todos" ? mejoras : mejoras.filter((m) => m.estado === filtroEstado);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F5F0E8; font-family: 'Sora', sans-serif; }

    .login-logo { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 18px; color: #1A1A2E; letter-spacing: 1px; margin-bottom: 6px; }
    .login-logo span { color: #FF6B35; }
    .login-sub { font-size: 13px; color: #8A8170; margin-bottom: 32px; }
    .login-icon { font-size: 52px; margin-bottom: 20px; }
    .login-label { font-size: 12px; font-weight: 700; color: #6B6259; letter-spacing: 0.8px; text-transform: uppercase; text-align: left; display: block; margin-bottom: 8px; }
    .login-input { width: 100%; border: 1.5px solid #DDD8CF; border-radius: 10px; padding: 12px 16px; font-family: 'Sora', sans-serif; font-size: 15px; color: #1A1A2E; background: #FAFAF7; outline: none; transition: border-color 0.2s; margin-bottom: 16px; }
    .login-input:focus { border-color: #FF6B35; background: #fff; }
    .login-btn { width: 100%; background: #FF6B35; color: #fff; border: none; border-radius: 10px; padding: 14px; font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; transition: background 0.2s; }
    .login-btn:hover { background: #E55A24; }

    .topbar { background: #1A1A2E; padding: 0 40px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 16px rgba(0,0,0,0.3); }
    .topbar-logo { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 15px; color: #E8D5B7; letter-spacing: 1px; }
    .topbar-logo span { color: #FF6B35; }
    .btn-new { background: #FF6B35; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-new:hover { background: #E55A24; }

    .content { max-width: 1200px; margin: 0 auto; padding: 40px 24px 80px; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 40px; margin-bottom: 40px; border: 1px solid #EDE8DF; }
    .step-indicator { display: flex; gap: 8px; margin-bottom: 32px; }
    .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #DDD; transition: background 0.3s, transform 0.3s; }
    .step-dot.active { background: #FF6B35; transform: scale(1.4); }
    .step-dot.done { background: #2ECC71; }
    .step-title { font-size: 22px; font-weight: 700; color: #1A1A2E; margin-bottom: 6px; }
    .step-sub { font-size: 13px; color: #8A8170; margin-bottom: 28px; }

    .dropzone { border: 2px dashed #C8BFB0; border-radius: 12px; padding: 48px 24px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; background: #FAFAF7; }
    .dropzone:hover, .dropzone.over { border-color: #FF6B35; background: #FFF6F2; }
    .dropzone-icon { font-size: 40px; margin-bottom: 12px; }
    .dropzone-label { font-size: 14px; color: #6B6259; }
    .dropzone-label strong { color: #FF6B35; }

    .preview-row { display: flex; gap: 24px; align-items: flex-start; margin-top: 20px; }
    .preview-img { width: 160px; height: 120px; object-fit: cover; border-radius: 10px; border: 2px solid #EDE8DF; cursor: pointer; transition: transform 0.2s; }
    .preview-img:hover { transform: scale(1.03); }
    .titulo-badge { background: linear-gradient(135deg, #1A1A2E, #2D2D4E); color: #E8D5B7; border-radius: 10px; padding: 16px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; flex: 1; line-height: 1.5; }
    .titulo-label { font-size: 10px; color: #FF6B35; letter-spacing: 1.5px; margin-bottom: 6px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field.full { grid-column: 1 / -1; }
    label { font-size: 12px; font-weight: 600; color: #6B6259; letter-spacing: 0.8px; text-transform: uppercase; }
    select, textarea { border: 1.5px solid #DDD8CF; border-radius: 8px; padding: 10px 14px; font-family: 'Sora', sans-serif; font-size: 13px; color: #1A1A2E; background: #FAFAF7; outline: none; transition: border-color 0.2s; }
    select:focus, textarea:focus { border-color: #FF6B35; background: #fff; }
    textarea { resize: vertical; min-height: 80px; }

    .btn-primary { background: #1A1A2E; color: #E8D5B7; border: none; border-radius: 10px; padding: 12px 28px; font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    .btn-primary:hover { background: #2D2D4E; }
    .btn-secondary { background: transparent; color: #8A8170; border: 1.5px solid #C8BFB0; border-radius: 10px; padding: 10px 20px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .btn-secondary:hover { border-color: #FF6B35; color: #FF6B35; }
    .btn-row { display: flex; gap: 12px; align-items: center; margin-top: 24px; }
    .error-msg { background: #FFF0F0; border: 1px solid #FFBDBD; color: #C0392B; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-top: 12px; }
    .hint { font-size: 11px; color: #A09880; margin-top: 6px; font-style: italic; }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-title { font-size: 20px; font-weight: 700; color: #1A1A2E; }
    .count-pill { background: #1A1A2E; color: #E8D5B7; border-radius: 20px; padding: 2px 12px; font-size: 12px; font-family: 'IBM Plex Mono', monospace; font-weight: 600; }

    .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
    .filter-label { font-size: 11px; font-weight: 700; color: #8A8170; text-transform: uppercase; letter-spacing: 1px; margin-right: 4px; }
    .filter-btn { border: 1.5px solid #DDD8CF; border-radius: 20px; padding: 5px 14px; font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; background: #fff; color: #6B6259; transition: all 0.18s; }
    .filter-btn:hover { border-color: #FF6B35; color: #FF6B35; }
    .filter-btn.active { background: #1A1A2E; color: #E8D5B7; border-color: #1A1A2E; }
    .filter-btn.fp.active { background: #856404; border-color: #856404; color: #FFF3CD; }
    .filter-btn.fi.active { background: #004085; border-color: #004085; color: #CCE5FF; }
    .filter-btn.fc.active { background: #155724; border-color: #155724; color: #D4EDDA; }
    .filter-btn.fk.active { background: #721C24; border-color: #721C24; color: #F8D7DA; }

    .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #EDE8DF; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    thead { background: #1A1A2E; }
    th { padding: 13px 16px; font-size: 11px; font-weight: 700; color: #C8BFB0; text-align: left; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap; }
    td { padding: 12px 16px; font-size: 13px; color: #3A3530; border-bottom: 1px solid #F0EBE3; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #FAFAF7; }
    .thumb { width: 52px; height: 40px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1.5px solid #EDE8DF; transition: transform 0.2s; }
    .thumb:hover { transform: scale(1.08); }
    .titulo-cell { font-weight: 600; color: #1A1A2E; max-width: 180px; }
    .nota-cell { color: #7C6F64; font-style: italic; max-width: 140px; font-size: 12px; }

    .inline-cell { display: flex; align-items: center; gap: 6px; min-width: 110px; cursor: pointer; border-radius: 6px; padding: 4px 6px; transition: background 0.15s; }
    .inline-cell:hover { background: #F0EBE3; }
    .inline-cell .pencil { opacity: 0; font-size: 11px; color: #A09880; transition: opacity 0.15s; }
    .inline-cell:hover .pencil { opacity: 1; }
    .inline-empty { color: #C8BFB0; font-style: italic; font-size: 12px; }
    .inline-input { border: 1.5px solid #FF6B35; border-radius: 6px; padding: 5px 8px; font-family: 'Sora', sans-serif; font-size: 13px; color: #1A1A2E; background: #fff; outline: none; width: 130px; }

    .btn-icon { background: none; border: 1.5px solid #DDD8CF; border-radius: 7px; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; transition: all 0.2s; margin: 0 2px; }
    .btn-icon.edit:hover { border-color: #3498DB; background: #EBF5FB; }
    .btn-icon.del:hover { border-color: #E74C3C; background: #FDEDEC; }

    .empty-state { text-align: center; padding: 60px 20px; color: #A09880; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(4px); }
    .modal-img-wrap { position: relative; }
    .modal-img-wrap img { max-width: 90vw; max-height: 85vh; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .modal-close { position: absolute; top: -14px; right: -14px; width: 32px; height: 32px; border-radius: 50%; background: #fff; border: none; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    .confirm-modal { background: #fff; border-radius: 14px; padding: 32px; max-width: 360px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .confirm-modal h3 { font-size: 18px; color: #1A1A2E; margin-bottom: 10px; }
    .confirm-modal p { font-size: 13px; color: #7C6F64; margin-bottom: 24px; }
    .confirm-btns { display: flex; gap: 10px; justify-content: center; }
    .btn-danger { background: #E74C3C; color: #fff; border: none; border-radius: 8px; padding: 10px 24px; font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer; }
    .btn-danger:hover { background: #C0392B; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { width: 36px; height: 36px; border: 3px solid #EDE8DF; border-top-color: #FF6B35; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.35s ease both; }
  `;

  // ── APP ──
  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: "#F5F0E8" }}>

        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-logo">MEJORAS<span>_</span>TRACKER</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

            {step === 3 && (
              <button className="btn-new" onClick={() => { setStep(0); setError(""); }}>+ Nueva Mejora</button>
            )}
          </div>
        </div>

        <div className="content">

          {/* STEP 0: UPLOAD */}
          {step === 0 && (
            <div className="card fade-in">
              <div className="step-indicator">
                <div className="step-dot active" /><div className="step-dot" /><div className="step-dot" />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div className="step-title">Subir imagen de mejora</div>
                <button
                    onClick={() => setStep(3)}
                    style={{ background:"#1A1A2E", border:"1.5px solid #1A1A2E", borderRadius:8, padding:"8px 18px", fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:13, color:"#E8D5B7", cursor:"pointer", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}
                  >
                    📋 Ver Reporte
                    {mejoras.length > 0 && (
                      <span style={{ background:"#FF6B35", color:"#fff", borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{mejoras.length}</span>
                    )}
                  </button>
              </div>
              <div className="step-sub">La IA analizará la imagen automáticamente al cargarla.</div>

              {!imagePreview ? (
                <div className={`dropzone${dragOver ? " over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current.click()}
                >
                  <div className="dropzone-icon">📋</div>
                  <div className="dropzone-label">Arrastra una imagen aquí, <strong>selecciona un archivo</strong> o <strong>pega con Ctrl+V</strong></div>
                  <div style={{ fontSize:12, color:"#B0A898", marginTop:6 }}>También puedes copiar una imagen y pegarla directamente aquí</div>
                  <div style={{ fontSize: 12, color: "#A09880", marginTop: 8 }}>PNG, JPG, WEBP</div>
                </div>
              ) : (
                <div className="preview-row fade-in">
                  <img src={imagePreview} alt="preview" className="preview-img" onClick={() => setModalImg(imagePreview)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#6B6259", marginBottom: 12 }}>✅ Imagen cargada: <strong>{imageFile?.name}</strong></div>
                    <button className="btn-secondary" onClick={() => { setImageFile(null); setImagePreview(null); }}>Cambiar imagen</button>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
              {error && <div className="error-msg">{error}</div>}
              {imagePreview && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, color: "#8A8170", fontSize: 13 }}>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Analizando imagen automáticamente…
                </div>
              )}
            </div>
          )}

          {/* STEP 1: LOADING */}
          {step === 1 && (
            <div className="card fade-in" style={{ textAlign: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0" }}>
                <div className="spinner" />
                <span style={{ color: "#7C6F64", fontSize: 13 }}>Analizando imagen con IA…</span>
              </div>
            </div>
          )}

          {/* STEP 2: FORM */}
          {step === 2 && (
            <div className="card fade-in">
              <div className="step-indicator">
                <div className="step-dot done" /><div className="step-dot done" /><div className="step-dot active" />
              </div>
              <div className="step-title">{editId ? "Editar mejora" : "Completa los detalles"}</div>
              <div className="step-sub">Revisa el título generado, agrega notas opcionales y define el estado.</div>

              <div className="preview-row" style={{ marginBottom: 28 }}>
                <img src={imagePreview} alt="preview" className="preview-img" onClick={() => setModalImg(imagePreview)} />
                <div className="titulo-badge">
                  <div className="titulo-label">TÍTULO GENERADO POR IA</div>
                  {titulo}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label>Estado</label>
                  <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                    {ESTADOS.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-field full">
                  <label>Notas complementarias (opcional)</label>
                  <textarea placeholder="Describe detalles adicionales…" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
                </div>
              </div>
              <p className="hint" style={{ marginTop: 12 }}>💡 Usuario y Responsable se completan directamente en la tabla del reporte.</p>
              {error && <div className="error-msg">{error}</div>}
              <div className="btn-row">
                <button className="btn-primary" onClick={saveMejora}>{editId ? "Guardar cambios" : "Registrar mejora"} ✓</button>
                <button className="btn-secondary" onClick={() => {
                  setStep(mejoras.length > 0 ? 3 : 0);
                  setEditId(null); setImageFile(null); setImagePreview(null); setTitulo(""); setForm({ estado: "Pendiente", nota: "" }); setError("");
                }}>Cancelar</button>
              </div>
            </div>
          )}

          {/* STEP 3: TABLE */}
          {step === 3 && (
            <div className="fade-in">
              <div className="section-header">
                <div className="section-title">Reporte de Mejoras</div>
                <span className="count-pill">{mejoras.length} registro{mejoras.length !== 1 ? "s" : ""}</span>
              </div>

              {/* FILTRO */}
              <div className="filter-bar">
                <span className="filter-label">Filtrar:</span>
                {[
                  { label: "Todos", cls: "" },
                  { label: "Pendiente", cls: "fp" },
                  { label: "En Progreso", cls: "fi" },
                  { label: "Completado", cls: "fc" },
                  { label: "Cancelado", cls: "fk" },
                ].map(({ label, cls }) => {
                  const count = label === "Todos" ? mejoras.length : mejoras.filter((m) => m.estado === label).length;
                  return (
                    <button key={label} className={`filter-btn ${cls} ${filtroEstado === label ? "active" : ""}`} onClick={() => setFiltroEstado(label)}>
                      {label} <span style={{ opacity: 0.7, fontSize: 10 }}>({count})</span>
                    </button>
                  );
                })}
              </div>

              {mejorasFiltradas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div style={{ fontSize: 15 }}>{mejoras.length === 0 ? "Aún no hay mejoras registradas." : "No hay registros con este estado."}</div>
                </div>
              ) : (
                <>
                  <p className="hint" style={{ marginBottom: 12 }}>✏️ Haz clic en <strong>Usuario</strong> o <strong>Responsable</strong> para editarlos directamente.</p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Imagen</th><th>Título de mejora</th><th>Usuario</th><th>Fecha</th><th>Estado</th><th>Responsable</th><th>Notas</th><th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mejorasFiltradas.map((m) => (
                          <tr key={m.id}>
                            <td><img src={m.imagen} alt="mejora" className="thumb" onClick={() => setModalImg(m.imagen)} /></td>
                            <td><div className="titulo-cell">{m.titulo}</div></td>
                            <td>
                              {inlineEdit?.id === m.id && inlineEdit?.field === "usuario" ? (
                                <input autoFocus className="inline-input" value={inlineEdit.value}
                                  onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                  onBlur={commitInline}
                                  onKeyDown={(e) => { if (e.key === "Enter") commitInline(); if (e.key === "Escape") setInlineEdit(null); }} />
                              ) : (
                                <div className="inline-cell" onClick={() => startInline(m.id, "usuario", m.usuario)}>
                                  {m.usuario || <span className="inline-empty">— agregar</span>}
                                  <span className="pencil">✏️</span>
                                </div>
                              )}
                            </td>
                            <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8A8170" }}>{m.fecha}</td>
                            <td><Badge estado={m.estado} /></td>
                            <td>
                              {inlineEdit?.id === m.id && inlineEdit?.field === "responsable" ? (
                                <input autoFocus className="inline-input" value={inlineEdit.value}
                                  onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                  onBlur={commitInline}
                                  onKeyDown={(e) => { if (e.key === "Enter") commitInline(); if (e.key === "Escape") setInlineEdit(null); }} />
                              ) : (
                                <div className="inline-cell" onClick={() => startInline(m.id, "responsable", m.responsable)}>
                                  {m.responsable || <span className="inline-empty">— asignar</span>}
                                  <span className="pencil">✏️</span>
                                </div>
                              )}
                            </td>
                            <td><div className="nota-cell">{m.nota ? (m.nota.length > 60 ? m.nota.slice(0, 60) + "…" : m.nota) : <span style={{ color: "#C8BFB0" }}>—</span>}</div></td>
                            <td>
                              <button className="btn-icon edit" onClick={() => startEdit(m)}>✏️</button>
                              <button className="btn-icon del" onClick={() => setDeleteConfirm(m.id)}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* MODAL imagen */}
        {modalImg && (
          <div className="modal-backdrop" onClick={() => setModalImg(null)}>
            <div className="modal-img-wrap" onClick={(e) => e.stopPropagation()}>
              <img src={modalImg} alt="vista ampliada" />
              <button className="modal-close" onClick={() => setModalImg(null)}>×</button>
            </div>
          </div>
        )}

        {/* MODAL eliminar */}
        {deleteConfirm && (
          <div className="modal-backdrop">
            <div className="confirm-modal">
              <h3>¿Eliminar mejora?</h3>
              <p>Esta acción no se puede deshacer.</p>
              <div className="confirm-btns">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                <button className="btn-danger" onClick={doDelete}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
