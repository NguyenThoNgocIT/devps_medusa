# 🚀 Hướng dẫn Cấu hình Jenkins CI/CD Pipeline cho Medusa trên Azure

## 📋 Bước 1: Chuẩn bị Azure Service Principal

```bash
# Đăng nhập Azure
az login

# Tạo service principal để Jenkins có thể deploy lên Azure
az ad sp create-for-rbac --name jenkins-sp --role Contributor

# Output sẽ có:
# - appId (Client ID)
# - password (Client Secret) 
# - tenant
# - name
```

Lưu lại 3 giá trị này để dùng trong Jenkins Credentials.

## 📋 Bước 2: Tạo Azure Container Registry (ACR)

```bash
# Tạo Resource Group
az group create --name medusa-rg --location southeastasia

# Tạo Container Registry
az acr create --resource-group medusa-rg \
  --name medusaregistry \
  --sku Basic

# Lấy ACR credentials (hoặc dùng service principal từ trên)
az acr credential show --name medusaregistry
```

## 📋 Bước 3: Tạo Azure Database for PostgreSQL

```bash
# Tạo PostgreSQL server
az postgres server create \
  --resource-group medusa-rg \
  --name medusa-db-server \
  --location southeastasia \
  --admin-user adminuser \
  --admin-password YOUR_PASSWORD \
  --sku-name B_Gen5_1 \
  --storage-size 51200 \
  --backup-retention 7 \
  --geo-redundant-backup Disabled

# Mở firewall để Azure services có thể truy cập
az postgres server firewall-rule create \
  --resource-group medusa-rg \
  --server-name medusa-db-server \
  --name AllowAzureIps \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Tạo database
az postgres db create \
  --resource-group medusa-rg \
  --server-name medusa-db-server \
  --name medusa
```

## 📋 Bước 4: Cấu hình Jenkins Credentials

1. **Truy cập Jenkins**: http://20.193.132.187:8080
2. **Đăng nhập** với admin password: `f5087371171846cfa4af09d617275627`
3. **Tạo Credentials** (Manage Jenkins → Credentials → System → Global credentials):

### a. Azure Service Principal
- **Kind**: Username with password
- **Username**: `<appId>` từ Service Principal
- **Password**: `<password>` từ Service Principal  
- **ID**: `azure-sp-credentials`

### b. Azure Tenant ID
- **Kind**: Secret text
- **Secret**: `<tenant>` từ Service Principal
- **ID**: `azure-tenant-id`

### c. Azure Subscription ID
- **Kind**: Secret text
- **Secret**: `YOUR_SUBSCRIPTION_ID`
- **ID**: `azure-subscription-id`

### d. ACR Credentials
- **Kind**: Username with password
- **Username**: `<username>` từ `az acr credential show`
- **Password**: `<password>` từ `az acr credential show`
- **ID**: `acr-credentials`

### e. GitHub Credentials
- **Kind**: Username with password
- **Username**: `YOUR_GITHUB_USERNAME`
- **Password**: `YOUR_GITHUB_TOKEN` (generate từ GitHub Settings → Developer settings → Personal access tokens)
- **ID**: `github-credentials`

## 📋 Bước 5: Tạo Jenkins Pipeline Job

1. **Tạo New Item**
   - Click "New Item"
   - Name: `Medusa-Backend-CI-CD`
   - Type: `Pipeline`
   - Click OK

2. **Cấu hình General**
   - ✅ GitHub project URL: `https://github.com/NguyenThoNgocIT/devps_medusa`

3. **Cấu hình Pipeline**
   - **Definition**: `Pipeline script from SCM`
   - **SCM**: `Git`
   - **Repository URL**: `https://github.com/NguyenThoNgocIT/devps_medusa.git`
   - **Credentials**: `github-credentials`
   - **Branch**: `*/update`
   - **Script Path**: `Jenkinsfile`

4. **Build Triggers**
   - ✅ GitHub hook trigger for GITScm polling
   - ✅ Poll SCM: `H/5 * * * *` (check mỗi 5 phút)

5. **Save**

## 📋 Bước 6: Setup GitHub Webhook

1. **Truy cập GitHub Repository Settings**
   - https://github.com/NguyenThoNgocIT/devps_medusa/settings/hooks

