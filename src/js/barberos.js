// Estado global de la aplicación
const AppState = {
    selectedBarber: null,
    selectedService: null,
    servicePrice: null,
    barbersData: [
        {
            id: 1,
            name: 'Carlos Méndez',
            specialty: 'Especialista en Cortes Clásicos',
            experience: '8 años de experiencia',
            rating: 4.9,
            servicesCount: 0
        },
        {
            id: 2,
            name: 'Diego Rodríguez',
            specialty: 'Especialista en Estilos Modernos',
            experience: '6 años de experiencia',
            rating: 4.8,
            servicesCount: 0
        },
        {
            id: 3,
            name: 'Miguel Torres',
            specialty: 'Especialista en Barbas y Bigotes',
            experience: '10 años de experiencia',
            rating: 4.7,
            servicesCount: 0
        },
        {
            id: 4,
            name: 'Andrés Vela',
            specialty: 'Especialista en Cortes Premium',
            experience: '12 años de experiencia',
            rating: 4.9,
            servicesCount: 0
        }
    ]
};

// Elementos del DOM
const elements = {
    barbersGrid: null,
    selectedBarberDiv: null,
    btnNext: null,
    btnBack: null,
    loadingOverlay: null,
    serviceInfo: null,
    selectedService: null,
    servicePrice: null,
    summaryService: null,
    summaryBarber: null,
    summaryPrice: null,
    noServiceScreen: null,
    mainContainer: null
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    
    // Validar que hay un servicio seleccionado antes de mostrar la página
    if (!validateServiceSelection()) {
        showNoServiceScreen();
        hideLoadingOverlay();
        return;
    }
    
    loadServiceFromURL();
    initializeEventListeners();
    loadBarbersServices();
    hideLoadingOverlay();
});

// Inicializar referencias a elementos del DOM
function initializeElements() {
    elements.barbersGrid = document.getElementById('barbersGrid');
    elements.selectedBarberDiv = document.getElementById('selectedBarber');
    elements.btnNext = document.getElementById('btnNext');
    elements.btnBack = document.getElementById('btnBack');
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.serviceInfo = document.getElementById('serviceInfo');
    elements.selectedService = document.getElementById('selectedService');
    elements.servicePrice = document.getElementById('servicePrice');
    elements.summaryService = document.getElementById('summaryService');
    elements.summaryBarber = document.getElementById('summaryBarber');
    elements.summaryPrice = document.getElementById('summaryPrice');
    elements.noServiceScreen = document.getElementById('noServiceScreen');
    elements.mainContainer = document.getElementById('mainContainer');
}

