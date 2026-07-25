/* ==========================================
   INTERACTIVIDAD Y CONFIGURACIÓN - SÉ TU ENTRENADOR
   ========================================== */

// 1. CONFIGURACIÓN DEL CONTACTO (Modifica esto cuando tengas tu chip nuevo)
const CONFIG = {
  // Ingresar el número de Argentina completo: prefijo de país (54) + móvil (9) + código de área sin el 15 + número
  // Ejemplo para celular de Buenos Aires (11 1234-5678) -> '5491112345678'
  // Mientras no lo tengas, podés dejar este número provisional o tu número actual.
  whatsappNumber: '5491149751619', 
  
  // El mensaje que ya va a aparecer escrito en el chat del cliente
  messageBook: 'Hola, estuve viendo tu sitio web, Sé tu Entrenador, y me interesa comprar el libro "Sé tu propio preparador físico". ¿Cómo podemos coordinar?',
  messageGeneral: '¡Hola! Vi tu web "Sé Tu Entrenador" y quería hacerte una consulta.'
};

// 2. ACTUALIZACIÓN DINÁMICA DE ENLACES DE WHATSAPP
document.addEventListener('DOMContentLoaded', () => {
  // Enlaces para comprar el libro
  const bookLinks = document.querySelectorAll('.wa-book-link');
  const encodedBookMsg = encodeURIComponent(CONFIG.messageBook);
  const bookUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedBookMsg}`;
  
  bookLinks.forEach(link => {
    link.href = bookUrl;
  });

  // Enlaces para consultas generales
  const generalLinks = document.querySelectorAll('.wa-general-link');
  const encodedGeneralMsg = encodeURIComponent(CONFIG.messageGeneral);
  const generalUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedGeneralMsg}`;
  
  generalLinks.forEach(link => {
    link.href = generalUrl;
  });

  // 3. EFECTO DE SCROLL EN EL HEADER
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 4. MENÚ MÓVIL INTERACTIVO
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('nav ul');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      // Toggle de visualización simple para móviles
      if (navMenu.style.display === 'flex') {
        navMenu.style.display = 'none';
      } else {
        navMenu.style.display = 'flex';
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '80px';
        navMenu.style.left = '0';
        navMenu.style.width = '100%';
        navMenu.style.backgroundColor = 'rgba(10, 11, 13, 0.95)';
        navMenu.style.padding = '20px';
        navMenu.style.borderBottom = '1px solid var(--color-glass-border)';
        navMenu.style.gap = '20px';
      }
    });

    // Cerrar menú móvil al hacer clic en un enlace
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 576) {
          navMenu.style.display = 'none';
        }
      });
    });
  }
});
