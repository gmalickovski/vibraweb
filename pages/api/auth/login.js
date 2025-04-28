import { validateCredentials } from '../../../lib/auth';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    console.log('Tentativa de login:', username);

    const isValid = await validateCredentials(username, password);
    console.log('Credenciais válidas:', isValid);

    if (isValid) {
      // Define o cookie de autenticação
      res.setHeader('Set-Cookie', cookie.serialize('auth_token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 // 24 horas
      }));

      return res.status(200).json({ success: true });
    }

    return res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
