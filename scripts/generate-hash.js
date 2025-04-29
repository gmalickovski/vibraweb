const bcrypt = require('bcryptjs');

const username = 'admin';
const password = '143121';

async function generateHash() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        console.log('\n=== CREDENCIAIS PADRÃO GERADAS ===');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('\nAdicione ao seu .env.local:');
        console.log(`ADMIN_USERNAME=${username}`);
        console.log(`ADMIN_PASSWORD_HASH=${hash}`);
        console.log('\nOu cole este hash em lib/auth.js para uso local:');
        console.log(hash);
    } catch (err) {
        console.error('Erro:', err);
    }
}

generateHash();