// Validar que hay un servicio seleccionado
function validateServiceSelection() {
    try {
        // Verificar URL params primero
        const urlParams = new URLSearchParams(window.location.search);
        const serviceParam = urlParams.get('service');
        const priceParam = urlParams.get('price');
        
        if (serviceParam && priceParam && serviceParam.trim() !== '' && priceParam.trim() !== '') {
            return true;
        }
        
        // Verificar localStorage como fallback
        const savedService = localStorage.getItem('selectedService');
        const savedPrice = localStorage.getItem('servicePrice');
        
        if (savedService && savedPrice && savedService.trim() !== '' && savedPrice.trim() !== '') {
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Error validando selección de servicio:', error);
        return false;
    }
}

// Mostrar pantalla de error cuando no hay servicio
function showNoServiceScreen() {
    if (elements.noServiceScreen) {
        elements.noServiceScreen.style.display = 'flex';
    }
    if (elements.mainContainer) {
        elements.mainContainer.style.display = 'none';
    }
}

// Ocultar pantalla de error y mostrar contenido principal
function hideNoServiceScreen() {
    if (elements.noServiceScreen) {
        elements.noServiceScreen.style.display = 'none';
    }
    if (elements.mainContainer) {
        elements.mainContainer.style.display = 'block';
    }
}

// Redirigir a la página de servicios
function redirectToServices() {
    // Limpiar localStorage para evitar estados inconsistentes
    localStorage.removeItem('selectedService');
    localStorage.removeItem('servicePrice');
    localStorage.removeItem('selectedBarber');
    localStorage.removeItem('bookingData');
    
    // Redirigir a servicios (ajustar la ruta según tu estructura)
    window.location.href = 'servicios.html';
}

// Cargar información del servicio desde URL o localStorage
function loadServiceFromURL() {
    try {
        // Intentar obtener datos del servicio desde URL params
        const urlParams = new URLSearchParams(window.location.search);
        const serviceParam = urlParams.get('service');
        const priceParam = urlParams.get('price');
        
        if (serviceParam && priceParam) {
            AppState.selectedService = decodeURIComponent(serviceParam);
            AppState.servicePrice = decodeURIComponent(priceParam);
        } else {
            // Fallback: datos del localStorage
            const savedService = localStorage.getItem('selectedService');
            const savedPrice = localStorage.getItem('servicePrice');
            
            AppState.selectedService = savedService;
            AppState.servicePrice = savedPrice;
        }
        
        // Actualizar la UI
        updateServiceDisplay();
        
    } catch (error) {
        console.error('Error cargando información del servicio:', error);
        // En caso de error, mostrar pantalla de no servicio
        showNoServiceScreen();
    }
}

// Actualizar la visualización del servicio
function updateServiceDisplay() {
    if (elements.selectedService) {
        elements.selectedService.textContent = AppState.selectedService;
    }
    if (elements.servicePrice) {
        elements.servicePrice.textContent = AppState.servicePrice;
    }
}

// Configurar event listeners
function initializeEventListeners() {
    // Event listeners para las tarjetas de barberos
    if (elements.barbersGrid) {
        elements.barbersGrid.addEventListener('click', handleBarberSelection);
    }
    
    // Event listener para el botón "Siguiente"
    if (elements.btnNext) {
        elements.btnNext.addEventListener('click', handleNextButton);
    }
    
    // Event listener para el botón "Atrás"
    if (elements.btnBack) {
        elements.btnBack.addEventListener('click', handleBackButton);
    }
    
    // Event listener para cambios de tamaño de ventana (responsive)
    window.addEventListener('resize', debounce(handleWindowResize, 250));
}

// Manejar selección de barbero
function handleBarberSelection(event) {
    const barberCard = event.target.closest('.barber-card');
    if (!barberCard) return;
    
    const barberId = parseInt(barberCard.dataset.barberId);
    if (!barberId) return;
    
    // Remover selección anterior
    clearBarberSelection();
    
    // Aplicar nueva selección
    barberCard.classList.add('selected');
    AppState.selectedBarber = AppState.barbersData.find(b => b.id === barberId);
    
    // Actualizar UI
    updateSelectionSummary();
    enableNextButton();
    
    // Scroll suave hacia el resumen (en móviles)
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            elements.selectedBarberDiv.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 300);
    }
    
    // Feedback visual y sonoro (si está disponible)
    addSelectionFeedback(barberCard);
}

// Limpiar selección de barbero
function clearBarberSelection() {
    const selectedCards = document.querySelectorAll('.barber-card.selected');
    selectedCards.forEach(card => card.classList.remove('selected'));
    
    AppState.selectedBarber = null;
    hideSelectionSummary();
    disableNextButton();
}

// Actualizar resumen de selección
function updateSelectionSummary() {
    if (!AppState.selectedBarber) return;
    
    if (elements.summaryService) {
        elements.summaryService.textContent = AppState.selectedService;
    }
    if (elements.summaryBarber) {
        elements.summaryBarber.textContent = AppState.selectedBarber.name;
    }
    if (elements.summaryPrice) {
        elements.summaryPrice.textContent = AppState.servicePrice;
    }
    
    showSelectionSummary();
}

// Mostrar resumen de selección
function showSelectionSummary() {
    if (elements.selectedBarberDiv) {
        elements.selectedBarberDiv.style.display = 'block';
    }
}

// Ocultar resumen de selección
function hideSelectionSummary() {
    if (elements.selectedBarberDiv) {
        elements.selectedBarberDiv.style.display = 'none';
    }
}

// Habilitar botón "Siguiente"
function enableNextButton() {
    if (elements.btnNext) {
        elements.btnNext.disabled = false;
    }
}

// Deshabilitar botón "Siguiente"
function disableNextButton() {
    if (elements.btnNext) {
        elements.btnNext.disabled = true;
    }
}

