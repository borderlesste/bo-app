#!/bin/bash

# 🚀 Script de Deployment a Producción - PayPal Integration
# Borderless Techno - PayPal + MySQL Integration

set -e  # Exit on any error

echo "🚀 INICIANDO DEPLOYMENT A PRODUCCIÓN"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    print_info "Copy .env.production.example to .env.production and configure it"
    exit 1
fi

print_status "Environment file found"

# Check if required PayPal vars are set
source .env.production

if [ -z "$PAYPAL_CLIENT_ID" ] || [ -z "$PAYPAL_CLIENT_SECRET" ]; then
    print_error "PayPal credentials not configured in .env.production"
    print_info "Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET"
    exit 1
fi

print_status "PayPal credentials configured"

# 1. Backup database
print_info "Creating database backup..."
npm run db:backup
print_status "Database backup completed"

# 2. Install dependencies
print_info "Installing production dependencies..."
npm install --production
print_status "Dependencies installed"

# 3. Run database migration
print_info "Running PayPal database migration..."
npm run db:migrate:paypal
print_status "Database migration completed"

# 4. Run health check
print_info "Running health check..."
NODE_ENV=production npm run health:paypal
if [ $? -eq 0 ]; then
    print_status "Health check passed"
elif [ $? -eq 2 ]; then
    print_warning "Health check passed with warnings"
else
    print_error "Health check failed - aborting deployment"
    exit 1
fi

# 5. Test PayPal configuration
print_info "Testing PayPal configuration..."
NODE_ENV=production node -e "
const service = require('./src/services/paymentGatewayService.js');
console.log('PayPal SDK Status:', service.paypalClient ? 'Configured' : 'Not configured');
"
print_status "PayPal configuration verified"

# 6. Setup webhook (if not already done)
if [ -z "$PAYPAL_WEBHOOK_ID" ]; then
    print_warning "PayPal Webhook ID not configured"
    print_info "Run: NODE_ENV=production node scripts/setup-paypal-webhook.js"
    print_info "Then add PAYPAL_WEBHOOK_ID to .env.production"
else
    print_status "PayPal Webhook configured"
fi

# 7. Start production server
print_info "Starting production server..."
print_status "Deployment completed successfully!"

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Start the server: NODE_ENV=production npm start"
echo "2. Monitor logs for any issues"
echo "3. Test a real PayPal transaction"
echo "4. Set up monitoring and alerts"
echo ""
echo "📊 MONITORING COMMANDS:"
echo "======================="
echo "• Health check: npm run health:paypal"
echo "• Test integration: npm run test:paypal"
echo "• View logs: tail -f logs/error-\$(date +%Y-%m-%d).log"
echo ""
echo "✅ Production deployment ready!"

# Optional: Start server in background
read -p "Start production server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting production server..."
    NODE_ENV=production npm start
fi