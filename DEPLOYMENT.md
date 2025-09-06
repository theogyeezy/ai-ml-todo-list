# 🚀 Deployment Guide

This guide explains how to set up automatic deployment from GitHub to AWS S3 using GitHub Actions.

## 📋 Prerequisites

- AWS account with S3 bucket configured for static website hosting
- GitHub repository with the project code
- AWS IAM user with S3 deployment permissions

## 🔧 AWS Setup

### 1. S3 Bucket Configuration

Your S3 bucket should be configured for static website hosting:
- **Bucket name**: `ai-todo-app-matthew-1757183940` (or your preferred name)
- **Public access**: Enabled for website hosting
- **Static website hosting**: Enabled with `index.html` as index document

### 2. IAM User Permissions

The AWS user needs the following IAM policy for S3 deployment:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::ai-todo-app-matthew-1757183940",
                "arn:aws:s3:::ai-todo-app-matthew-1757183940/*"
            ]
        }
    ]
}
```

## ⚙️ GitHub Actions Setup

### 1. Repository Secrets

Add these secrets in your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `VITE_AWS_ACCESS_KEY_ID` | AWS Access Key for build environment variables | ✅ |
| `VITE_AWS_SECRET_ACCESS_KEY` | AWS Secret Key for build environment variables | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS Access Key for deployment | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key for deployment | ✅ |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID (optional) | ❌ |

### 2. Workflow Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is configured to:

1. **Trigger**: On push to `main` branch
2. **Build**: Install dependencies and build the React app with environment variables
3. **Deploy**: Sync built files to S3 bucket
4. **Clean**: Remove old files from S3

### 3. Customization

Update the workflow file if you need to change:

- **S3 bucket name**: Change `s3://ai-todo-app-matthew-1757183940` to your bucket
- **AWS region**: Change `us-east-1` to your preferred region
- **Node.js version**: Currently set to version 18

## 🚀 Deployment Process

### Automatic Deployment

1. **Make changes** to your code
2. **Commit and push** to the main branch:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **Watch the deployment** in the Actions tab of your GitHub repository
4. **Visit your site** once deployment completes

### Manual Deployment

You can also trigger deployment manually:

1. Go to the **Actions** tab in your GitHub repository
2. Select the **Deploy to AWS S3** workflow
3. Click **Run workflow** → **Run workflow**

## 📊 Monitoring Deployments

### GitHub Actions Dashboard

Monitor your deployments in the GitHub Actions dashboard:
- **Build logs**: See detailed build and deployment steps
- **Deployment status**: Success/failure notifications
- **Build time**: Track deployment performance
- **Error debugging**: Review failed deployment logs

### AWS CloudWatch (Optional)

For advanced monitoring, you can set up CloudWatch to track:
- S3 request metrics
- Error rates
- Access patterns

## 🔄 CloudFront Integration (Optional)

If you're using CloudFront for CDN:

1. **Add secret**: `CLOUDFRONT_DISTRIBUTION_ID` with your distribution ID
2. **Uncomment** the CloudFront invalidation step in the workflow
3. **Update IAM permissions** to include CloudFront invalidation:

```json
{
    "Effect": "Allow",
    "Action": [
        "cloudfront:CreateInvalidation"
    ],
    "Resource": "*"
}
```

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**
- Check that all environment variables are set correctly
- Verify Node.js version compatibility
- Review build logs for dependency issues

**Deployment Failures:**
- Verify AWS credentials and permissions
- Check S3 bucket exists and is accessible
- Ensure bucket name matches in workflow file

**Application Not Working:**
- Verify environment variables are available during build
- Check browser console for runtime errors
- Ensure AWS DynamoDB tables exist and are accessible

### Debug Steps

1. **Check GitHub Actions logs** for detailed error messages
2. **Verify AWS credentials** have necessary permissions
3. **Test build locally** with same environment variables
4. **Check S3 bucket contents** after deployment

## 📈 Optimization Tips

### Build Performance
- Use `npm ci` instead of `npm install` for faster, reliable builds
- Enable dependency caching with `cache: 'npm'`
- Consider splitting large dependencies

### Deployment Performance
- Use `--delete` flag to remove stale files
- Consider CloudFront for global CDN
- Enable gzip compression on S3

## 🔒 Security Best Practices

- **Rotate AWS keys** regularly
- **Use least-privilege IAM policies**
- **Monitor AWS usage** for unexpected activity
- **Keep dependencies updated** for security patches
- **Review deployment logs** for sensitive information leaks

## 📞 Support

If you encounter issues:
1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review [AWS S3 static website hosting guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
3. Open an issue in this repository with deployment logs