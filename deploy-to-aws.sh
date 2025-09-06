#!/bin/bash

# AWS S3 Deployment Script for React Todo App
# Replace these with your actual values
BUCKET_NAME="ai-todo-app-matthew-$(date +%s)"
REGION="us-east-1"

echo "🚀 Deploying to AWS S3..."

# Build the app
echo "📦 Building production app..."
npm run build

# Create S3 bucket (if it doesn't exist)
echo "🪣 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Configure bucket for static website hosting
echo "🌐 Configuring bucket for static website hosting..."
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# Create bucket policy for public access
echo "📝 Setting bucket policy..."
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

# Upload files to S3
echo "📤 Uploading files to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control max-age=31536000

# Update index.html with no-cache
aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control no-cache,no-store,must-revalidate

# Clean up
rm bucket-policy.json

echo "✅ Deployment complete!"
echo "🌍 Your app is available at:"
echo "http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"