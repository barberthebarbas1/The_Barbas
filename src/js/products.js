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

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    
    cartCount.textContent = cart.length;
    
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
    
    // Actualizar botón dinámico según contenido del carrito
    updateCheckoutButton();
}

// Añadir al carrito
const addToCartButtons = document.querySelectorAll('.add-to-cart');

addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = button.closest('.product-card');
        const productName = card.querySelector('.product-name').textContent;
        const productCategory = card.querySelector('.product-category').textContent;
        const productPrice = card.querySelector('.product-price').textContent.replace('$', '').trim();
        const productImage = card.querySelector('.product-image img').src;
        const itemType = card.getAttribute('data-item-type') || 'producto'; // 'producto' o 'reserva'
        
        // Verificar si el producto ya existe en el carrito
        const existingItemIndex = cart.findIndex(item => item.name === productName);
        
        if (existingItemIndex !== -1) {
            // Si ya existe, aumentar cantidad
            cart[existingItemIndex].quantity++;
        } else {
            // Si no existe, agregar nuevo con cantidad 1
            cart.push({
                name: productName,
                category: productCategory,
                price: productPrice || '0',
                image: productImage,
                quantity: 1,
                itemType: itemType
            });
        }
        
        updateCartUI();
        
        button.textContent = '✓ Añadido';
        button.style.background = '#4CAF50';
        
        setTimeout(() => {
            button.textContent = 'Añadir';
            button.style.background = '#ffffff';
        }, 2000);
    });
});

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
    
    const whatsappNumber = '573011737645';
    let message = '';
    let total = 0;
    
    // Detectar tipos en el carrito
    const hasProducto = cart.some(item => item.itemType === 'producto');
    const hasReserva = cart.some(item => item.itemType === 'reserva');
    
    // Encabezado según el tipo
    if (hasProducto && hasReserva) {
        // Carrito mixto - separar en dos secciones
        message = '🛒 *NUEVA ORDEN*%0A';
        message += '━━━━━━━━━━━━━━━━━━%0A%0A';
        
        // Sección de productos
        message += '📦 *PRODUCTOS PARA ENVÍO*%0A%0A';
        let contadorProductos = 1;
        cart.filter(item => item.itemType === 'producto').forEach((item) => {
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            message += `${contadorProductos}. ${item.name}%0A`;
            message += `   • Cant: ${item.quantity}%0A`;
            message += `   • Precio: $${price.toFixed(0)}%0A`;
            message += `   • Subtotal: $${itemTotal.toFixed(0)}%0A%0A`;
            contadorProductos++;
        });
        
        message += '━━━━━━━━━━━━━━━━━━%0A';
        message += '📅 *SERVICIOS/RESERVAS*%0A%0A';
        let contadorReservas = 1;
        cart.filter(item => item.itemType === 'reserva').forEach((item) => {
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            message += `${contadorReservas}. ${item.name}%0A`;
            message += `   • Cant: ${item.quantity}%0A`;
            message += `   • Precio: $${price.toFixed(0)}%0A`;
            message += `   • Subtotal: $${itemTotal.toFixed(0)}%0A%0A`;
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
            message += `   • Precio: $${price.toFixed(0)}%0A`;
            message += `   • Subtotal: $${itemTotal.toFixed(0)}%0A%0A`;
        });
        
    } else if (hasReserva) {
        // Solo reservas
        message = '📅 *NUEVA RESERVA*%0A';
        message += '━━━━━━━━━━━━━━━━━━%0A%0A';
        
        cart.forEach((item, index) => {
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;
            message += `${index + 1}. ${item.name}%0A`;
            message += `   • Categoría: ${item.category}%0A`;
            message += `   • Cantidad: ${item.quantity}%0A`;
            message += `   • Precio: $${price.toFixed(0)}%0A`;
            message += `   • Subtotal: $${itemTotal.toFixed(0)}%0A%0A`;
        });
    }
    
    message += '━━━━━━━━━━━━━━━━━━%0A';
    message += `💰 *TOTAL: $${total.toFixed(0)}*%0A%0A`;
    message += '¡Gracias por tu preferencia! 🙌';
    
    return { whatsappNumber, message };
}

// Botón Finalizar - Envía automáticamente según tipo detectado
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        const data = generateWhatsAppMessage();
        if (data) {
            window.open(`https://wa.me/${data.whatsappNumber}?text=${data.message}`, '_blank');
        }
    });
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

}); // Fin del DOMContentLoaded
