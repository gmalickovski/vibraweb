const bcrypt = require('bcryptjs');

const users = [{
    username: 'admin',
    // Cole aqui o hash gerado pelo script generate-hash.js
    password: '$2b$10$fToHqZv/dRI9vpofES9TJeq3qF5q7gDKCdoCFhETYuSRzlycqBH2m'
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
