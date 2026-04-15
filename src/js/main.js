/**
 * Cardio Costa Rica — Main Frontend Logic
 * Cart, form validation, payment routing, Meta Pixel tracking
 */

// ============================================
// CONFIG
// ============================================
const CONFIG = {
  productName: 'Tensiómetro Digital de Muñeca',
  unitPrice: 14900,
  shippingCost: 3000,
  currency: 'CRC',
  whatsappNumber: '50688888888', // Replace with actual
  apiBase: '',
};

// ============================================
// STATE
// ============================================
const state = {
  quantity: 1,
  viewedProducts: new Set(),
};

// ============================================
// HELPERS
// ============================================
function formatCRC(amount) {
  return `₡${amount.toLocaleString('es-CR')}`;
}

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${ts}-${rand}`;
}

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

// ============================================
// META PIXEL HELPERS
// ============================================
function metaTrack(eventName, params = {}, options = {}) {
  if (typeof fbq !== 'undefined') {
    if (options.eventID) {
      fbq('track', eventName, params, { eventID: options.eventID });
    } else {
      fbq('track', eventName, params);
    }
  }
}

// ============================================
// NAVIGATION
// ============================================
function initNav() {
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
  });

  $$('.mobile-menu__link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// ============================================
// QUANTITY & CART
// ============================================
function initCart() {
  const minusBtn = $('[data-action="decrease"]');
  const plusBtn = $('[data-action="increase"]');
  const qtyDisplay = $('#qtyValue');

  if (!minusBtn || !plusBtn) return;

  function updateCart() {
    qtyDisplay.textContent = state.quantity;

    // Minus button state
    if (state.quantity <= 0) {
      minusBtn.classList.add('disabled');
    } else {
      minusBtn.classList.remove('disabled');
    }

    // Update summary
    const subtotal = state.quantity * CONFIG.unitPrice;
    const shipping = state.quantity > 0 ? CONFIG.shippingCost : 0;
    const total = subtotal + shipping;

    $('#subtotal').textContent = formatCRC(subtotal);
    $('#shipping').textContent = state.quantity > 0 ? formatCRC(CONFIG.shippingCost) : '₡0';
    $('#totalDisplay').textContent = formatCRC(total);

    // Update submit button
    updateSubmitButton();

    // Track AddToCart
    if (state.quantity > 0) {
      metaTrack('AddToCart', {
        content_name: CONFIG.productName,
        content_type: 'product',
        value: subtotal,
        currency: CONFIG.currency,
      });
    }
  }

  minusBtn.addEventListener('click', () => {
    if (state.quantity > 0) {
      state.quantity--;
      updateCart();
    }
  });

  plusBtn.addEventListener('click', () => {
    state.quantity++;
    updateCart();
  });

  // Initialize
  updateCart();
}

function updateSubmitButton() {
  const btn = $('#submitBtn');
  if (!btn) return;

  const total = state.quantity * CONFIG.unitPrice + (state.quantity > 0 ? CONFIG.shippingCost : 0);
  const paymentMethod = $('#metodoPago')?.value;

  if (state.quantity <= 0) {
    btn.disabled = true;
    btn.textContent = 'Agregá productos para continuar';
    return;
  }

  btn.disabled = false;

  if (paymentMethod === 'tilopay') {
    btn.textContent = `Pagar con Tarjeta — ${formatCRC(total)}`;
  } else if (paymentMethod === 'sinpe') {
    btn.textContent = `Ordenar con SINPE — ${formatCRC(total)}`;
  } else {
    btn.textContent = `Realizar Pedido — ${formatCRC(total)}`;
  }
}

// ============================================
// PAYMENT METHOD
// ============================================
function initPaymentMethod() {
  const select = $('#metodoPago');
  const sinpeHint = $('#sinpeHint');

  if (!select) return;

  select.addEventListener('change', () => {
    if (sinpeHint) {
      sinpeHint.hidden = select.value !== 'sinpe';
    }
    updateSubmitButton();
  });
}

// ============================================
// FORM VALIDATION
// ============================================
function validateForm() {
  let isValid = true;
  const errors = [];

  // Clear previous errors
  $$('.form-group input.error, .form-group select.error, .form-group textarea.error').forEach(el => {
    el.classList.remove('error');
  });
  $$('.error-message').forEach(el => {
    el.textContent = '';
  });

  // Required fields
  const fields = [
    { id: 'nombre', label: 'nombre', minLength: 2 },
    { id: 'telefono', label: 'teléfono', pattern: /^\d{8}$/, transform: v => v.replace(/[\s\-]/g, '') },
    { id: 'email', label: 'correo', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    { id: 'provincia', label: 'provincia' },
    { id: 'direccion', label: 'dirección', minLength: 10 },
    { id: 'metodoPago', label: 'método de pago' },
  ];

  for (const field of fields) {
    const el = $(`#${field.id}`);
    if (!el) continue;

    let value = el.value.trim();
    if (field.transform) value = field.transform(value);

    const errorEl = el.parentElement.querySelector('.error-message');

    if (!value) {
      el.classList.add('error');
      if (errorEl) errorEl.textContent = 'Este campo es obligatorio';
      if (isValid) errors.push(el);
      isValid = false;
      continue;
    }

    if (field.minLength && value.length < field.minLength) {
      el.classList.add('error');
      if (errorEl) errorEl.textContent = `Mínimo ${field.minLength} caracteres`;
      if (isValid) errors.push(el);
      isValid = false;
      continue;
    }

    if (field.pattern && !field.pattern.test(value)) {
      el.classList.add('error');
      if (field.id === 'telefono') {
        if (errorEl) errorEl.textContent = 'Ingresa 8 dígitos (ej: 88889999)';
      } else if (field.id === 'email') {
        if (errorEl) errorEl.textContent = 'Ingresa un correo válido';
      }
      if (isValid) errors.push(el);
      isValid = false;
    }
  }

  // Scroll to first error
  if (errors.length > 0) {
    errors[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    errors[0].focus();
  }

  return isValid;
}

