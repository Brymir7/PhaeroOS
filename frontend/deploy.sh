#!/bin/bash

# Build the project
python3 build_for_production.py

# Define your S3 bucket name and CloudFront distribution ID (if using CloudFront)
S3_BUCKET="frontend.phaero.net"
CLOUDFRONT_DISTRIBUTION_ID="E2UI5GPNMHR1KP"

# Sync the built files to S3 with cache control settings
aws s3 sync ./dist s3://$S3_BUCKET --delete --cache-control "no-cache, no-store, must-revalidate" --expires 0

# Set the correct content types
echo "Setting Content-Type for JS files..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE

echo "Setting Content-Type for CSS files..."
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE

# Optional: Invalidate CloudFront cache (if using CloudFront)
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
fi

echo "Deployment complete."
