module.exports = {
  apps: [
    {
      name: 'ereja',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      watch_delay: 1000,
      ignore_watch: ['node_modules', '.next/cache', 'logs', 'dev.log', 'server.log'],
      env: {
        NODE_ENV: 'production',
        PORT: 9003
      }
    }
  ]
};
