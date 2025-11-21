// Estado global de la aplicación de servicios
const ServicesState = {
    selectedService: null,
    selectedPrice: null,
    allowMultipleSelection: false // Solo una selección a la vez
};

// Elementos del DOM
const elements = {
    servicesGrid: null,
    selectedServiceDiv: null,
    btnContinue: null,
    selectedName: null,
    selectedPrice: null
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeEventListeners();
    checkForPreviousSelection();
});

// Inicializar referencias a elementos del DOM
function initializeElements() {
    elements.servicesGrid = document.querySelector('.services-grid');
    elements.selectedServiceDiv = document.getElementById('selectedService');
    elements.btnContinue = document.getElementById('btnContinue');
    elements.selectedName = document.getElementById('selectedName');
    elements.selectedPrice = document.getElementById('selectedPrice');

    
}

// Configurar event listeners
function initializeEventListeners() {
    if (elements.servicesGrid) {
        elements.servicesGrid.addEventListener('click', handleServiceSelection);
    }
    
    if (elements.btnContinue) {
        elements.btnContinue.addEventListener('click', handleContinueButton);
    }
    
    window.addEventListener('resize', debounce(handleWindowResize, 250));
}

// Verificar si hay una selección previa
function checkForPreviousSelection() {
    try {
        const savedService = localStorage.getItem('selectedService');
        const savedPrice = localStorage.getItem('servicePrice');
        
        if (savedService && savedPrice) {
            const serviceCard = document.querySelector(`[data-service="${savedService}"]`);
            if (serviceCard && !serviceCard.classList.contains('disabled')) {
                selectServiceCard(serviceCard, savedService, savedPrice);
            }
        }
    } catch (error) {
        console.warn('Error verificando selección previa:', error);
    }
}

// Manejar selección de servicio
function handleServiceSelection(event) {
    const serviceCard = event.target.closest('.service-card');
    if (!serviceCard || serviceCard.classList.contains('disabled')) {
        return;
    }
    
    const serviceName = serviceCard.dataset.service;
    const servicePrice = serviceCard.dataset.price;
    
    if (!serviceName || !servicePrice) {
        return;
    }
    
    // Si el servicio ya está seleccionado, deseleccionarlo
    if (serviceCard.classList.contains('selected')) {
        deselectServiceCard(serviceCard);
    } else {
        // Seleccionar el nuevo servicio (esto automáticamente deselecciona el anterior)
        selectServiceCard(serviceCard, serviceName, servicePrice);
    }
}

// Seleccionar tarjeta de servicio
function selectServiceCard(serviceCard, serviceName, servicePrice) {
    // Limpiar selección anterior
    clearServiceSelection();
    
    // Ocultar todas las demás tarjetas
    hideOtherServiceCards(serviceCard);
    
    // Seleccionar la tarjeta actual
    serviceCard.classList.add('selected');
    ServicesState.selectedService = serviceName;
    ServicesState.selectedPrice = servicePrice;
    
    // Actualizar UI
    updateSelectionSummary();
    enableContinueButton();
    saveServiceSelection();
    addSelectionFeedback(serviceCard);
    
    // Añadir botón para cambiar selección
    addChangeSelectionButton();
    
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            elements.selectedServiceDiv.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 300);
    }
}

// Deseleccionar tarjeta de servicio específica
function deselectServiceCard(serviceCard) {
    serviceCard.classList.remove('selected');
    ServicesState.selectedService = null;
    ServicesState.selectedPrice = null;
    
    // Mostrar todas las tarjetas nuevamente
    showAllServiceCards();
    
    // Ocultar resumen y deshabilitar botón
    hideSelectionSummary();
    disableContinueButton();
    
    // Remover botón de cambiar selección
    removeChangeSelectionButton();
}

// Limpiar selección de servicio
function clearServiceSelection() {
    const selectedCards = document.querySelectorAll('.service-card.selected');
    selectedCards.forEach(card => card.classList.remove('selected'));
    
    ServicesState.selectedService = null;
    ServicesState.selectedPrice = null;
    
    // Mostrar todas las tarjetas
    showAllServiceCards();
    
    hideSelectionSummary();
    disableContinueButton();
    removeChangeSelectionButton();
}

