# 📦 Installation Guide

This guide will walk you through setting up the AI/ML To Do List application from scratch.

## 🎯 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 16+** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **AWS Account** - [Sign up at aws.amazon.com](https://aws.amazon.com/)

## 🚀 Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/theogyeezy/ai-ml-todo-list.git
cd ai-ml-todo-list
```

### 2. Install Dependencies

```bash
npm install
# or if you prefer yarn
yarn install
```

### 3. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your AWS credentials
nano .env
```

Add your AWS credentials to the `.env` file:
```env
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key_here
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
```

### 4. AWS Setup

Create the required DynamoDB tables:

**TodoApp Table:**
- Partition key: `userId` (String)
- Sort key: `todoId` (String)

**TodoUsers Table:**
- Partition key: `email` (String)

See [AWS Setup Guide](../aws-setup.md) for detailed instructions.

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 🐳 Docker Installation (Optional)

If you prefer using Docker:

### 1. Build Docker Image

```bash
docker build -t ai-ml-todo-list .
```

### 2. Run Container

```bash
docker run -p 3000:3000 --env-file .env ai-ml-todo-list
```

## ☁️ AWS CLI Setup (For Deployment)

### 1. Install AWS CLI

**macOS:**
```bash
brew install awscli
```

**Windows:**
Download from [AWS CLI website](https://aws.amazon.com/cli/)

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 2. Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region (e.g., `us-east-1`)
- Default output format (`json`)

## 🔧 Development Tools Setup

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

## 🧪 Testing Setup

### 1. Install Testing Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### 2. Run Tests

```bash
npm run test
```

## 🚀 Production Build

### 1. Build for Production

```bash
npm run build
```

### 2. Preview Production Build

```bash
npm run preview
```

### 3. Deploy to AWS S3

```bash
./deploy-to-aws.sh
```

## ❗ Common Installation Issues

### Node.js Version Issues

**Error:** `node: command not found`
**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/)

### Permission Errors

**Error:** `EACCES: permission denied`
**Solution:** 
```bash
sudo chown -R $(whoami) ~/.npm
```

### AWS Credentials Issues

**Error:** `CredentialsError: Missing credentials`
**Solution:** 
1. Verify `.env` file has correct AWS keys
2. Check AWS credentials with `aws sts get-caller-identity`

### DynamoDB Access Issues

**Error:** `User is not authorized to perform dynamodb:*`
**Solution:** 
1. Check IAM user has DynamoDB permissions
2. Verify table names match in code and AWS

### Build Issues

**Error:** `Module not found` during build
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Verification Checklist

After installation, verify everything works:

- [ ] Development server starts without errors
- [ ] Can create an account and login
- [ ] AI features load (smart categorization works)
- [ ] Todos are saved to DynamoDB
- [ ] Admin dashboard accessible (for admin users)
- [ ] Build process completes successfully
- [ ] Production build runs correctly

## 📚 Next Steps

Once installed successfully:

1. **Read [Quick Start Guide](Quick-Start.md)** - Learn basic usage
2. **Explore [AI/ML Features](AI-ML-Features.md)** - Understand AI capabilities
3. **Set up [Deployment](Deployment-Guide.md)** - Deploy to production
4. **Check [Configuration](Configuration.md)** - Customize settings

## 🆘 Getting Help

If you encounter issues:

1. **Check [Troubleshooting Guide](Troubleshooting.md)**
2. **Search [GitHub Issues](https://github.com/theogyeezy/ai-ml-todo-list/issues)**
3. **Create a new issue** with:
   - Your operating system
   - Node.js version (`node --version`)
   - Error messages
   - Steps to reproduce

---

*Need help? Open an issue on [GitHub](https://github.com/theogyeezy/ai-ml-todo-list/issues)*