2. **Add webhook**
   - **Payload URL**: `http://20.193.132.187:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: 
     - Push events
     - Pull requests
   - ✅ Active

3. **Save**

## 📋 Bước 7: Cấu hình Environment Variables

Tạo file `.env-production` trong Azure VM (hoặc dùng Key Vault):

```bash
# SSH vào Azure VM
ssh -i your-key.pem azureuser@20.193.132.187

# Tạo .env cho production
cat > /home/azureuser/.medusa-env << 'EOF'
DATABASE_URL=postgresql://adminuser:PASSWORD@medusa-db-server.postgres.database.azure.com:5432/medusa?sslmode=require
REDIS_URL=redis://YOUR_REDIS_HOST:6379
JWT_SECRET=your-jwt-secret-key
COOKIE_SECRET=your-cookie-secret-key
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
EOF

# Hoặc sử dụng Azure Key Vault để store secrets
az keyvault create --name medusa-vault --resource-group medusa-rg --location southeastasia
az keyvault secret set --vault-name medusa-vault --name database-url --value "postgresql://..."
```

## 📋 Bước 8: Chạy Pipeline Pertama Kali

1. **Tạo commit** để trigger pipeline
2. **Build Log** sẽ hiển thị:
   - ✅ Checkout code
   - ✅ Build Docker image
   - ✅ Push lên ACR
   - ✅ Deploy lên Azure Container Instance
   - ✅ Verify health check

3. **Monitor** tại http://20.193.132.187:8080/job/Medusa-Backend-CI-CD/

## 📋 Bước 9: Kiểm tra Deployment

```bash
# Lấy URL của Container Instance
az container show --resource-group medusa-rg --name medusa-backend-aci --query ipAddress.fqdn

# Test endpoint
curl http://medusa-backend-aci.LOCATION.azurecontainers.io:9000/health

# Xem logs
az container logs --resource-group medusa-rg --name medusa-backend-aci
```

## 📋 Bước 10: Cấu hình Prometheus + Grafana trên Jenkins VM

```bash
# SSH vào VM
ssh -i your-key.pem azureuser@20.193.132.187

# Cấu hình Prometheus
cat > /home/azureuser/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'medusa-api'
    static_configs:
      - targets: ['medusa-backend-aci.LOCATION.azurecontainers.io:9000']
  
  - job_name: 'jenkins'
    static_configs:
      - targets: ['localhost:8080']
EOF

# Chạy Prometheus + Grafana
docker run -d --name prometheus \
  -p 9090:9090 \
  -v /home/azureuser/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

docker run -d --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

## 🔒 Bảo mật - Best Practices

✅ **Không để credentials hardcoded**
- Sử dụng Jenkins Credentials System
- Sử dụng Azure Key Vault cho production secrets

✅ **Quản lý quyền**
- Tạo GitHub Teams và set branch protection rules
- Yêu cầu PR reviews trước merge
- Audit Jenkins access logs

✅ **SSL/TLS**
- Cấu hình HTTPS cho Jenkins
- Sử dụng sslmode=require cho PostgreSQL connection string

## 📊 Monitoring Dashboard

Sau khi setup, truy cập:
- **Jenkins**: http://20.193.132.187:8080
- **Prometheus**: http://20.193.132.187:9090
- **Grafana**: http://20.193.132.187:3000
- **Medusa API**: http://medusa-backend-aci.LOCATION.azurecontainers.io:9000/app
- **Medusa Health**: http://medusa-backend-aci.LOCATION.azurecontainers.io:9000/health

## 🆘 Troubleshooting

**Pipeline build failed - Docker not found**
```bash
# Kiểm tra Docker installation trên Jenkins VM
docker version
docker ps
```

**ACR push failed - authentication error**
```bash
# Re-login to ACR
az acr login --name medusaregistry
```

**Container fails to start**
```bash
# Check logs
az container logs --resource-group medusa-rg --name medusa-backend-aci --follow
```

**Database connection refused**
```bash
# Kiểm tra firewall rules
az postgres server firewall-rule list --resource-group medusa-rg --server-name medusa-db-server
```

---

## ✅ Checklist

- [ ] Azure Service Principal tạo xong
- [ ] ACR tạo xong
- [ ] PostgreSQL tạo xong
- [ ] Jenkins Credentials setup xong
- [ ] Pipeline Job tạo xong
- [ ] GitHub Webhook setup xong
- [ ] Prometheus + Grafana chạy xong
- [ ] Test build đầu tiên thành công
- [ ] Medusa API deploy lên Azure thành công

---

Hãy follow các bước trên để setup đầy đủ! 🎉
