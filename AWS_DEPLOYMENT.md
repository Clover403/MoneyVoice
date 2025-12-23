# ================================================
# INSTRUKSI DEPLOYMENT AWS - SCAN TUNAI
# ================================================

## 📋 DAFTAR ISI
1. [Persiapan Supabase Database](#1-persiapan-supabase-database)
2. [Setup AWS Infrastructure](#2-setup-aws-infrastructure)
3. [Deploy dengan EC2](#3-deploy-dengan-ec2)
4. [Deploy dengan ECS/Fargate](#4-deploy-dengan-ecsfargate)
5. [Setup Redis](#5-setup-redis)
6. [Domain & SSL](#6-domain--ssl)
7. [Monitoring & Logging](#7-monitoring--logging)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. PERSIAPAN SUPABASE DATABASE

### 1.1 Buat Project di Supabase
1. Buka https://supabase.com dan login
2. Klik "New Project"
3. Pilih organization dan nama project
4. Catat connection string yang diberikan

### 1.2 Connection String
```
DATABASE_URL=postgresql://postgres.lntelebxzbkmuzccrrku:Clover*403@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

### 1.3 Jalankan Migration
```bash
# Di local, set DATABASE_URL
export DATABASE_URL="postgresql://postgres.lntelebxzbkmuzccrrku:Clover*403@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

# Jalankan migration
cd backend
npm run db:migrate:prod
```

### 1.4 Verifikasi Koneksi
```bash
# Test connection
psql "postgresql://postgres.lntelebxzbkmuzccrrku:Clover*403@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" -c "SELECT NOW();"
```

---

## 2. SETUP AWS INFRASTRUCTURE

### 2.1 Buat VPC & Security Groups
```bash
# Via AWS Console atau CLI
aws ec2 create-security-group \
  --group-name scan-tunai-sg \
  --description "Security group for Scan Tunai"

# Buka port yang diperlukan
aws ec2 authorize-security-group-ingress \
  --group-name scan-tunai-sg \
  --protocol tcp --port 22 --cidr 0.0.0.0/0    # SSH (batasi ke IP Anda)
  
aws ec2 authorize-security-group-ingress \
  --group-name scan-tunai-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0    # HTTP
  
aws ec2 authorize-security-group-ingress \
  --group-name scan-tunai-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0   # HTTPS
  
aws ec2 authorize-security-group-ingress \
  --group-name scan-tunai-sg \
  --protocol tcp --port 5000 --cidr 0.0.0.0/0  # API (optional)
```

### 2.2 Buat IAM Role untuk EC2/ECS
```bash
# Buat role dengan permission:
# - AmazonEC2ContainerRegistryReadOnly
# - CloudWatchLogsFullAccess
# - AmazonSSMReadOnlyAccess (untuk parameter store)
```

---

## 3. DEPLOY DENGAN EC2

### 3.1 Launch EC2 Instance
- **AMI**: Amazon Linux 2023 atau Ubuntu 22.04
- **Instance Type**: t3.small (minimum) atau t3.medium (recommended)
- **Storage**: 20GB+ SSD
- **Security Group**: Gunakan yang sudah dibuat

### 3.2 Setup Server
```bash
# SSH ke EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Update system
sudo yum update -y   # Amazon Linux
# atau
sudo apt update && sudo apt upgrade -y   # Ubuntu

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs   # Amazon Linux
# atau
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs   # Ubuntu

# Install PM2
sudo npm install -g pm2

# Install Git
sudo yum install -y git   # Amazon Linux
sudo apt install -y git   # Ubuntu
```

### 3.3 Clone & Setup Project
```bash
# Clone repository
cd /home/ec2-user
git clone https://github.com/YOUR_USERNAME/scanTunai.git
cd scanTunai/backend

# Install dependencies
npm ci --only=production

# Setup environment variables
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.lntelebxzbkmuzccrrku:Clover*403@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
REDIS_URL=redis://default:YOUR_REDIS_PASSWORD@YOUR_REDIS_HOST:6379
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=https://your-frontend-domain.com
EOF

# Jalankan migration
npm run db:migrate:prod
```

### 3.4 Setup PM2
```bash
# Start aplikasi dengan PM2
pm2 start src/server.js --name scan-tunai-api

# Setup auto-restart
pm2 startup
pm2 save

# Monitor
pm2 logs scan-tunai-api
pm2 monit
```

### 3.5 Setup Nginx sebagai Reverse Proxy
```bash
# Install Nginx
sudo yum install -y nginx   # Amazon Linux
sudo apt install -y nginx   # Ubuntu

# Setup config
sudo tee /etc/nginx/conf.d/scan-tunai.conf << 'EOF'
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 4. DEPLOY DENGAN ECS/FARGATE

### 4.1 Push Docker Image ke ECR
```bash
# Login ke ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# Build image
cd backend
docker build -t scan-tunai-api .

# Tag & Push
docker tag scan-tunai-api:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/scan-tunai-api:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/scan-tunai-api:latest
```

### 4.2 Buat ECS Task Definition
```json
{
  "family": "scan-tunai-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "scan-tunai-api",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/scan-tunai-api:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "5000"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:ssm:ap-south-1:ACCOUNT:parameter/scan-tunai/database-url"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:ssm:ap-south-1:ACCOUNT:parameter/scan-tunai/jwt-secret"},
        {"name": "GEMINI_API_KEY", "valueFrom": "arn:aws:ssm:ap-south-1:ACCOUNT:parameter/scan-tunai/gemini-api-key"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/scan-tunai-api",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### 4.3 Store Secrets di Parameter Store
```bash
aws ssm put-parameter \
  --name "/scan-tunai/database-url" \
  --value "postgresql://postgres.lntelebxzbkmuzccrrku:Clover*403@aws-1-ap-south-1.pooler.supabase.com:6543/postgres" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/scan-tunai/jwt-secret" \
  --value "your-super-secret-jwt-key" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/scan-tunai/gemini-api-key" \
  --value "your-gemini-api-key" \
  --type "SecureString"
```

### 4.4 Buat ECS Service
```bash
aws ecs create-service \
  --cluster scan-tunai-cluster \
  --service-name scan-tunai-api \
  --task-definition scan-tunai-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=scan-tunai-api,containerPort=5000"
```

---

## 5. SETUP REDIS

### Option 1: AWS ElastiCache
```bash
# Buat Redis cluster via AWS Console
# - Engine: Redis
# - Node type: cache.t3.micro (untuk development)
# - Number of replicas: 0 (untuk development)
```

### Option 2: Upstash (Serverless Redis)
1. Buka https://upstash.com
2. Buat database Redis baru
3. Salin connection string ke REDIS_URL

### Option 3: Redis Cloud
1. Buka https://redis.com/try-free
2. Buat subscription gratis
3. Salin connection string

---

## 6. DOMAIN & SSL

### 6.1 Setup Route53
```bash
# Buat hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Update nameservers di domain registrar Anda
```

### 6.2 Setup SSL dengan Let's Encrypt (EC2)
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx   # Amazon Linux
sudo apt install -y certbot python3-certbot-nginx   # Ubuntu

# Generate certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renew
sudo crontab -e
# Tambahkan:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6.3 Setup SSL dengan ACM (ECS/ALB)
```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --validation-method DNS
```

---

## 7. MONITORING & LOGGING

### 7.1 CloudWatch Logs
```bash
# Buat log group
aws logs create-log-group --log-group-name /scan-tunai/api

# Set retention
aws logs put-retention-policy \
  --log-group-name /scan-tunai/api \
  --retention-in-days 30
```

### 7.2 CloudWatch Alarms
```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "scan-tunai-high-cpu" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### 7.3 Health Check Endpoint
API sudah punya endpoint `/api/health` untuk health check.

---

## 8. TROUBLESHOOTING

### Database Connection Issues
```bash
# Test dari EC2/container
psql "$DATABASE_URL" -c "SELECT NOW();"

# Check SSL requirement
# Pastikan dialectOptions.ssl di config
```

### PM2 Issues
```bash
pm2 logs --err
pm2 restart scan-tunai-api
pm2 delete scan-tunai-api && pm2 start src/server.js --name scan-tunai-api
```

### Docker Issues
```bash
# Check logs
docker logs scan-tunai-backend

# Masuk ke container
docker exec -it scan-tunai-backend sh

# Check environment
docker exec scan-tunai-backend printenv
```

### Network Issues
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxx

# Check VPC routing
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-xxx"
```

---

## 📝 CHECKLIST DEPLOYMENT

- [ ] Supabase database sudah dibuat dan accessible
- [ ] Migration sudah dijalankan
- [ ] EC2 instance atau ECS cluster sudah ready
- [ ] Environment variables sudah di-set
- [ ] Redis sudah dikonfigurasi
- [ ] SSL certificate sudah di-setup
- [ ] Domain sudah pointing ke server
- [ ] Health check endpoint berjalan
- [ ] Monitoring & alerts sudah aktif
- [ ] Backup database sudah dikonfigurasi
- [ ] CI/CD pipeline sudah ready (optional)

---

## 🔒 SECURITY CHECKLIST

- [ ] JWT_SECRET minimal 32 karakter random
- [ ] Database password sudah secure
- [ ] Security group hanya buka port yang diperlukan
- [ ] CORS sudah dikonfigurasi dengan benar
- [ ] Rate limiting sudah aktif
- [ ] Logging sensitif data sudah dimatikan
- [ ] HTTPS/SSL sudah aktif
