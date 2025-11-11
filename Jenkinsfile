pipeline {
	agent any
	environment {
		IMAGE_NAME = "my-medusa-backend"
		REGISTRY = "medusaregistry.azurecr.io"
		RESOURCE_GROUP = "medusa-rg"
		ACI_NAME = "medusa-backend-aci"
	}
	stages {
		stage('Checkout') {
			steps {
				checkout scm
			}
		}

		stage('Install & Test') {
			steps {
				sh '''
					cd my-medusa-store
					# Enable corepack with sudo if needed
					sudo corepack enable || true
					# Install dependencies
					yarn install --immutable --inline-builds || yarn install
					# Run tests
					yarn test:unit || true
				'''
			}
		}

		stage('Build Docker Image') {
			steps {
				script {
					sh "docker build -t ${IMAGE_NAME}:$BUILD_NUMBER -f my-medusa-store/Dockerfile ./my-medusa-store"
				}
			}
		}

		stage('Push to Registry') {
			steps {
				// Provide ACR credentials in Jenkins (username/password) with id 'acr-credentials'
				withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PSW')]) {
					sh "docker login ${env.REGISTRY} -u \$ACR_USER -p \$ACR_PSW"
					sh "docker tag ${IMAGE_NAME}:$BUILD_NUMBER ${env.REGISTRY}/${IMAGE_NAME}:$BUILD_NUMBER"
					sh "docker push ${env.REGISTRY}/${IMAGE_NAME}:$BUILD_NUMBER"
				}
			}
		}

		stage('Deploy to Azure Container Instance') {
			steps {
				// Azure service principal credentials stored in Jenkins with id 'azure-sp-credentials'
				// Also store AZ_TENANT_ID and AZ_SUBSCRIPTION_ID as Jenkins secret text or env vars
				withCredentials([
					usernamePassword(credentialsId: 'azure-sp-credentials', usernameVariable: 'AZ_CLIENT_ID', passwordVariable: 'AZ_CLIENT_SECRET'),
					usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USER', passwordVariable: 'ACR_PSW'),
					string(credentialsId: 'azure-tenant-id', variable: 'AZ_TENANT_ID'),
					string(credentialsId: 'azure-subscription-id', variable: 'AZ_SUBSCRIPTION_ID')
				]) {
					sh '''
						set -e
						az login --service-principal -u $AZ_CLIENT_ID -p $AZ_CLIENT_SECRET --tenant $AZ_TENANT_ID
						az account set --subscription $AZ_SUBSCRIPTION_ID
						# Create or update container instance
						az container create \
							--resource-group ${RESOURCE_GROUP} \
							--name ${ACI_NAME} \
							--image ${REGISTRY}/${IMAGE_NAME}:$BUILD_NUMBER \
							--os-type Linux \
							--cpu 1 --memory 2 \
							--ports 9000 \
							--dns-name-label medusa-backend \
							--registry-login-server ${REGISTRY} \
							--registry-username $ACR_USER --registry-password $ACR_PSW \
							--secure-environment-variables \
								DATABASE_URL="postgresql://adminuser:nguyenthongoc!@medusa-db-server.postgres.database.azure.com:5432/medusa?sslmode=require" \
								REDIS_URL="redis://20.193.132.187:6379" \
								JWT_SECRET="pk_9a5ad44cf0a4d85672d9c3a4228badc684cf5a0a60d9fcf019af104f552bb8c9" \
								COOKIE_SECRET="sk_f21420ab11b96a0024f884d793b84f378603184e932c15aaaef6a692a6cb8314" || true
					'''
				}
			}
		}
	}
	post {
		always {
	
			 deleteDir()
		}
	}
}

