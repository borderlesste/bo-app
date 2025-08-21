const mysql = require('mysql2/promise');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class PayPalHealthCheck {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };
    
    this.apiBase = process.env.API_BASE || 'http://localhost:4001';
    this.checks = [];
  }

  async runHealthChecks() {
    console.log('🏥 PayPal Integration Health Check');
    console.log('=' + '='.repeat(50));
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base: ${this.apiBase}`);
    console.log('=' + '='.repeat(50));

    try {
      await this.checkDatabaseConnection();
      await this.checkPayPalTables();
      await this.checkAPIEndpoints();
      await this.checkWebhookEndpoint();
      await this.checkRecentActivity();
      await this.checkDataConsistency();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    }
  }

  async checkDatabaseConnection() {
    console.log('🔍 Checking database connection...');
    
    try {
      const connection = await mysql.createConnection(this.dbConfig);
      await connection.execute('SELECT 1');
      await connection.end();
      
      this.addCheck('Database Connection', 'PASS', 'Connected successfully');
    } catch (error) {
      this.addCheck('Database Connection', 'FAIL', error.message);
      throw error;
    }
  }

  async checkPayPalTables() {
    console.log('🔍 Checking PayPal database tables...');
    
    try {
      const connection = await mysql.createConnection(this.dbConfig);
      
      // Check pedidos table PayPal fields
      const [pedidosColumns] = await connection.execute(`
        SHOW COLUMNS FROM pedidos WHERE Field IN ('paypal_order_id', 'paypal_capture_id', 'payment_method')
      `);
      
      // Check pagos table PayPal fields
      const [pagosColumns] = await connection.execute(`
        SHOW COLUMNS FROM pagos WHERE Field IN ('paypal_order_id', 'paypal_capture_id', 'paypal_payer_email', 'payment_gateway')
      `);
      
      // Check webhooks_paypal table
      const [webhooksExists] = await connection.execute(`
        SHOW TABLES LIKE 'webhooks_paypal'
      `);
      
      await connection.end();
      
      const pedidosPass = pedidosColumns.length === 3;
      const pagosPass = pagosColumns.length === 4;
      const webhooksPass = webhooksExists.length > 0;
      
      this.addCheck('Pedidos PayPal Fields', pedidosPass ? 'PASS' : 'FAIL', 
        `Found ${pedidosColumns.length}/3 required fields`);
      this.addCheck('Pagos PayPal Fields', pagosPass ? 'PASS' : 'FAIL', 
        `Found ${pagosColumns.length}/4 required fields`);
      this.addCheck('Webhooks PayPal Table', webhooksPass ? 'PASS' : 'FAIL', 
        webhooksPass ? 'Table exists' : 'Table missing');
        
    } catch (error) {
      this.addCheck('PayPal Tables', 'FAIL', error.message);
      throw error;
    }
  }

  async checkAPIEndpoints() {
    console.log('🔍 Checking API endpoints...');
    
    const endpoints = [
      { name: 'Health Check', path: '/api/health' },
      { name: 'PayPal Webhook', path: '/api/paypal/webhook/paypal', method: 'POST' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const method = endpoint.method || 'GET';
        const url = `${this.apiBase}${endpoint.path}`;
        
        if (method === 'GET') {
          const response = await axios.get(url, { timeout: 5000 });
          this.addCheck(`API: ${endpoint.name}`, 'PASS', 
            `Status: ${response.status}`);
        } else {
          // For POST endpoints, just check if they're reachable
          try {
            await axios.post(url, {}, { timeout: 5000 });
            this.addCheck(`API: ${endpoint.name}`, 'PASS', 'Endpoint reachable');
          } catch (error) {
            if (error.response && error.response.status < 500) {
              this.addCheck(`API: ${endpoint.name}`, 'PASS', 
                `Endpoint reachable (${error.response.status})`);
            } else {
              throw error;
            }
          }
        }
        
      } catch (error) {
        this.addCheck(`API: ${endpoint.name}`, 'FAIL', 
          error.code || error.message);
      }
    }
  }

  async checkWebhookEndpoint() {
    console.log('🔍 Testing PayPal webhook endpoint...');
    
    try {
      const testWebhook = {
        id: 'WH-HEALTH-CHECK-' + Date.now(),
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'CAPTURE-HEALTH-CHECK',
          amount: { value: '1.00', currency_code: 'USD' },
          supplementary_data: {
            related_ids: { order_id: 'ORDER-HEALTH-CHECK' }
          }
        }
      };
      
      const response = await axios.post(
        `${this.apiBase}/api/paypal/webhook/paypal`,
        testWebhook,
        {
          headers: {
            'Content-Type': 'application/json',
            'paypal-transmission-id': 'health-check-' + Date.now()
          },
          timeout: 10000
        }
      );
      
      this.addCheck('PayPal Webhook Processing', 'PASS', 
        `Status: ${response.status}, Response: ${response.data.message || 'OK'}`);
        
    } catch (error) {
      this.addCheck('PayPal Webhook Processing', 'FAIL', 
        error.response?.data?.message || error.message);
    }
  }

  async checkRecentActivity() {
    console.log('🔍 Checking recent PayPal activity...');
    
    try {
      const connection = await mysql.createConnection(this.dbConfig);
      
      // Check recent PayPal orders
      const [recentOrders] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM pedidos 
        WHERE payment_method = 'paypal' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);
      
      // Check recent webhooks
      const [recentWebhooks] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM webhooks_paypal 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);
      
      // Check failed webhooks
      const [failedWebhooks] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM webhooks_paypal 
        WHERE status = 'failed' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);
      
      await connection.end();
      
      this.addCheck('Recent PayPal Orders (24h)', 'INFO', 
        `${recentOrders[0].count} orders created`);
      this.addCheck('Recent Webhooks (24h)', 'INFO', 
        `${recentWebhooks[0].count} webhooks received`);
      
      const failedCount = failedWebhooks[0].count;
      this.addCheck('Failed Webhooks (24h)', failedCount > 10 ? 'WARN' : 'PASS', 
        `${failedCount} failed webhooks`);
        
    } catch (error) {
      this.addCheck('Recent Activity', 'FAIL', error.message);
    }
  }

  async checkDataConsistency() {
    console.log('🔍 Checking data consistency...');
    
    try {
      const connection = await mysql.createConnection(this.dbConfig);
      
      // Check orders without PayPal order ID
      const [ordersWithoutPayPal] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM pedidos 
        WHERE payment_method = 'paypal' 
        AND paypal_order_id IS NULL 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      
      // Check payments without matching orders
      const [orphanedPayments] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM pagos p
        LEFT JOIN pedidos pe ON p.paypal_order_id = pe.paypal_order_id
        WHERE p.payment_gateway = 'paypal' 
        AND pe.id IS NULL
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      
      // Check pending orders older than 2 hours
      const [stalePendingOrders] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM pedidos 
        WHERE payment_method = 'paypal' 
        AND estado = 'nuevo' 
        AND created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)
      `);
      
      await connection.end();
      
      const ordersIssue = ordersWithoutPayPal[0].count;
      const paymentsIssue = orphanedPayments[0].count;
      const staleIssue = stalePendingOrders[0].count;
      
      this.addCheck('Orders Missing PayPal ID', ordersIssue > 0 ? 'WARN' : 'PASS', 
        `${ordersIssue} orders found`);
      this.addCheck('Orphaned Payments', paymentsIssue > 0 ? 'WARN' : 'PASS', 
        `${paymentsIssue} payments found`);
      this.addCheck('Stale Pending Orders', staleIssue > 5 ? 'WARN' : 'PASS', 
        `${staleIssue} orders older than 2h`);
        
    } catch (error) {
      this.addCheck('Data Consistency', 'FAIL', error.message);
    }
  }

  addCheck(name, status, details) {
    this.checks.push({ name, status, details, timestamp: new Date() });
    
    const icons = {
      'PASS': '✅',
      'FAIL': '❌', 
      'WARN': '⚠️',
      'INFO': 'ℹ️'
    };
    
    console.log(`${icons[status]} ${name}: ${details}`);
  }

  generateReport() {
    console.log('\n📊 HEALTH CHECK SUMMARY');
    console.log('=' + '='.repeat(50));
    
    const summary = this.checks.reduce((acc, check) => {
      acc[check.status] = (acc[check.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`✅ PASSED: ${summary.PASS || 0}`);
    console.log(`❌ FAILED: ${summary.FAIL || 0}`);
    console.log(`⚠️  WARNINGS: ${summary.WARN || 0}`);
    console.log(`ℹ️  INFO: ${summary.INFO || 0}`);
    
    const overallStatus = summary.FAIL > 0 ? 'CRITICAL' : 
                         summary.WARN > 0 ? 'WARNING' : 'HEALTHY';
    
    console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);
    
    if (summary.FAIL > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      this.checks
        .filter(check => check.status === 'FAIL')
        .forEach(check => console.log(`   • ${check.name}: ${check.details}`));
    }
    
    if (summary.WARN > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.checks
        .filter(check => check.status === 'WARN')
        .forEach(check => console.log(`   • ${check.name}: ${check.details}`));
    }
    
    console.log('\n✅ Health check completed at:', new Date().toISOString());
    
    // Exit with appropriate code
    if (summary.FAIL > 0) {
      process.exit(1);
    } else if (summary.WARN > 0) {
      process.exit(2); // Warning exit code
    } else {
      process.exit(0); // Success
    }
  }
}

// Execute health check if called directly
if (require.main === module) {
  const healthCheck = new PayPalHealthCheck();
  healthCheck.runHealthChecks()
    .catch((error) => {
      console.error('💥 Health check crashed:', error);
      process.exit(1);
    });
}

module.exports = PayPalHealthCheck;