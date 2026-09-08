// image-resize.ts — redimensiona/converte imagens de logo no CLIENTE antes
// do upload (2026-07-29, Guilherme: "podemos adicionar um conversor... para
// que caso o usuário coloque uma imagem muito grande, e também para não
// pesar no meu banco de dados, um conversor para sempre converter para um
// tamanho e formato adequado, para não perder a resolução na impressão
// mesmo que o logo ocupe a largura toda da folha").
//
// Sempre converte pra PNG (preserva transparência, o formato mais comum pra
// logo) e limita a maior dimensão a `maxDim` — grande o bastante pra ficar
// nítido impresso em qualquer escala usada na capa (`coverLogoScale`, até
// 3x), pequeno o bastante pra não inchar o Neon Object Storage com uploads de
// câmera/celular sem redimensionamento (que chegam facilmente a 4000px+).

const DEFAULT_MAX_DIM = 1600

export async function resizeImageForLogo(file: File, maxDim = DEFAULT_MAX_DIM): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D não suportado neste navegador.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Falha ao converter a imagem.'))),
      'image/png',
    )
  })
}