// Actualizar resumen de selección
function updateSelectionSummary() {
    if (!ServicesState.selectedService) return;
    
    if (elements.selectedName) {
        elements.selectedName.textContent = ServicesState.selectedService;
    }
    if (elements.selectedPrice) {
        elements.selectedPrice.textContent = ServicesState.selectedPrice;
    }
    
    showSelectionSummary();
}

// Mostrar resumen de selección
function showSelectionSummary() {
    if (elements.selectedServiceDiv) {
        elements.selectedServiceDiv.style.display = 'block';
    }
}

// Ocultar resumen de selección
function hideSelectionSummary() {
    if (elements.selectedServiceDiv) {
        elements.selectedServiceDiv.style.display = 'none';
    }
}

// Habilitar botón "Continuar"
function enableContinueButton() {
    if (elements.btnContinue) {
        elements.btnContinue.disabled = false;
    }
}

// Deshabilitar botón "Continuar"
function disableContinueButton() {
    if (elements.btnContinue) {
        elements.btnContinue.disabled = true;
    }
}

// Guardar selección de servicio
function saveServiceSelection() {
    try {
        localStorage.setItem('selectedService', ServicesState.selectedService);
        localStorage.setItem('servicePrice', ServicesState.selectedPrice);
        
        const selectionData = {
            service: ServicesState.selectedService,
            price: ServicesState.selectedPrice,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('serviceSelection', JSON.stringify(selectionData));
    } catch (error) {
        console.error('Error guardando selección de servicio:', error);
    }
}

// Manejar click del botón "Continuar"
function handleContinueButton() {
    if (!ServicesState.selectedService) {
        showNotification('Por favor selecciona un servicio', 'warning');
        return;
    }
    const params = new URLSearchParams({
        service: encodeURIComponent(ServicesState.selectedService),
        price: encodeURIComponent(ServicesState.selectedPrice)
    });

    window.location.href = `barberos.html?${params.toString()}`;
}

// Construir objeto de reserva y añadir al carrito
function addReservationToCart() {
    const name = ServicesState.selectedService;
    const price = ServicesState.selectedPrice || '0';

    // Intentar obtener imagen y categoría desde la tarjeta seleccionada usando búsqueda robusta
    let image = '';
    let category = 'Servicio';
    try {
        const allCards = document.querySelectorAll('.service-card');
        for (const card of allCards) {
            // dataset.service puede contener espacios, comparar directamente
            if (card.dataset && card.dataset.service === name) {
                const imgEl = card.querySelector('img');
                if (imgEl) image = imgEl.src || '';
                const catEl = card.querySelector('.service-category');
                if (catEl) category = catEl.textContent || category;
                break;
            }
        }
    } catch (err) {
        console.warn('Error buscando imagen/categoría de la tarjeta de servicio:', err);
    }

    const item = {
        name: name,
        category: category,
        price: price,
        image: image,
        quantity: 1,
        itemType: 'reserva'
    };

    // Si la API global de carrito existe, usarla
    if (window.CartApp && typeof window.CartApp.addItem === 'function') {
        try {
            window.CartApp.addItem(item);
            console.log('addReservationToCart: agregado vía CartApp', item);
            showNotification('Reserva añadida al carrito', 'info');
            return;
        } catch (err) {
            console.warn('CartApp.addItem falló:', err);
        }
    }

    // Fallback: persistir en localStorage siguiendo misma estructura
    try {
        const stored = localStorage.getItem('cart');
        const localCart = stored ? JSON.parse(stored) : [];
        const existingIndex = localCart.findIndex(ci => ci.name === item.name && ci.itemType === 'reserva');
        if (existingIndex !== -1) {
            localCart[existingIndex].quantity = (localCart[existingIndex].quantity || 0) + 1;
        } else {
            localCart.push(item);
        }
        localStorage.setItem('cart', JSON.stringify(localCart));
        console.log('addReservationToCart: agregado vía localStorage', item);
        showNotification('Reserva añadida al carrito', 'info');
    } catch (err) {
        console.warn('No se pudo guardar la reserva en localStorage:', err);
    }
    }


// Añadir feedback visual a la selección
function addSelectionFeedback(card) {
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
        card.style.transform = '';
    }, 150);
    
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

