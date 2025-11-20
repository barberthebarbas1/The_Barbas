// Estado global de la aplicación VIP
const VipState = {
    selectedService: null,
    selectedPrice: null,
    allowMultipleSelection: false
};

// Elementos del DOM
const elements = {
    servicesGrid: null,
    selectedServiceDiv: null,
    btnContinue: null,
    selectedName: null,
    selectedPrice: null
};

// Inicialización de la aplicación VIP
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeEventListeners();
    checkForPreviousSelection();
    addVipEffects();
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
        elements.servicesGrid.addEventListener('click', handleVipServiceSelection);
    }
    
    if (elements.btnContinue) {
        elements.btnContinue.addEventListener('click', handleContinueButton);
    }
    
    window.addEventListener('resize', debounce(handleWindowResize, 250));
}

// Verificar si hay una selección previa
function checkForPreviousSelection() {
    try {
        const savedService = localStorage.getItem('selectedVipService');
        const savedPrice = localStorage.getItem('vipServicePrice');
        
        if (savedService && savedPrice) {
            const serviceCard = document.querySelector(`[data-service="${savedService}"]`);
            if (serviceCard) {
                selectVipServiceCard(serviceCard, savedService, savedPrice);
            }
        }
    } catch (error) {
        console.warn('Error verificando selección VIP previa:', error);
    }
}

// Manejar selección de servicio VIP
function handleVipServiceSelection(event) {
    const serviceCard = event.target.closest('.vip-card');
    if (!serviceCard) {
        return;
    }
    
    const serviceName = serviceCard.dataset.service;
    const servicePrice = serviceCard.dataset.price;
    
    if (!serviceName || !servicePrice) {
        return;
    }
    
    // Si el servicio ya está seleccionado, deseleccionarlo
    if (serviceCard.classList.contains('selected')) {
        deselectVipServiceCard(serviceCard);
    } else {
        // Seleccionar el nuevo servicio
        selectVipServiceCard(serviceCard, serviceName, servicePrice);
    }
}

// Seleccionar tarjeta de servicio VIP
function selectVipServiceCard(serviceCard, serviceName, servicePrice) {
    // Limpiar selección anterior
    clearVipServiceSelection();
    
    // Ocultar otras tarjetas
    hideOtherVipServiceCards(serviceCard);
    
    // Seleccionar la tarjeta actual
    serviceCard.classList.add('selected');
    VipState.selectedService = serviceName;
    VipState.selectedPrice = servicePrice;
    
    // Actualizar UI
    updateVipSelectionSummary();
    enableContinueButton();
    saveVipServiceSelection();
    addVipSelectionFeedback(serviceCard);
    
    // Añadir botón para cambiar selección
    addChangeVipSelectionButton();
    
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            elements.selectedServiceDiv.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 300);
    }
}

// Deseleccionar tarjeta de servicio VIP
function deselectVipServiceCard(serviceCard) {
    serviceCard.classList.remove('selected');
    VipState.selectedService = null;
    VipState.selectedPrice = null;
    
    // Mostrar todas las tarjetas nuevamente
    showAllVipServiceCards();
    
    // Ocultar resumen y deshabilitar botón
    hideSelectionSummary();
    disableContinueButton();
    
    // Remover botón de cambiar selección
    removeChangeVipSelectionButton();
}

// Limpiar selección de servicio VIP
function clearVipServiceSelection() {
    const selectedCards = document.querySelectorAll('.vip-card.selected');
    selectedCards.forEach(card => card.classList.remove('selected'));
    
    VipState.selectedService = null;
    VipState.selectedPrice = null;
    
    showAllVipServiceCards();
    hideSelectionSummary();
    disableContinueButton();
    removeChangeVipSelectionButton();
}

// Ocultar otras tarjetas VIP excepto la seleccionada
function hideOtherVipServiceCards(selectedCard) {
    const allCards = document.querySelectorAll('.vip-card');
    allCards.forEach(card => {
        if (card !== selectedCard) {
            card.style.display = 'none';
        }
    });
    
    // Ajustar el grid
    if (elements.servicesGrid) {
        elements.servicesGrid.style.gridTemplateColumns = '1fr';
        elements.servicesGrid.style.maxWidth = '600px';
        elements.servicesGrid.style.margin = '0 auto';
    }
}

