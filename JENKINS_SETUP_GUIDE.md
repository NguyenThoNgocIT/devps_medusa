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
oke
# Lấy ACR credentials (hoặc dùng service principal từ trên)
az acr update -n medusaregistry --admin-enabled true
az acr credential show --name medusaregistry
```

---

## 📋 Bước 3: Tạo Azure Database for PostgreSQL (Flexible Server)

```bash
# Tạo PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group medusa-rg \
  --name medusa-db-server \
  --location southeastasia \
  --admin-user adminuser \
  --admin-password "nguyenthongoc!" \
  --sku-name standard_d2s_v3 \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0 \
  --backup-retention 7

# Mở firewall để Azure services có thể truy cập
az postgres flexible-server firewall-rule create \
  --resource-group medusa-rg \
  --name medusa-db-server \
  --rule-name AllowAzureIps \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Tạo database
az postgres flexible-server db create \
  --resource-group medusa-rg \
  --server-name medusa-db-server \
  --database-name medusa
```

---

## 📋 Bước 4: Cấu hình Jenkins Credentials

1. **Truy cập Jenkins**: http://4.188.81.70:8080
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
- **Secret**: `ec5ceac6-30de-4aff-9e7e-39a06d09c6f3`
- **ID**: `azure-subscription-id`

---

### d. ACR Credentials

- **Kind**: Username with password
- **Username**: `medusaregistry`
- **Password**: (lấy từ command: `az acr credential show --name medusaregistry`)
- **ID**: `acr-credentials`

⚠️ **Lưu ý**: Không lưu password trực tiếp trong file. Dùng Azure CLI để lấy:

```bash
az acr credential show --name medusaregistry --query "passwords[0].value" -o tsv
```

### e. GitHub Credentials

- **Kind**: Username with password
- **Username**: `NguyenThoNgocIT`
- **Password**: `YOUR_GITHUB_TOKEN` (generate từ GitHub Settings → Developer settings → Personal access tokens)
- **ID**: `github-credentials`

---

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
   - **Branch**: `*/main`
   - **Script Path**: `Jenkinsfile`

4. **Build Triggers**

   - ✅ GitHub hook trigger for GITScm polling
   - ✅ Poll SCM: `H/5 * * * *` (check mỗi 5 phút)

5. **Save**

---

## 📋 Bước 6: Setup GitHub Webhook

1. **Truy cập GitHub Repository Settings**

   - https://github.com/NguyenThoNgocIT/devps_medusa/settings/hooks

2. **Add webhook**

   - **Payload URL**: `http://4.188.81.70:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Secret**: Leave empty (GitHub sẽ tự generate nếu cần)
   - **SSL verification**: ✅ Enable SSL verification (bình thường)
   - **Which events would you like to trigger this webhook?**: Chọn `Let me select individual events`
   - **Events** (chọn):
     - ✅ Push
     - ✅ Pull requests
   - **Active**: ✅ Checked

3. **Save**

---

## 📋 Bước 7a: Cài đặt Redis trên Azure VM

```bash
# SSH vào Azure VM
ssh -i your-key.pem azureuser@4.188.81.70

# Cài đặt Redis
sudo apt update
sudo apt install -y redis-server

# Khởi động Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Kiểm tra Redis chạy
redis-cli ping
# Output: PONG
```

---

## 📋 Bước 7b: Cấu hình Environment Variables

**Tạo .env cho production**

```bash
# SSH vào Azure VM (nếu chưa có)
ssh -i your-key.pem vothecong@4.188.81.70

# Tạo folder
mkdir -p /home/vothecong/.medusa

# Tạo .env file
cat > /home/vothecong/.medusa/.env << 'EOF'
DATABASE_URL=postgresql://adminuser:nguyenthongoc!@medusa-db-server.medusa-rg.southeastasia.azure.com:5432/medusa?sslmode=require
REDIS_URL=redis://localhost:6379
JWT_SECRET=pk_9a5ad44cf0a4d85672d9c3a4228badc684cf5a0a60d9fcf019af104f552bb8c9
COOKIE_SECRET=sk_f21420ab11b96a0024f884d793b84f378603184e932c15aaaef6a692a6cb8314
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
EOF

# Verify file tạo xong
cat /home/vothecong/.medusa/.env
```

**Option: Sử dụng Azure Key Vault (More Secure)**

```bash
# Tạo Key Vault
az provider register --namespace Microsoft.KeyVault
Registering is still on-going. You can monitor using 'az provider show -n Microsoft.KeyVault'
az provider show --namespace Microsoft.KeyVault --query registrationState
---
az keyvault create --name medusa-vault --resource-group medusa-rg --location southeastasia

# Store secrets
vothecong@thecong221:~$ az ad user show --id Cong100508@donga.edu.vn --query id -o tsv
fb292abd-0b19-453c-b0cc-3c69f588be5c

# Lấy User ID của bạn
USER_ID=$(az ad signed-in-user show --query id -o tsv)

# Cấp quyền Key Vault Secrets Officer
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee $USER_ID \
  --scope /subscriptions/ec5ceac6-30de-4aff-9e7e-39a06d09c6f3/resourceGroups/medusa-rg/providers/Microsoft.KeyVault/vaults/medusa-vault

# Chờ 1-2 phút để RBAC propagate

# Sau đó set secrets (escape special character)
az keyvault secret set --vault-name medusa-vault --name database-url --value "postgresql://adminuser:nguyenthongoc\!@medusa-db-server.postgres.database.azure.com:5432/medusa?sslmode=require"

az keyvault secret set --vault-name medusa-vault --name redis-url --value "redis://localhost:6379"

az keyvault secret set --vault-name medusa-vault --name jwt-secret --value "pk_9a5ad44cf0a4d85672d9c3a4228badc684cf5a0a60d9fcf019af104f552bb8c9"

az keyvault secret set --vault-name medusa-vault --name cookie-secret --value "sk_f21420ab11b96a0024f884d793b84f378603184e932c15aaaef6a692a6cb8314"

# Verify
az keyvault secret list --vault-name medusa-vault

# Reference trong Jenkinsfile bằng cách lấy từ Key Vault
```

---

## 📋 Bước 8: Chạy Pipeline Lần Đầu

1. **Tạo commit** để trigger pipeline

   ```bash
   git add .
   git commit -m "Update production environment variables"
   git push origin main
   ```

2. **Build Log** sẽ hiển thị:

   - ✅ Checkout code
   - ✅ Build Docker image
   - ✅ Push lên ACR
   - ✅ Deploy lên Azure Container Instance
   - ✅ Verify health check

3. **Monitor** tại http://4.188.81.70:8080/job/Medusa-Backend-CI-CD/

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
ssh -i your-key.pem azureuser@4.188.81.70

# Tạo folder cho Prometheus config
mkdir -p /home/azureuser/prometheus

# Cấu hình Prometheus
cat > /home/azureuser/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'medusa-api'
    static_configs:
      - targets: ['medusa-backend-aci.LOCATION.azurecontainers.io:9000']

  - job_name: 'jenkins'
    static_configs:
      - targets: ['localhost:8080']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']
EOF

# Chạy Prometheus
docker run -d --name prometheus \
  -p 9090:9090 \
  -v /home/azureuser/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Chạy Grafana
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

- **Jenkins**: http://4.188.81.70:8080
- **Prometheus**: http://4.188.81.70:9090
- **Grafana**: http://4.188.81.70:3000
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
