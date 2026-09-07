function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  return bytes
}

async function derive(senha: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, [
    'deriveBits'
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.slice().buffer, iterations: 120_000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return bufToHex(bits)
}

export async function hashSenha(senha: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(senha, salt)
  return { hash, salt: bufToHex(salt) }
}

export async function verificaSenha(senha: string, hash: string, saltHex: string): Promise<boolean> {
  const tentativa = await derive(senha, hexToBuf(saltHex))
  return tentativa === hash
}
