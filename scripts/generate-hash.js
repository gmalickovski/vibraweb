const bcrypt = require('bcryptjs');

const credentials = {
    username: 'admin',
    password: 'admin123'
};

async function generateHash() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(credentials.password, salt);
        console.log('\n=== CREDENCIAIS PARA USAR ===');
        console.log(`Username: ${credentials.username}`);
        console.log(`Password: ${credentials.password}`);
        console.log('\nCole este hash em lib/auth.js:');
        console.log(hash);
    } catch (err) {
        console.error('Erro:', err);
    }
}

generateHash();
