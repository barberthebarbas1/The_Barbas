// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {

    

// Filtros de productos
const filterButtons = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card');
let currentCategoryFilter = 'todos';
let currentPriceRanges = [];
let currentSearchTerm = '';

// Función centralizada para aplicar todos los filtros
function applyFilters() {
    productCards.forEach(card => {
        const category = card.querySelector('.product-category').textContent.toLowerCase();
        const priceText = card.querySelector('.product-price').textContent;
        const price = parseFloat(priceText.replace('$', ''));
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productCategory = card.querySelector('.product-category').textContent.toLowerCase();
        
        // Verificar categoría
        const categoryMatch = currentCategoryFilter === 'todos' || category.includes(currentCategoryFilter);
        
        // Verificar precio
        let priceMatch = currentPriceRanges.length === 0;
        currentPriceRanges.forEach(range => {
            if (range === '100+') {
                if (price >= 100) priceMatch = true;
            } else {
                const [min, max] = range.split('-').map(Number);
                if (price >= min && price < max) priceMatch = true;
            }
        });
        
        // Verificar búsqueda
        const searchMatch = currentSearchTerm === '' || 
                           productName.includes(currentSearchTerm) || 
                           productCategory.includes(currentSearchTerm);
        
        // Mostrar solo si cumple TODOS los filtros
        if (categoryMatch && priceMatch && searchMatch) {
            card.classList.remove('hidden');
            card.style.display = 'flex';
        } else {
            card.classList.add('hidden');
            setTimeout(() => {
                if (card.classList.contains('hidden')) {
                    card.style.display = 'none';
                }
            }, 400);
        }
    });
}

// Filtro por categoría
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentCategoryFilter = button.textContent.toLowerCase();
        applyFilters();
    });
});

// Filtro por rango de precio
const priceCheckboxes = document.querySelectorAll('input[name="price-range"]');

priceCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        currentPriceRanges = Array.from(priceCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        applyFilters();
    });
});

// Barra de búsqueda
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value.toLowerCase().trim();
    applyFilters();
});