// Manejar click del botón "Siguiente"
function handleNextButton() {
    if (!AppState.selectedBarber) {
        showNotification('Por favor selecciona un barbero', 'warning');
        return;
    }
    
    showLoadingOverlay();
    
    // Guardar datos para la siguiente vista
    saveBookingData();
    
    // Simular navegación (aquí irías a la siguiente página)
    setTimeout(() => {
        // Aquí harías la navegación real, por ejemplo:
        // window.location.href = 'reserva.html';
        console.log('Navegando a la siguiente vista con:', {
            service: AppState.selectedService,
            barber: AppState.selectedBarber,
            price: AppState.servicePrice
        });
        
        showNotification('Funcionalidad de navegación pendiente de implementar', 'info');
        hideLoadingOverlay();
    }, 1500);
}

// Manejar click del botón "Atrás"
function handleBackButton() {
    // Navegar a la página de servicios
    window.location.href = 'servicios.html';
}

// Guardar datos de la reserva
function saveBookingData() {
    const bookingData = {
        service: AppState.selectedService,
        servicePrice: AppState.servicePrice,
        barber: AppState.selectedBarber,
        timestamp: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('bookingData', JSON.stringify(bookingData));
        localStorage.setItem('selectedService', AppState.selectedService);
        localStorage.setItem('servicePrice', AppState.servicePrice);
        localStorage.setItem('selectedBarber', JSON.stringify(AppState.selectedBarber));
    } catch (error) {
        console.error('Error guardando datos de reserva:', error);
    }
}

// Cargar servicios realizados por cada barbero (simulado)
function loadBarbersServices() {
    AppState.barbersData.forEach((barber, index) => {
        const servicesElement = document.getElementById(`services-barber-${barber.id}`);
        if (!servicesElement) return;
        
        // Simular carga con delay escalonado
        setTimeout(() => {
            const randomServices = generateRandomServices();
            barber.servicesCount = randomServices.length;
            displayBarberServices(servicesElement, randomServices);
        }, (index + 1) * 500);
    });
}

// Generar servicios aleatorios para demostración
function generateRandomServices() {
    const allServices = [
        'Cortes Clásicos', 'Cortes Modernos', 'Afeitado', 'Arreglo de Barba',
        'Tratamiento Capilar', 'Corte Degradado', 'Corte Fade', 'Bigote Clásico'
    ];
    
    const count = Math.floor(Math.random() * 4) + 2; // Entre 2 y 5 servicios
    const shuffled = allServices.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Mostrar servicios del barbero
function displayBarberServices(element, services) {
    if (services.length === 0) {
        element.innerHTML = '<span class="no-services">Sin servicios registrados</span>';
        return;
    }
    
    const servicesHTML = services.map(service => 
        `<span class="service-badge">${service}</span>`
    ).join('');
    
    element.innerHTML = servicesHTML + `<div style="margin-top: 8px; font-size: 0.8rem; color: var(--light-gray);">Total: ${services.length} servicios</div>`;
}

// Añadir feedback visual a la selección
function addSelectionFeedback(card) {
    // Efecto de "pulso" en la tarjeta seleccionada
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
        card.style.transform = '';
    }, 150);
    
    // Vibración en dispositivos móviles (si está disponible)
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

// Mostrar overlay de carga
function showLoadingOverlay() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'flex';
    }
}

// Ocultar overlay de carga
function hideLoadingOverlay() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'none';
    }
}

// Mostrar notificaciones al usuario
function showNotification(message, type = 'info') {
    // Implementación simple de notificación
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
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Manejar cambios de tamaño de ventana
function handleWindowResize() {
    // Ajustar layout si es necesario
    if (window.innerWidth <= 768 && AppState.selectedBarber) {
        // En móviles, asegurar que el resumen sea visible
        setTimeout(() => {
            if (elements.selectedBarberDiv && elements.selectedBarberDiv.style.display !== 'none') {
                elements.selectedBarberDiv.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }
        }, 100);
    }
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

// Hacer funciones globales para acceso desde HTML
window.redirectToServices = redirectToServices;

// Exportar funciones para uso externo si es necesario
window.BarberosApp = {
    getSelectedBarber: () => AppState.selectedBarber,
    getSelectedService: () => AppState.selectedService,
    getServicePrice: () => AppState.servicePrice,
    clearSelection: clearBarberSelection,
    showNotification: showNotification,
    validateServiceSelection: validateServiceSelection
};