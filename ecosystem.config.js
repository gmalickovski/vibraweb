module.exports = {
  apps: [{
    name: 'vibraweb',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      NOTION_API_KEY: process.env.NOTION_API_KEY,
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
      PORT: 3000
    }
  }]
}