// Carrito de compras
let cart = [];
// Cargar carrito desde localStorage si existe
try {
    const storedCart = localStorage.getItem('cart');
    cart = storedCart ? JSON.parse(storedCart) : [];
} catch (err) {
    console.warn('No se pudo cargar el carrito desde localStorage:', err);
    cart = [];
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    
    cartCount.textContent = cart.length;
    // Añadir clase de pulso al botón del carrito cuando tenga items
    try {
        const cartBtnEl = document.getElementById('cartButton');
        // debug
        console.debug('updateCartUI -> cart.length=', cart.length, 'cartButtonFound=', !!cartBtnEl);
        if (cartBtnEl) {
            if (cart.length > 0) cartBtnEl.classList.add('cart-has-items');
            else cartBtnEl.classList.remove('cart-has-items');
        }
    } catch (err) {
        console.warn('updateCartUI: error toggling cart-has-items', err);
    }
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart"><p>🛒 Tu carrito está vacío</p></div>';
        totalPrice.textContent = '$0.00';
    } else {
        let total = 0;
        cartItems.innerHTML = cart.map((item, index) => {
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            return `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-category">${item.category}</div>
                        <div class="cart-item-quantity">
                            <button class="qty-btn minus" data-index="${index}">−</button>
                            <span class="qty-number">${item.quantity}</span>
                            <button class="qty-btn plus" data-index="${index}">+</button>
                        </div>
                        <div class="cart-item-footer">
                            <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                            <button class="remove-item" data-index="${index}">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        totalPrice.textContent = `$${total.toFixed(2)}`;
        
        // Agregar eventos a los botones de cantidad
        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                cart[index].quantity++;
                updateCartUI();
            });
        });
        
        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                    updateCartUI();
                }
            });
        });
        
        // Agregar eventos a los botones de eliminar
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                cart.splice(index, 1);
                updateCartUI();
            });
        });
    }
    // Persistir carrito en localStorage
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
        console.warn('No se pudo guardar el carrito en localStorage:', err);
    }
    
    // Actualizar botón dinámico según contenido del carrito
    // ensure checkout button UI is consistent
    try {
        if (typeof updateCheckoutButton === 'function') {
            updateCheckoutButton();
        } else {
            console.warn('updateCheckoutButton not defined when calling from updateCartUI');
        }
    } catch (err) {
        console.warn('Error calling updateCheckoutButton:', err);
    }
}

// Actualiza el estado y el texto del botón de checkout según el carrito
function updateCheckoutButton() {
    try {
        const checkoutBtnEl = document.getElementById('checkoutBtn');
        const btnTextEl = document.getElementById('btnText');
        const btnIconEl = document.getElementById('btnIcon');

        if (!checkoutBtnEl) return;

        if (!cart || cart.length === 0) {
            checkoutBtnEl.disabled = true;
            if (btnTextEl) btnTextEl.textContent = 'Finalizar';
            if (btnIconEl) btnIconEl.textContent = '🛒';
            checkoutBtnEl.style.opacity = '0.9';
        } else {
            checkoutBtnEl.disabled = false;
            const total = cart.reduce((sum, it) => {
                const p = parseFloat(it.price) || 0;
                return sum + p * (it.quantity || 1);
            }, 0);
            if (btnTextEl) btnTextEl.textContent = `Pagar $${total.toFixed(0)}`;
            if (btnIconEl) btnIconEl.textContent = '💸';
            checkoutBtnEl.style.opacity = '1';
        }
    } catch (err) {
        console.warn('updateCheckoutButton error', err);
    }
}

// Añadir al carrito - utilidad reutilizable
function addItemToCart(item, feedbackButton) {
    if (!item || !item.name) return;

    const existingItemIndex = cart.findIndex(ci => ci.name === item.name);
    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 0) + (item.quantity || 1);
    } else {
        cart.push({
            name: item.name,
            category: item.category || '',
            price: item.price || '0',
            image: item.image || '',
            quantity: item.quantity || 1,
            itemType: item.itemType || 'producto'
        });
    }

    updateCartUI();

    // Feedback visual si se pasó el botón
    if (feedbackButton) {
        const originalText = feedbackButton.textContent;
        const originalBg = feedbackButton.style.background;
        feedbackButton.textContent = '✓ Añadido';
        feedbackButton.style.background = '#4CAF50';
        setTimeout(() => {
            feedbackButton.textContent = originalText || 'Añadir';
            feedbackButton.style.background = originalBg || '#ffffff';
        }, 2000);
    }

    // Mostrar notificación flotante breve indicando que se añadió al carrito
    try {
        console.debug('addItemToCart -> mostrar notificacion para:', item.name);
        showFloatingNotification(`${item.name} añadido al carrito`);
        // Si por alguna razón el toast no aparece (conflictos de CSS/DOM), mostrar un fallback
        setTimeout(() => {
            if (!document.querySelector('.floating-notification')) {
                // Fallback visual en esquina superior derecha
                const fb = document.createElement('div');
                fb.className = 'products-fallback-notif';
                fb.textContent = `${item.name} añadido al carrito`;
                Object.assign(fb.style, {
                    position: 'fixed', top: '18px', right: '18px', zIndex: 99999,
                    background: '#111', color: '#fff', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', fontWeight: '700'
                });
                document.body.appendChild(fb);
                setTimeout(() => {
                    if (fb && fb.parentNode) fb.parentNode.removeChild(fb);
                }, 1800);
            }
        }, 80);
    } catch (e) {
        // ignore if function not available
    }
}

// Botón - usar la utilidad anterior
const addToCartButtons = document.querySelectorAll('.add-to-cart');
addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = button.closest('.product-card');
        const productName = card.querySelector('.product-name').textContent;
        const productCategory = card.querySelector('.product-category').textContent;
        const productPrice = card.querySelector('.product-price').textContent.replace('$', '').trim();
        const productImageEl = card.querySelector('.product-image img');
        const productImage = productImageEl ? productImageEl.src : '';
        const itemType = card.getAttribute('data-item-type') || 'producto'; // 'producto' o 'reserva'

        addItemToCart({
            name: productName,
            category: productCategory,
            price: productPrice || '0',
            image: productImage,
            quantity: 1,
            itemType: itemType
        }, button);
    });
});

// Floating notification helper (simple toast)
function showFloatingNotification(text, duration = 2000) {
    try {
        const existing = document.querySelector('.floating-notification');
        if (existing) {
            existing.parentNode.removeChild(existing);
        }
        const el = document.createElement('div');
        // start hidden to allow transition
        el.className = 'floating-notification hide';
        el.textContent = text;
        document.body.appendChild(el);
        console.debug('showFloatingNotification -> appended element, triggering show');
        // Allow the browser to paint, then show (ensures transition runs)
        setTimeout(() => {
            el.classList.remove('hide');
            el.classList.add('show');
        }, 20);
        // hide after duration
        setTimeout(() => {
            el.classList.remove('show');
            el.classList.add('hide');
            setTimeout(() => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
            }, 260);
        }, duration);
    } catch (err) {
        console.warn('showFloatingNotification error', err);
    }
}

// Exponer API pública para que otras páginas (ej. servicios.js) puedan agregar items
window.CartApp = window.CartApp || {};
window.CartApp.addItem = function(item) {
    addItemToCart(item);
};
window.CartApp.getCart = function() {
    return cart;
};

// Abrir/Cerrar carrito
const cartButton = document.getElementById('cartButton');
const cartSidebar = document.getElementById('cartSidebar');
const closeCart = document.getElementById('closeCart');
const cartOverlay = document.getElementById('cartOverlay');

if (cartButton && cartSidebar && cartOverlay) {
    cartButton.addEventListener('click', () => {
        console.log('Botón de carrito clickeado'); // Debug
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
} else {
    console.error('Elementos del carrito no encontrados:', {
        cartButton: !!cartButton,
        cartSidebar: !!cartSidebar,
        cartOverlay: !!cartOverlay
    });
}

if (closeCart) {
    closeCart.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}

if (cartOverlay) {
    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}

// Botón de Finalizar Compra - Enviar a WhatsApp
// Función para generar mensaje de WhatsApp
function generateWhatsAppMessage() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return null;
    }
    
    // Default business number
    let whatsappNumber = '573011737645';
    let message = '';
    let total = 0;
    let totalIncludedInMessage = false;
    
    // Detectar tipos en el carrito
    const hasProducto = cart.some(item => item.itemType === 'producto');
    const hasReserva = cart.some(item => item.itemType === 'reserva');
    
    // Encabezado según el tipo
    if (hasProducto && hasReserva) {
        // Carrito mixto - separar en dos secciones
        message = ' *NUEVA ORDEN*%0A';
        message += '━━━━━━━━━━━━━━━━━━%0A%0A';
        
        // Sección de productos
        message += ' *PRODUCTOS*%0A%0A';
        let contadorProductos = 1;
        cart.filter(item => item.itemType === 'producto').forEach((item) => {
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            message += `${contadorProductos}. ${item.name}%0A`;
            message += `   • Cant: ${item.quantity}%0A`;
            message += `   • Precio: $${price.toFixed(0)}%0A%0A`;
            contadorProductos++;
        });
        
        message += '━━━━━━━━━━━━━━━━━━%0A';
        message += ' *SERVICIOS/RESERVAS*%0A%0A';
        let contadorReservas = 1;
        const reservas = cart.filter(item => item.itemType === 'reserva');
        // Si todas las reservas tienen el mismo barberPhone válido, usar ese número
        const phones = reservas.map(r => r.barberPhone).filter(p => p && p.trim() !== '');
        if (phones.length > 0 && phones.every(p => p === phones[0])) {
            whatsappNumber = phones[0];
        }

        reservas.forEach((item) => {
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            message += `${contadorReservas}. ${item.name}%0A`;
            if (item.barberPhone) {
                message += `   • Barbero: ${item.name.split(' - ').slice(1).join(' - ') || ''}%0A`;
                message += `   • Tel Barbero: ${item.barberPhone}%0A`;
            }
            // omitimos fecha/hora según petición del usuario
            message += `   • Cant: ${item.quantity}%0A`;
            message += `   • Precio: $${price.toFixed(0)}%0A%0A`;
            contadorReservas++;
        });
        
    } else if (hasProducto) {
        // Solo productos
        message = '🛍️ *NUEVO PEDIDO*%0A';
        message += '━━━━━━━━━━━━━━━━━━%0A%0A';
        
        cart.forEach((item, index) => {
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            message += `${index + 1}. ${item.name}%0A`;
            message += `   • Categoría: ${item.category}%0A`;
            message += `   • Cantidad: ${item.quantity}%0A`;
            message += `   • Precio: $${price.toFixed(0)}%0A%0A`;
        });
        
    } else if (hasReserva) {
        // Solo reservas — antes de armar, verificar si vamos a enviar al teléfono del barbero
        const reservasSolo = cart.filter(item => item.itemType === 'reserva');

        // Si todas las reservas comparten un barberPhone válido, construiremos un mensaje limpio PARA EL BARBERO
        const barberPhones = reservasSolo.map(r => r.barberPhone).filter(p => p && p.trim() !== '');
        const singleBarberPhone = barberPhones.length > 0 && barberPhones.every(p => p === barberPhones[0]) ? barberPhones[0] : null;

        if (singleBarberPhone) {
            // Mensaje compacto y relevante para el barbero
            // Incluir: reserva(s) (nombre y tipo), barbero, productos seleccionados (si hay) y total
            message = '📅 *NUEVA RESERVA*%0A';
            message += '━━━━━━━━━━━━━━━━━━%0A%0A';

            // Reservas
            message += '*Reserva(s):*%0A';
            reservasSolo.forEach((item, i) => {
                // item.name puede contener 'Servicio - Barber'
                const serviceName = item.name.split(' - ')[0] || item.name;
                message += `${i + 1}. ${serviceName}%0A`;
                if (item.category) {
                    message += `   • Tipo: ${item.category}%0A`;
                }
                // Si el nombre contiene el barbero, extraerlo
                const barberPart = (item.name.split(' - ').slice(1).join(' - ')).trim();
                if (barberPart) {
                    message += `   • Barbero: ${barberPart}%0A`;
                }
                message += `%0A`;
            });

            // Productos, si hay
            const productos = cart.filter(i => i.itemType === 'producto');
            if (productos.length > 0) {
                message += '━━━━━━━━━━━━━━━━━━%0A';
                message += '*Productos seleccionados:*%0A';
                productos.forEach((p, pi) => {
                    message += `${pi + 1}. ${p.name} (x${p.quantity || 1})%0A`;
                });
                message += `%0A`;
            }

            // Total
            let totalForMessage = 0;
            cart.forEach(ci => {
                const p = parseFloat(ci.price) || 0;
                totalForMessage += p * (ci.quantity || 1);
            });
            message += '━━━━━━━━━━━━━━━━━━%0A';
            message += `*TOTAL: $${totalForMessage.toFixed(0)}*%0A%0A`;

            message += 'Por favor confirma disponibilidad. Gracias.%0A';

            totalIncludedInMessage = true;

            // Usar el teléfono del barbero como destino
            whatsappNumber = singleBarberPhone;
        } else {
            // Si no hay barberPhone único, construir el mensaje general de reservas (igual que antes)
            message = '📅 *NUEVA RESERVA*%0A';
            message += '━━━━━━━━━━━━━━━━━━%0A%0A';
            cart.forEach((item, index) => {
                const price = parseFloat(item.price) || 0;
                const itemTotal = price * item.quantity;
                total += itemTotal;
                message += `${index + 1}. ${item.name}%0A`;
                message += `   • Categoría: ${item.category}%0A`;
                message += `   • Cantidad: ${item.quantity}%0A`;
                message += `   • Precio: $${price.toFixed(0)}%0A%0A`;
            });
        }
    }
    
            // Añadir total aquí solo si no se incluyó antes
            if (!totalIncludedInMessage) {
                message += '━━━━━━━━━━━━━━━━━━%0A';
                message += `💰 *TOTAL: $${total.toFixed(0)}*%0A%0A`;
            }
    // Si hay bookingData con nombre de cliente, anteponerlo al mensaje
    try {
        const bd = JSON.parse(localStorage.getItem('bookingData') || 'null');
        if (bd && bd.clientName) {
            const clientLine = `*CLIENTE:* ${bd.clientName}%0A━━━━━━━━━━━━━━━━━━%0A%0A`;
            message = clientLine + message;
        }
    } catch (err) {
        // ignore
    }

    return { whatsappNumber, message };
}

// Botón Finalizar - Abrir modal para pedir nombre del cliente antes de enviar
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        showClientNameModal((clientName) => {
            try {
                // Guardar bookingData parcial con clientName para que el mensaje la incluya
                let bd = null;
                try { bd = JSON.parse(localStorage.getItem('bookingData') || 'null'); } catch(e){ bd = null; }
                bd = bd && typeof bd === 'object' ? bd : {};
                bd.clientName = clientName || '';
                localStorage.setItem('bookingData', JSON.stringify(bd));
            } catch (err) {
                console.warn('No se pudo guardar bookingData:', err);
            }

            const data = generateWhatsAppMessage();
            if (data) {
                // Abrir WhatsApp en nueva pestaña usando número normalizado
                try {
                    window.open(`https://wa.me/${normalizePhone(data.whatsappNumber)}?text=${data.message}`, '_blank');
                } catch (err) {
                    console.warn('No se pudo abrir WhatsApp:', err);
                }

                // Vaciar carrito localmente para permitir nuevas compras
                try {
                    cart = [];
                    localStorage.removeItem('cart');
                    updateCartUI();
                    // Intentar mostrar notificación si existe la función
                    if (typeof showNotification === 'function') {
                        showNotification('Orden enviada y carrito vaciado', 'info');
                    } else {
                        console.info('Orden enviada y carrito vaciado');
                    }
                } catch (err) {
                    console.warn('Error vaciando el carrito tras checkout:', err);
                }
            }
        });
    });
}

