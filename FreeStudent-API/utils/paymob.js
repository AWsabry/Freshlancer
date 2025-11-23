const axios = require('axios');
const AppError = require('./AppError');

const PAYMOB_BASE_URL = 'https://accept.paymob.com/v1';

class PaymobService {
  constructor() {
    this.apiKey = process.env.PAYMOB_TOKEN;
    if (!this.apiKey) {
      console.error('PAYMOB_TOKEN is not set in environment variables');
    }
  }

  /**
   * Create a payment intention with Paymob
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment intention response
   */
  async createPaymentIntention(paymentData) {
    console.log('Creating Paymob payment intention with data:', paymentData);
    try {
      const {
        amount,
        currency = 'EGP',
        items = [],
        billingData,
        customer,
        integrationId = null,
      } = paymentData;

      // Build payment methods array with static integration ID
      const paymentMethods = [
        5404367, // Static integration ID as provided
        'card',
      ];

      // If custom integration ID provided, add it
      if (integrationId) {
        paymentMethods.push(integrationId);
      }

      // Build redirection URL for success callback
      const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
      const redirectionUrl = `${baseUrl}/api/v1/paymob/success`;

      const requestBody = {
        amount: Math.round(amount * 100), // Paymob expects amount in cents
        currency,
        payment_methods: paymentMethods,
        items: items.map(item => ({
          name: item.name,
          amount: Math.round(item.amount * 100),
          description: item.description || '',
          quantity: item.quantity || 1,
        })),
        billing_data: {
          apartment: billingData?.apartment || 'NA',
          first_name: billingData?.firstName || customer?.firstName || 'Guest',
          last_name: billingData?.lastName || customer?.lastName || 'User',
          street: billingData?.street || 'NA',
          building: billingData?.building || 'NA',
          phone_number: billingData?.phoneNumber || customer?.phone || '+201000000000',
          country: billingData?.country || 'EGY',
          email: billingData?.email || customer?.email,
          floor: billingData?.floor || 'NA',
          state: billingData?.state || 'NA',
        },
        customer: {
          first_name: customer?.firstName || 'Guest',
          last_name: customer?.lastName || 'User',
          email: customer?.email,
          extras: customer?.extras || {},
        },
        extras: paymentData.extras || {},
        redirection_url: redirectionUrl, // Paymob will redirect here after payment
      };

      console.log('=== PAYMOB REQUEST ===');
      console.log('URL:', `${PAYMOB_BASE_URL}/intention/`);
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('Headers:', {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      });

      const response = await axios.post(
        `${PAYMOB_BASE_URL}/intention/`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('=== PAYMOB RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));

      return {
        success: true,
        data: response.data,
        intentionId: response.data.id,
        clientSecret: response.data.client_secret,
        paymentUrl: response.data.payment_url || null,
      };
    } catch (error) {
      console.error('=== PAYMOB ERROR ===');
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      console.error('Error Message:', error.message);
      throw new AppError(
        error.response?.data?.message || 'Failed to create payment intention',
        error.response?.status || 500
      );
    }
  }

  /**
   * Verify payment status
   * @param {String} intentionId - Payment intention ID
   * @returns {Promise<Object>} Payment status
   */
  async verifyPayment(intentionId) {
    try {
      const response = await axios.get(
        `${PAYMOB_BASE_URL}/intention/${intentionId}`,
        {
          headers: {
            'Authorization': `Token ${this.apiKey}`,
          },
        }
      );

      return {
        success: true,
        status: response.data.status,
        isPaid: response.data.status === 'PROCESSED',
        data: response.data,
      };
    } catch (error) {
      console.error('Paymob Verification Error:', error.response?.data || error.message);
      throw new AppError(
        'Failed to verify payment',
        error.response?.status || 500
      );
    }
  }

  /**
   * Process webhook callback
   * @param {Object} webhookData - Webhook payload from Paymob
   * @returns {Object} Processed webhook data
   */
  processWebhook(webhookData) {
    return {
      intentionId: webhookData.id,
      status: webhookData.status,
      isPaid: webhookData.status === 'PROCESSED',
      amount: webhookData.amount / 100, // Convert from cents
      currency: webhookData.currency,
      transactionId: webhookData.transaction?.id || null,
      orderId: webhookData.order?.id || null,
    };
  }
}

module.exports = new PaymobService();
