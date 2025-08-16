/**
 * Simple test to verify the risk analysis API integration
 */

const BACKEND_URL = 'http://localhost:8000';
const TEST_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Example address

// Test function
async function testAPIIntegration() {
    console.log('🧪 Testing DeFiGuard Risk API Integration...');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Test Address:', TEST_ADDRESS);
    
    try {
        // Test health endpoint
        console.log('\n📡 Testing Health Endpoint...');
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Health check passed:', healthData.status);
        } else {
            throw new Error(`Health check failed: ${healthResponse.status}`);
        }

        // Test portfolio endpoint
        console.log('\n📊 Testing Portfolio Endpoint...');
        const portfolioResponse = await fetch(`${BACKEND_URL}/portfolio/${TEST_ADDRESS}`);
        if (portfolioResponse.ok) {
            const portfolioData = await portfolioResponse.json();
            console.log('✅ Portfolio data received:', {
                address: portfolioData.address,
                total_value: portfolioData.total_value_usd,
                chains: portfolioData.chains?.length || 0
            });
        } else {
            console.log('⚠️  Portfolio endpoint error:', portfolioResponse.status);
            // This might be expected if the address has no portfolio or backend not fully ready
        }

        // Test risk analysis endpoint
        console.log('\n🎯 Testing Risk Analysis Endpoint...');
        const riskResponse = await fetch(`${BACKEND_URL}/portfolio/${TEST_ADDRESS}/risk-analysis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (riskResponse.ok) {
            const riskData = await riskResponse.json();
            console.log('✅ Risk analysis completed:', {
                annual_return: riskData.portfolio_metrics?.annual_return,
                sharpe_ratio: riskData.portfolio_metrics?.sharpe_ratio,
                risk_contributions: riskData.risk_contribution?.data?.length || 0
            });
        } else {
            console.log('⚠️  Risk analysis endpoint error:', riskResponse.status);
            const errorText = await riskResponse.text();
            console.log('Error details:', errorText.substring(0, 200));
        }

        console.log('\n🎉 API Integration Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('\n💡 Possible issues:');
            console.log('   - Backend server not running on port 8000');
            console.log('   - Network connectivity issues');
            console.log('   - CORS configuration problems');
        }
    }
}

// Run the test if this is the main module
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    testAPIIntegration();
} else {
    // Browser environment
    console.log('Run this in a Node.js environment or browser console');
}
