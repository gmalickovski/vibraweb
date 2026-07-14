// BlocosPage.tsx — /app/blocos (Item 1, Fase 1)
// Reordenar/ocultar os blocos do relatório final: Capa (fixa) · Orientação ·
// Importante · Os Seus Números · A Essência · Caminho e Desafios (com os 2
// sub-blocos Lições/Débitos Cármicos) · Ciclos de Tempo · Relacionamentos ·
// Conclusão. Ver Produto/docs/vibra-web/requisitos.md, seção 1.
//
// Este é o padrão GLOBAL do consultor (usado como ponto de partida em todo
// cliente novo), com o cliente-modelo (sample_client) como dado de exemplo.
// Preview + painel de organização usam a mesma casca visual de
// PreviewPage.tsx (DocumentOrganizerView) — padronizado em 2026-07-11 (3ª
// rodada) pra folha em tamanho real + controles de zoom reais, em vez da
// miniatura fixa que existia antes. A diferença entre as 2 telas é só o dado
// (padrão global vs cliente real sendo criado), nunca o componente.
//
// Ajuste (2026-07-12, 8ª rodada): parou de salvar automaticamente a cada
// mudança — agora edita localmente e só persiste quando "Salvar" (rodapé
// fixo do painel) é clicado, igual ao padrão do editor de Templates. O botão
// "Restaurar padrão" saiu da barra flutuante do preview e virou uma ação do
// próprio rodapé: só aparece depois que existe uma versão personalizada já
// salva (diferente do padrão de fábrica), sozinho no lugar do "Salvar" ou
// lado a lado com ele se a restauração ainda não foi salva.

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUserProfile, updateUserProfile } from '../lib/supabase'
import type { UserProfile } from '../lib/supabase'
import { DEFAULT_BLOCK_ORDER, normalizeBlockOrder, type BlockOrderConfig } from '../lib/block-order'
import { buildDocumentBlocks, splitIntoPages } from '../lib/document-builder'
import { resolveDocTheme } from '../lib/theme-resolver'
import { loadSampleClient, loadSampleInterpretations, type SampleIdentity } from '../lib/sample-preview'
import type { InterpretationMap } from '../lib/document-builder'
import type { NumerologyMap } from '../lib/numerology'
import { DocumentOrganizerView } from '../components/shared/DocumentOrganizerView'
import { SecondaryBtn } from '../components/shared/Button'
import { t } from '../lib/tokens'

export default function BlocosPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // `config` = edição local em andamento; `savedConfig` = último valor
  // persistido no banco (referência pra saber se há mudança não salva).
  const [config, setConfig] = useState<BlockOrderConfig>(DEFAULT_BLOCK_ORDER)
  const [savedConfig, setSavedConfig] = useState<BlockOrderConfig>(DEFAULT_BLOCK_ORDER)

  const [sampleIdentity, setSampleIdentity] = useState<SampleIdentity | null>(null)
  const [sampleMap, setSampleMap] = useState<NumerologyMap | null>(null)
  const [interp, setInterp] = useState<InterpretationMap | null>(null)

  useEffect(() => {
    fetchUserProfile().then(p => {
      if (!p) { navigate('/app'); return }
      setProfile(p)
      const normalized = normalizeBlockOrder(p.block_order)
      setConfig(normalized)
      setSavedConfig(normalized)
      setLoading(false)
    })
  }, [navigate])

  useEffect(() => {
    loadSampleClient().then(({ identity, map }) => {
      setSampleIdentity(identity)
      setSampleMap(map)
      loadSampleInterpretations(map).then(setInterp)
    })
  }, [])

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig)
  const hasCustomization = JSON.stringify(savedConfig) !== JSON.stringify(DEFAULT_BLOCK_ORDER)

  const handleSave = useCallback(async () => {
    setSaving(true)
    await updateUserProfile({ block_order: config })
    setSavedConfig(config)
    setSaving(false)
  }, [config])

  function restoreDefault() {
    if (!confirm('Restaurar a ordem e a visibilidade padrão de todos os blocos?')) return
    setConfig(DEFAULT_BLOCK_ORDER)
  }

  if (loading || !profile) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: t.fg2 }}>
        Carregando...
      </div>
    )
  }

  const theme = resolveDocTheme(profile)
  const previewReady = sampleMap && interp && sampleIdentity
  const blocks = previewReady ? buildDocumentBlocks(sampleMap!, sampleIdentity!.subject, sampleIdentity!.dataNascimento, interp!, config) : []
  const pageCount = previewReady ? splitIntoPages(blocks).length + 1 : 0 // +1 pela capa

  if (!previewReady) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: t.fg3, fontFamily: t.body, fontSize: 13 }}>
        Montando preview...
      </div>
    )
  }

  return (
    <DocumentOrganizerView
      theme={theme}
      blocks={blocks}
      subject={sampleIdentity!.subject}
      dataNascimento={sampleIdentity!.dataNascimento}
      isPro
      docTitle={`${sampleIdentity!.subject} — Blocos do Relatório (padrão)`}
      pageCount={pageCount}
      config={config}
      onConfigChange={setConfig}
      panelTitle="Blocos do Relatório"
      panelInfo="Arraste para reordenar, ou clique no olho para ocultar/exibir um bloco no PDF final. A capa é sempre a 1ª página. Clique em Salvar para aplicar como o seu padrão pessoal, usado em todo cliente novo."
      isDirty={isDirty}
      saving={saving}
      onSave={handleSave}
      onFooterBack={() => navigate(-1)}
      onCancelEdit={() => setConfig(savedConfig)}
      footerExtra={hasCustomization ? (
        <SecondaryBtn onClick={restoreDefault} style={{ padding: '10px', fontSize: 12, flexShrink: 0 }}>
          Restaurar padrão
        </SecondaryBtn>
      ) : undefined}
    />
  )
}