function getFormData() {
  return {
    nombre: $('#nombre').value.trim(),
    telefono: $('#telefono').value.trim().replace(/[\s\-]/g, ''),
    email: $('#email').value.trim(),
    provincia: $('#provincia').value,
    canton: $('#canton').value.trim(),
    distrito: $('#distrito').value.trim(),
    direccion: $('#direccion').value.trim(),
    metodoPago: $('#metodoPago').value,
    comentarios: $('#comentarios').value.trim(),
  };
}

// ============================================
// ORDER SUBMISSION
// ============================================
function initOrderForm() {
  const form = $('#orderForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (state.quantity <= 0) return;
    if (!validateForm()) return;

    const formData = getFormData();
    const orderId = generateOrderId();
    const subtotal = state.quantity * CONFIG.unitPrice;
    const total = subtotal + CONFIG.shippingCost;

    const orderData = {
      orderId,
      customer: {
        name: formData.nombre,
        phone: formData.telefono,
        email: formData.email,
      },
      product: {
        name: CONFIG.productName,
        quantity: state.quantity,
        unitPrice: CONFIG.unitPrice,
      },
      shipping: {
        cost: CONFIG.shippingCost,
        courier: 'Correos de Costa Rica',
        address: {
          province: formData.provincia,
          canton: formData.canton,
          district: formData.distrito,
          fullAddress: formData.direccion,
        },
      },
      subtotal,
      total,
      paymentMethod: formData.metodoPago,
      comments: formData.comentarios,
    };

    if (formData.metodoPago === 'tilopay') {
      await handleTilopay(orderData);
    } else if (formData.metodoPago === 'sinpe') {
      await handleSinpe(orderData);
    }
  });
}

