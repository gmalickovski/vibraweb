const bcrypt = require('bcryptjs');

// ATENÇÃO: NÃO SUBA O HASH ABAIXO PARA O GITHUB! 
// Troque para variáveis de ambiente antes de subir para produção.
const users = [{
    username: 'admin',
    password: '$2b$10$1RwB/ALZ/ukoT0Efc6h3A.Xr9zFgZVSkbVwqUNW/6eAWdzubpC3xC'
}];

export async function validateCredentials(username, password) {
    console.log('Tentando autenticar:', username);
    const user = users.find(u => u.username === username);
    if (!user) {
        console.log('Usuário não encontrado');
        return false;
    }
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Senha válida:', isValid);
    return isValid;
}