// --- Modal dinámico para pedir el nombre del cliente ---
function showClientNameModal(onConfirm) {
    // Evitar crear más de un modal
    if (document.getElementById('clientNameModal')) return;

    const modal = document.createElement('div');
    modal.id = 'clientNameModal';
    Object.assign(modal.style, {
        position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', zIndex: '2000'
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
        background: '#111', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '420px', boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
    });

    const title = document.createElement('h3');
    title.textContent = 'Nombre del cliente';
    title.style.marginBottom = '10px';
    title.style.color = '#fff';

    const desc = document.createElement('p');
    desc.textContent = 'Por favor ingresa tu nombre para agendar la reserva.';
    desc.style.color = '#ccc';
    desc.style.fontSize = '0.95rem';
    desc.style.marginBottom = '12px';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'clientNameInput';
    input.placeholder = 'Nombre del cliente';
    Object.assign(input.style, { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', marginBottom: '12px' });

    const actions = document.createElement('div');
    Object.assign(actions.style, { display: 'flex', justifyContent: 'flex-end', gap: '8px' });

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancelar';
    Object.assign(btnCancel.style, { padding: '8px 12px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff' });
    btnCancel.onclick = () => { document.body.removeChild(modal); };

    const btnOk = document.createElement('button');
    btnOk.textContent = 'Confirmar';
    Object.assign(btnOk.style, { padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#28a745', color: '#fff' });
    btnOk.onclick = () => {
        const val = input.value.trim();
        if (!val) {
            input.focus();
            return;
        }
        document.body.removeChild(modal);
        if (typeof onConfirm === 'function') onConfirm(val);
    };

    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);

    box.appendChild(title);
    box.appendChild(desc);
    box.appendChild(input);
    box.appendChild(actions);
    modal.appendChild(box);
    document.body.appendChild(modal);

    setTimeout(() => { input.focus(); }, 50);
}

// Helper: normalizar teléfonos para wa.me (quitar caracteres no numéricos)
function normalizePhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^0-9]/g, '');
}

