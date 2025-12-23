/**
 * PM2 Ecosystem Configuration
 * For production deployment
 */

module.exports = {
  apps: [
    {
      name: 'scan-tunai-api',
      script: 'src/server.js',
      instances: 'max', // Use all available CPUs
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Restart settings
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '5s'
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ec2-user',
      host: 'YOUR_EC2_IP',
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/scanTunai.git',
      path: '/home/ec2-user/scanTunai',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
