import { useState, useEffect } from 'react'
import { t } from '../../lib/tokens'
import { fetchInterpretation, saveUserInterpretation } from '../../lib/supabase'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'

const MAP_CATEGORIES = [
  'motivação', 'impressão', 'expressão', 'destino', 'missão', 
  'arcano_atual', 'licao_carmica', 'desafio', 'ciclo'
]
const NUMBERS = Array.from({ length: 9 }, (_, i) => i + 1).concat([11, 22, 33]) // Basic numerology array

export function CustomTexts() {
  const [mapType, setMapType] = useState<'pessoal' | 'bebe' | 'empresa'>('pessoal')
  const [category, setCategory] = useState(MAP_CATEGORIES[0])
  const [number, setNumber] = useState(1)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  // Fetch logic
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const res = await fetchInterpretation(number, `${mapType}_${category}`)
      if (active) {
        if (res) {
          setText(res.texto)
          setIsCustom(res.titulo?.startsWith('Personalizado:'))
        } else {
          setText('')
          setIsCustom(false)
        }
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [mapType, category, number])

  async function handleSave() {
    setLoading(true)
    await saveUserInterpretation(number, `${mapType}_${category}`, text)
    setIsCustom(true)
    setLoading(false)
    alert('Texto salvo com sucesso!')
  }

  async function handleRestore() {
    if (!confirm('Deseja apagar sua versão e restaurar o texto padrão do Vibraweb?')) return
    setLoading(true)
    await saveUserInterpretation(number, `${mapType}_${category}`, null) // passing null deletes it
    // Trigger re-fetch naturally
    const res = await fetchInterpretation(number, `${mapType}_${category}`)
    setText(res?.texto || '')
    setIsCustom(false)
    setLoading(false)
  }

  return (
    <div style={{ flex: 1, padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 24, margin: '0 0 24px' }}>
        Personalizar Textos
      </h2>
      
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        {/* Left Side: Selectors */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontFamily: t.body, fontSize: 13, color: t.fg3, marginBottom: 8 }}>
              Contexto do Mapa
            </label>
            <select
              value={mapType}
              onChange={e => setMapType(e.target.value as any)}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', color: t.fg, border: `1px solid ${t.pb}`,
                fontFamily: t.body, fontSize: 14, outline: 'none'
              }}
            >
              <option value="pessoal" style={{ background: t.night2 }}>Mapa Pessoal</option>
              <option value="bebe" style={{ background: t.night2 }}>Mapa do Bebê</option>
              <option value="empresa" style={{ background: t.night2 }}>Mapa da Empresa</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: t.body, fontSize: 13, color: t.fg3, marginBottom: 8 }}>
              Categoria Numérica
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', color: t.fg, border: `1px solid ${t.pb}`,
                fontFamily: t.body, fontSize: 14, outline: 'none'
              }}
            >
              {MAP_CATEGORIES.map(c => (
                <option key={c} value={c} style={{ background: t.night2 }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: t.body, fontSize: 13, color: t.fg3, marginBottom: 8 }}>
              Selecione o Número
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '60vh', overflowY: 'auto' }}>
              {NUMBERS.map(n => {
                const isActive = n === number
                return (
                  <button
                    key={n}
                    onClick={() => setNumber(n)}
                    style={{
                      padding: '12px 16px', background: isActive ? 'rgba(253,184,19,.15)' : 'transparent',
                      border: 0, borderRadius: 8, textAlign: 'left',
                      color: isActive ? t.gold : t.fg2, fontFamily: t.body, fontSize: 14,
                      cursor: 'pointer', transition: 'background .2s'
                    }}
                  >
                    Número {n}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Text Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.pb}`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: t.display, fontWeight: 600, fontSize: 16, color: t.fg2 }}>
              Descrição de "{category}" — Número {number} ({mapType === 'pessoal' ? 'Pessoal' : mapType === 'bebe' ? 'Bebê' : 'Empresa'})
            </span>
            {isCustom && (
              <span style={{ fontSize: 11, padding: '4px 8px', background: t.wine, color: t.fg, borderRadius: 4, fontFamily: t.body }}>
                ✏️ Texto Personalizado Ativo
              </span>
            )}
          </div>
          
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={loading}
            style={{
              flex: 1, resize: 'none', background: 'rgba(0,0,0,0.2)', border: `1px solid ${t.pb}`,
              borderRadius: 8, color: t.fg, fontFamily: t.body, fontSize: 15, lineHeight: 1.6, padding: 16,
              outline: 'none'
            }}
            placeholder="Carregando ou nenhum texto disponível..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            {isCustom && (
              <SecondaryBtn onClick={handleRestore} disabled={loading}>
                Restaurar Padrão
              </SecondaryBtn>
            )}
            <PrimaryBtn onClick={handleSave} disabled={loading || !text.trim()}>
              {loading ? 'Salvando...' : 'Salvar Novo Texto'}
            </PrimaryBtn>
          </div>
        </div>
      </div>
    </div>
  )
}
