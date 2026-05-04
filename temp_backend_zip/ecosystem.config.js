module.exports = {
  apps: [
    {
      name: 'insightforge-api',
      cwd: './server',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: 5000,
      },
      error_file: '../logs/api-error.log',
      out_file: '../logs/api-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