// Ocultar otras tarjetas de servicio excepto la seleccionada
function hideOtherServiceCards(selectedCard) {
    const allCards = document.querySelectorAll('.service-card');
    allCards.forEach(card => {
        if (card !== selectedCard) {
            card.style.display = 'none';
        }
    });
    
    // Ajustar el grid a una sola columna
    if (elements.servicesGrid) {
        elements.servicesGrid.style.gridTemplateColumns = '1fr';
        elements.servicesGrid.style.maxWidth = '500px';
        elements.servicesGrid.style.margin = '0 auto';
    }
}

// Mostrar todas las tarjetas de servicio
function showAllServiceCards() {
    const allCards = document.querySelectorAll('.service-card');
    allCards.forEach(card => {
        card.style.display = 'block';
    });
    
    // Restaurar el grid original
    if (elements.servicesGrid) {
        elements.servicesGrid.style.gridTemplateColumns = '';
        elements.servicesGrid.style.maxWidth = '';
        elements.servicesGrid.style.margin = '';
    }
}

// Agregar botón para cambiar selección
function addChangeSelectionButton() {
    // Verificar si ya existe
    if (document.getElementById('changeSelectionBtn')) return;
    
    const changeBtn = document.createElement('button');
    changeBtn.id = 'changeSelectionBtn';
    changeBtn.className = 'btn btn-secondary change-selection-btn';
    changeBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Cambiar Servicio';
    changeBtn.onclick = () => {
        clearServiceSelection();
    };
    
    // Insertarlo antes del resumen de selección
    if (elements.selectedServiceDiv) {
        elements.selectedServiceDiv.parentNode.insertBefore(changeBtn, elements.selectedServiceDiv);
    }
}

// Remover botón de cambiar selección
function removeChangeSelectionButton() {
    const changeBtn = document.getElementById('changeSelectionBtn');
    if (changeBtn) {
        changeBtn.remove();
    }
}

// Manejar cambios de tamaño de ventana
function handleWindowResize() {
    if (window.innerWidth <= 768 && ServicesState.selectedService) {
        setTimeout(() => {
            if (elements.selectedServiceDiv && elements.selectedServiceDiv.style.display !== 'none') {
                elements.selectedServiceDiv.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }
        }, 100);
    }
}

// Función para ir atrás (global para HTML)
function goBack() {
    // Limpiar selección y mostrar todas las tarjetas
    clearServiceSelection();
    showAllServiceCards();
    
    // Limpiar localStorage
    localStorage.removeItem('selectedService');
    localStorage.removeItem('servicePrice');
    localStorage.removeItem('serviceSelection');
    
    // Redirigir al index
    window.location.href = '../index.html';
}

// Mostrar notificaciones al usuario
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'warning' ? '#f39c12' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1001;
        font-weight: 500;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Agregar estilos CSS para las animaciones de notificación
if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styles);
}

// Función para ir a servicios VIP
function goToVipServices() {
    // Limpiar selección actual de servicios regulares
    clearServiceSelection();
    showAllServiceCards();
    
    // Navegar a la página VIP
    window.location.href = 'vip.html';
}

// Hacer funciones globales para acceso desde HTML
window.goBack = goBack;
window.goToVipServices = goToVipServices;

// Exportar funciones para uso externo si es necesario
window.ServicesApp = {
    getSelectedService: () => ServicesState.selectedService,
    getSelectedPrice: () => ServicesState.selectedPrice,
    clearSelection: clearServiceSelection,
    showNotification: showNotification
};