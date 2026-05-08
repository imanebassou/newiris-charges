import { useState, useRef } from 'react'
import api from '../api/axios'

interface Champs {
  titre?: string
  fournisseur?: string
  montant?: string
  date?: string
  echeance?: string
  nom?: string
  prenom?: string
  salaire_base?: string
  type_contrat?: string
  categorie?: string
  description?: string
}

interface Analyse {
  type_document: string
  module_suggere: string
  champs: Champs
  confiance: string
  resume: string
}

interface Result {
  filename: string
  text_extrait: string
  analyse: Analyse
}

const CONFIANCE_COLORS: Record<string, string> = {
  haute: '#22c55e',
  moyenne: '#f59e0b',
  faible: '#ef4444',
}

const MODULE_LABELS: Record<string, string> = {
  commandes: 'Commandes',
  fournisseurs: 'Fournisseurs',
  charges_fixes: 'Charges Fixes',
  cheques: 'Chèques',
  salaires: 'Salaires',
  autre: 'Autre',
}

const CHAMPS_LABELS: Record<string, string> = {
  titre: 'Titre',
  fournisseur: 'Fournisseur',
  montant: 'Montant (DH)',
  date: 'Date',
  echeance: 'Échéance',
  nom: 'Nom',
  prenom: 'Prénom',
  salaire_base: 'Salaire de base',
  type_contrat: 'Type de contrat',
  categorie: 'Catégorie',
  description: 'Description',
}

const DocumentReader = () => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [editedChamps, setEditedChamps] = useState<Champs>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    setError('')
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/documents/extract/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      setEditedChamps(res.data.analyse.champs)
    } catch {
      setError('Erreur lors de l\'analyse du document.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (key: string, value: string) => {
    setEditedChamps(prev => ({ ...prev, [key]: value }))
  }

  return (
    <>
      {/* Bouton flottant Document — bas gauche */}
      <button
        onClick={() => { setOpen(!open); setResult(null); setError('') }}
        title="Lecture de document"
        style={{
          position: 'fixed',
          bottom: '28px',
          left: '28px',
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: open
            ? '#1d2836'
            : 'linear-gradient(135deg, #1f2d40 0%, #265dad 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(38,93,173,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.2s ease',
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.5)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }}>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #182434 0%, #1f2d40 100%)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #265dad, #1f2d40)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                    Lecture automatique de document
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                    PDF · Word · Excel · Images
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>

              {/* Zone upload */}
              {!result && !loading && (
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed #d9e0e7',
                    borderRadius: '12px',
                    padding: '48px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: '#e5eaf0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, color: '#1d2836', fontSize: '14px', marginBottom: '6px' }}>
                    Glissez votre document ici
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '16px' }}>
                    ou cliquez pour sélectionner un fichier
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {['PDF', 'Word', 'Excel', 'Image'].map(f => (
                      <span key={f} style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: '#e5eaf0',
                        fontSize: '11px',
                        color: '#6b7280',
                        fontWeight: 600,
                        letterSpacing: '0.3px',
                      }}>{f}</span>
                    ))}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.txt"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #265dad20, #265dad10)',
                    border: '1px solid #265dad30',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#265dad" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, color: '#1d2836', fontSize: '14px', marginBottom: '6px' }}>
                    Analyse en cours...
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                    L'IA extrait les informations du document
                  </div>
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#b91c1c',
                  fontSize: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Résultats */}
              {result && (
                <div>
                  {/* Info document */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '20px',
                    border: '1px solid #e5eaf0',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1d2836' }}>
                        {result.filename}
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: CONFIANCE_COLORS[result.analyse.confiance] + '15',
                        color: CONFIANCE_COLORS[result.analyse.confiance],
                        fontSize: '11px',
                        fontWeight: 700,
                        border: `1px solid ${CONFIANCE_COLORS[result.analyse.confiance]}30`,
                      }}>
                        Confiance {result.analyse.confiance}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      <span style={{
                        background: '#e5eaf0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginRight: '8px',
                        fontWeight: 600,
                      }}>
                        {result.analyse.type_document}
                      </span>
                      Module suggéré :
                      <strong style={{ color: '#265dad', marginLeft: '4px' }}>
                        {MODULE_LABELS[result.analyse.module_suggere] || result.analyse.module_suggere}
                      </strong>
                    </div>
                    {result.analyse.resume && (
                      <div style={{
                        fontSize: '12px',
                        color: '#374151',
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid #e5eaf0',
                        lineHeight: '1.6',
                      }}>
                        {result.analyse.resume}
                      </div>
                    )}
                  </div>

                  {/* Champs éditables */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#265dad" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Vérifiez et modifiez les champs extraits
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {Object.entries(editedChamps).map(([key, value]) =>
                      value ? (
                        <div key={key}>
                          <label style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            display: 'block',
                            marginBottom: '4px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}>
                            {CHAMPS_LABELS[key] || key}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={e => handleChange(key, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #d9e0e7',
                              borderRadius: '8px',
                              fontSize: '12px',
                              background: '#f8fbff',
                              color: '#1d2836',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      ) : null
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      onClick={() => { setResult(null); setError('') }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #d9e0e7',
                        borderRadius: '10px',
                        background: '#fff',
                        color: '#6b7280',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Nouveau document
                    </button>
                    <button
                      style={{
                        flex: 2,
                        padding: '10px',
                        border: 'none',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #265dad, #182434)',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Valider et enregistrer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DocumentReader