async function handleTilopay(orderData) {
  const btn = $('#submitBtn');
  const overlay = $('#loadingOverlay');

  // Button loading state
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Procesando pago...';
  btn.classList.add('loading');

  // Track InitiateCheckout
  const eventId = `ic_${orderData.orderId}`;
  metaTrack('InitiateCheckout', {
    content_name: CONFIG.productName,
    value: orderData.total,
    currency: CONFIG.currency,
    num_items: orderData.product.quantity,
  }, { eventID: eventId });

  try {
    const res = await fetch(`${CONFIG.apiBase}/api/tilopay/create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderData, eventId }),
    });

    const data = await res.json();

    if (data.paymentUrl) {
      // Show overlay before redirect
      if (overlay) overlay.hidden = false;

      // Store order for success page
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

      window.location.href = data.paymentUrl;
    } else {
      throw new Error(data.error || 'Error al crear el pago');
    }
  } catch (err) {
    console.error('Tilopay error:', err);
    btn.disabled = false;
    btn.classList.remove('loading');
    updateSubmitButton();
    alert('Error al procesar el pago. Por favor intenta de nuevo.');
  }
}

async function handleSinpe(orderData) {
  const btn = $('#submitBtn');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Procesando orden...';
  btn.classList.add('loading');

  // Track Lead
  const eventId = `lead_${orderData.orderId}`;
  metaTrack('Lead', {
    content_name: CONFIG.productName,
    value: orderData.total,
    currency: CONFIG.currency,
  }, { eventID: eventId });

  try {
    const res = await fetch(`${CONFIG.apiBase}/api/email/send-sinpe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderData, eventId }),
    });

    const data = await res.json();

    if (data.success) {
      // Show success inline
      const orderSection = $('#pedido');
      if (orderSection) {
        orderSection.innerHTML = `
          <div class="container" style="text-align:center; padding: 96px 24px;">
            <div style="border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-lg); padding: 48px; max-width: 600px; margin: 0 auto; background: var(--bg-card);">
              <h2 class="section-headline" style="margin-bottom: 16px;">¡PEDIDO RECIBIDO!</h2>
              <p style="font-size: 1.125rem; color: var(--text-muted); margin-bottom: 24px;">
                Orden <strong>${orderData.orderId}</strong>
              </p>
              <div style="border: 1px solid var(--border); border-radius: 8px; padding: 24px; margin-bottom: 24px; background: var(--bg-alt); text-align: left;">
                <p style="font-weight: 700; margin-bottom: 8px;">DATOS PARA SINPE MÓVIL:</p>
                <p style="font-family: 'DM Sans', sans-serif; font-size: 1.1rem;">Número: <strong>8888-8888</strong></p>
                <p style="font-family: 'DM Sans', sans-serif; font-size: 1.1rem;">Monto: <strong>${formatCRC(orderData.total)}</strong></p>
                <p style="margin-top: 8px; font-size: 0.9rem; color: var(--text-muted);">Nombre: Cardio Costa Rica</p>
              </div>
              <p style="font-size: 0.95rem; color: var(--text-muted);">
                Te enviamos un correo a <strong>${orderData.customer.email}</strong> con los detalles y las instrucciones de pago.
              </p>
            </div>
          </div>
        `;
      }
    } else {
      throw new Error(data.error || 'Error al procesar la orden');
    }
  } catch (err) {
    console.error('SINPE error:', err);
    btn.disabled = false;
    btn.classList.remove('loading');
    updateSubmitButton();
    alert('Error al procesar la orden. Por favor intenta de nuevo.');
  }
}

// ============================================
// SCROLL REVEAL
// ============================================
function initReveal() {
  const elements = $$('.reveal-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger delay for sibling elements
          const siblings = entry.target.parentElement.querySelectorAll('.reveal-up');
          const index = Array.from(siblings).indexOf(entry.target);
          const delay = index * 100;

          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach(el => observer.observe(el));
}

// ============================================
// VIEWCONTENT TRACKING
// ============================================
function initViewContentTracking() {
  const productSection = $('#producto');
  if (!productSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !state.viewedProducts.has('tensiometro')) {
          state.viewedProducts.add('tensiometro');
          metaTrack('ViewContent', {
            content_name: CONFIG.productName,
            content_type: 'product',
            value: CONFIG.unitPrice,
            currency: CONFIG.currency,
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(productSection);
}

// ============================================
// WHATSAPP
// ============================================
function initWhatsApp() {
  const floatBtn = $('#whatsappFloat');
  const footerLink = $('#footerWhatsApp');
  const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent('Hola, me interesa el monitor de presión arterial.')}`;

  if (floatBtn) floatBtn.href = waUrl;
  if (footerLink) footerLink.href = waUrl;
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80; // Nav height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initCart();
  initPaymentMethod();
  initOrderForm();
  initReveal();
  initViewContentTracking();
  initWhatsApp();
  initSmoothScroll();
});