// Mostrar todas las tarjetas VIP
function showAllVipServiceCards() {
    const allCards = document.querySelectorAll('.vip-card');
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

// Agregar botón para cambiar selección VIP
function addChangeVipSelectionButton() {
    if (document.getElementById('changeVipSelectionBtn')) return;
    
    const changeBtn = document.createElement('button');
    changeBtn.id = 'changeVipSelectionBtn';
    changeBtn.className = 'btn btn-secondary change-selection-btn';
    changeBtn.innerHTML = '<i class="fas fa-crown"></i> Cambiar Servicio VIP';
    changeBtn.onclick = () => {
        clearVipServiceSelection();
    };
    
    if (elements.selectedServiceDiv) {
        elements.selectedServiceDiv.parentNode.insertBefore(changeBtn, elements.selectedServiceDiv);
    }
}

// Remover botón de cambiar selección VIP
function removeChangeVipSelectionButton() {
    const changeBtn = document.getElementById('changeVipSelectionBtn');
    if (changeBtn) {
        changeBtn.remove();
    }
}

// Actualizar resumen de selección VIP
function updateVipSelectionSummary() {
    if (!VipState.selectedService) return;
    
    if (elements.selectedName) {
        elements.selectedName.textContent = VipState.selectedService;
    }
    if (elements.selectedPrice) {
        elements.selectedPrice.textContent = VipState.selectedPrice;
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

// Guardar selección de servicio VIP
function saveVipServiceSelection() {
    try {
        localStorage.setItem('selectedVipService', VipState.selectedService);
        localStorage.setItem('vipServicePrice', VipState.selectedPrice);
        localStorage.setItem('selectedService', VipState.selectedService); // Para compatibilidad
        localStorage.setItem('servicePrice', VipState.selectedPrice); // Para compatibilidad
        
        const selectionData = {
            service: VipState.selectedService,
            price: VipState.selectedPrice,
            isVip: true,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('vipServiceSelection', JSON.stringify(selectionData));
    } catch (error) {
        console.error('Error guardando selección VIP:', error);
    }
}

// Manejar click del botón "Continuar"
function handleContinueButton() {
    if (!VipState.selectedService) {
        showVipNotification('Por favor selecciona un servicio VIP', 'warning');
        return;
    }
    
    // Navegar a la página de barberos con parámetros VIP
    const params = new URLSearchParams({
        service: encodeURIComponent(VipState.selectedService),
        price: encodeURIComponent(VipState.selectedPrice),
        vip: 'true'
    });
    
    window.location.href = `barberos.html?${params.toString()}`;
}

// Añadir feedback visual VIP
function addVipSelectionFeedback(card) {
    // Efecto de "pulso" dorado
    card.style.transform = 'scale(0.95)';
    setTimeout(() => {
        card.style.transform = '';
    }, 200);
    
    // Efecto de partículas doradas
    createGoldParticles(card);
    
    // Vibración en dispositivos móviles
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Crear partículas doradas
function createGoldParticles(card) {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: var(--gold-primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            left: ${centerX}px;
            top: ${centerY}px;
            box-shadow: 0 0 10px var(--gold-primary);
        `;
        
        document.body.appendChild(particle);
        
        const angle = (i / 8) * Math.PI * 2;
        const distance = 100;
        const endX = centerX + Math.cos(angle) * distance;
        const endY = centerY + Math.sin(angle) * distance;
        
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        }).onfinish = () => {
            particle.remove();
        };
    }
}

// Efectos VIP adicionales
function addVipEffects() {
    // Efecto de cursor dorado
    document.addEventListener('mousemove', function(e) {
        if (Math.random() < 0.1) { // 10% de probabilidad
            createCursorGoldSparkle(e.clientX, e.clientY);
        }
    });
}

// Crear chispa dorada en el cursor
function createCursorGoldSparkle(x, y) {
    const sparkle = document.createElement('div');
    sparkle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: var(--gold-primary);
        border-radius: 50%;
        pointer-events: none;
        z-index: 999;
        left: ${x}px;
        top: ${y}px;
        box-shadow: 0 0 8px var(--gold-primary);
    `;
    
    document.body.appendChild(sparkle);
    
    sparkle.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0)', opacity: 0 }
    ], {
        duration: 600,
        easing: 'ease-out'
    }).onfinish = () => {
        sparkle.remove();
    };
}

// Función para volver a servicios regulares
function goBackToServices() {
    clearVipServiceSelection();
    showAllVipServiceCards();
    
    // Limpiar localStorage VIP
    localStorage.removeItem('selectedVipService');
    localStorage.removeItem('vipServicePrice');
    localStorage.removeItem('vipServiceSelection');
    
    // Ir a servicios regulares
    window.location.href = 'servicios.html';
}

// Manejar cambios de tamaño de ventana
function handleWindowResize() {
    if (window.innerWidth <= 768 && VipState.selectedService) {
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

// Mostrar notificaciones VIP
function showVipNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} vip-notification`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--gold-primary), var(--gold-accent));
        color: var(--black);
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px var(--gold-glow);
        z-index: 1001;
        font-weight: 600;
        max-width: 300px;
        border: 2px solid var(--gold-light);
        animation: slideInRight 0.4s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
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

// Hacer funciones globales para acceso desde HTML
window.goBackToServices = goBackToServices;

// Exportar funciones para uso externo
window.VipApp = {
    getSelectedService: () => VipState.selectedService,
    getSelectedPrice: () => VipState.selectedPrice,
    clearSelection: clearVipServiceSelection,
    showNotification: showVipNotification
};