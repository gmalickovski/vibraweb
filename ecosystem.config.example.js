module.exports = {
  apps: [{
    name: 'vibraweb',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