// Al cargar la página, actualizar la UI del carrito desde localStorage
try {
    updateCartUI();
    // Si la URL solicita abrir el carrito, hacerlo
    const params = new URLSearchParams(window.location.search);
    if (params.get('openCart') === '1') {
        setTimeout(() => {
            const cartSidebarEl = document.getElementById('cartSidebar');
            const cartOverlayEl = document.getElementById('cartOverlay');
            if (cartSidebarEl && cartOverlayEl) {
                cartSidebarEl.classList.add('active');
                cartOverlayEl.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }, 150);
    }
} catch (err) {
    console.warn('Error inicializando UI del carrito:', err);
}

// Menú hamburguesa
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Cerrar menú al hacer clic en un enlace
const navItems = document.querySelectorAll('.nav-links a');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    }
});

// Panel lateral de filtros en móvil
const mobileFilterToggle = document.getElementById('mobileFilterToggle');
const filtersSidebar = document.getElementById('filtersSidebar');
const closeFilters = document.getElementById('closeFilters');

if (mobileFilterToggle) {
    mobileFilterToggle.addEventListener('click', () => {
        filtersSidebar.classList.add('active');
        document.body.classList.add('filters-open');
        document.body.style.overflow = 'hidden';
    });
}

if (closeFilters) {
    closeFilters.addEventListener('click', () => {
        filtersSidebar.classList.remove('active');
        document.body.classList.remove('filters-open');
        document.body.style.overflow = '';
    });
}

// Cerrar filtros al hacer clic en el overlay
document.body.addEventListener('click', (e) => {
    if (e.target === document.body && document.body.classList.contains('filters-open')) {
        filtersSidebar.classList.remove('active');
        document.body.classList.remove('filters-open');
        document.body.style.overflow = '';
    }
});

document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BODY' && e.target.classList.contains('filters-open')) {
        filtersSidebar.classList.remove('active');
        document.body.classList.remove('filters-open');
        document.body.style.overflow = '';
    }
});

}); 
