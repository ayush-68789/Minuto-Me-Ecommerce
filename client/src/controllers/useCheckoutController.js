// Owner: Member 5 — Checkout React controller hook aligned with hardened /api/checkout.
import { useState, useCallback } from 'react';
import orderModel from '../models/orderModel.js';

export function useCheckoutController(initialValues = {}) {
  const [formData, setFormData] = useState({
    customer: {
      name: initialValues.name || '',
      email: initialValues.email || '',
      phone: initialValues.phone || ''
    },
    shippingAddress: {
      street: initialValues.street || '',
      city: initialValues.city || '',
      state: initialValues.state || '',
      postalCode: initialValues.postalCode || '',
      country: initialValues.country || 'US'
    },
    paymentMethod: initialValues.paymentMethod || 'demo_card'
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  const updateCustomer = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      customer: { ...prev.customer, [field]: value }
    }));
  }, []);

  const updateShippingAddress = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [field]: value }
    }));
  }, []);

  const setPaymentMethod = useCallback((method) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  }, []);

  const validate = useCallback(() => {
    const { customer, shippingAddress } = formData;
    if (!customer.name.trim()) return 'Please enter your full name.';
    if (!customer.email.trim() || !customer.email.includes('@')) return 'Please enter a valid email address.';
    if (!shippingAddress.street.trim()) return 'Please enter your delivery street address.';
    if (!shippingAddress.city.trim()) return 'Please enter your delivery city.';
    return null;
  }, [formData]);

  const submitCheckout = useCallback(async ({ tenantId = 'default', items = [] } = {}) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return null;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await orderModel.checkout({
        items,
        customer: formData.customer,
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod
      }, tenantId);

      setCompletedOrder(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [formData, validate]);

  return {
    formData,
    updateCustomer,
    updateShippingAddress,
    setPaymentMethod,
    submitCheckout,
    submitting,
    error,
    completedOrder
  };
}

export default useCheckoutController;
