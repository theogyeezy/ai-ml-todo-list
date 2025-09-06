# AWS Deployment Setup Guide

## Option 1: AWS S3 Static Hosting (Recommended - Simplest)

### Prerequisites
1. AWS Account (create at https://aws.amazon.com)
2. AWS CLI installed

### Install AWS CLI on Mac:
```bash
# Using Homebrew (recommended)
brew install awscli

# Or download from AWS
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

### Configure AWS CLI:
```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### Deploy Your App:
1. Edit `deploy-to-aws.sh` and change `BUCKET_NAME` to something unique (e.g., "my-ai-todo-app-2024")
2. Make the script executable: `chmod +x deploy-to-aws.sh`
3. Run: `./deploy-to-aws.sh`

Your app will be live at: `http://your-bucket-name.s3-website-us-east-1.amazonaws.com`

---

## Option 2: AWS Amplify (Easier but costs more)

### Install Amplify CLI:
```bash
npm install -g @aws-amplify/cli
```

### Initialize and Deploy:
```bash
amplify init
# Follow prompts to set up your project

amplify add hosting
# Choose "Hosting with Amplify Console"
# Choose "Manual deployment"

amplify publish
# This will build and deploy your app
```

---

## Option 3: Manual Upload (No CLI needed)

1. Go to AWS Console: https://console.aws.amazon.com/s3
2. Create a new bucket
3. Upload all files from the `dist/` folder
4. Go to bucket Properties → Static website hosting → Enable
5. Set index document to `index.html`
6. Go to Permissions → Block public access → Turn OFF all blocks
7. Add bucket policy (from Permissions → Bucket Policy):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

Your app will be available at the S3 website endpoint shown in Properties → Static website hosting.

---

## Costs:
- S3 Static Hosting: ~$0.50/month for a small app
- Amplify: ~$1-5/month depending on usage
- Both have free tiers for new accounts

## Benefits of AWS Deployment:
✅ No localhost issues
✅ Accessible from anywhere
✅ Scalable and reliable
✅ HTTPS available with CloudFront
✅ Real domain name possible with Route 53