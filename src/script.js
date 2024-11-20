// Constantes para valores reutilizables
const TIEMPO_ELIMINACION = 24 * 60 * 60 * 1000;
const INTERVALOS_NOTIFICACION = {
  '5min': 5 * 60 * 1000,
  '10min': 10 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000
};
const COLORES = {
  COMPLETADO: 'green',
  NORMAL: 'black'
};
const NOTIFICATION_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// Elementos del DOM
const elementos = {
  input: document.getElementById('nuevaTarea'),
  boton: document.getElementById('agregarTarea'),
  lista: document.getElementById('listaTareas')
};

// Función para crear el checkbox
function crearCheckboxCompletado(contenedor) {
  const checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.classList.add('completada');
  
  // Agregar id y name únicos
  const id = `tarea-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`; // Crear un ID único
  checkbox.id = id;
  checkbox.name = id;
  
  checkbox.addEventListener('click', () => manejarCompletado(checkbox, contenedor));
  
  return checkbox;
}

// Función para manejar el completado de tareas
function manejarCompletado(checkbox, contenedor) {
  if (checkbox.checked) {
    contenedor.classList.add('completada');
  } else {
    contenedor.classList.remove('completada');
  }
  actualizarAlmacenamientoLocal();
}
// Función para crear el botón de eliminar
function crearBotonEliminar(contenedor) {
  const boton = document.createElement('button');
  boton.textContent = 'Eliminar';
  boton.classList.add('eliminar');
  
  boton.addEventListener('click', () => {
    elementos.lista.removeChild(contenedor);
    actualizarAlmacenamientoLocal();
  });
  
  return boton;
}

// Función para crear una nueva tarea
function crearTarea(texto) {
  const contenedor = document.createElement('div');
  contenedor.classList.add('tarea'); 
  const tareaElement = document.createElement('li');
  tareaElement.textContent = texto;

  //Crear checkbox y boton de eliminar
  const checkbox = crearCheckboxCompletado(contenedor);
  const botonEliminar = crearBotonEliminar(contenedor);
  
  //Agregar checkbox y boton de eliminar a la tarea
  contenedor.appendChild(tareaElement);
  contenedor.appendChild(checkbox);
  contenedor.appendChild(botonEliminar);
  
  return contenedor;
}

// Función para guardar en localStorage
function actualizarAlmacenamientoLocal() {
  const tareas = Array.from(elementos.lista.children).map(contenedor => ({
    texto: contenedor.querySelector('li').textContent,
    completada: contenedor.querySelector('.completada').checked
  }));
  
  localStorage.setItem('tareas', JSON.stringify(tareas));
}

// Función para cargar tareas guardadas
function cargarTareasGuardadas() {
  const tareasGuardadas = JSON.parse(localStorage.getItem('tareas')) || [];
  
  tareasGuardadas.forEach(tarea => {
    const contenedor = crearTarea(tarea.texto);
    const checkbox = contenedor.querySelector('.completada');
    
    if (tarea.completada) {
      checkbox.checked = true;
      contenedor.classList.add('completada');
    }
    
    elementos.lista.appendChild(contenedor);
  });
}

// Función para registrar el Service Worker
async function registrarServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('../sw.js');
      console.log('Service Worker registrado correctamente:', registration);
      return registration;
    }
    console.log('Service Worker no soportado');
    return null;
  } catch (error) {
    console.error('Error al registrar Service Worker:', error);
    return null;
  }
}

// Función para reproducir sonido
async function reproducirSonido() {
  try {
    NOTIFICATION_SOUND.volume = 1.0;
    await NOTIFICATION_SOUND.play();
    console.log('Sonido reproducido correctamente');
  } catch (error) {
    console.error('Error al reproducir sonido:', error);
  }
}

// Función actualizada para mostrar notificación
async function mostrarNotificacion(titulo, mensaje) {
  try {
    if (Notification.permission !== 'granted') {
      console.warn('Permisos de notificación no concedidos');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    
    const options = {
      body: mensaje,
      icon: 'https://cdn.icon-icons.com/icons2/2063/PNG/512/add_new_create_notification_bell_icon_124695.png',
      badge: 'https://cdn.icon-icons.com/icons2/2063/PNG/512/add_new_create_notification_bell_icon_124695.png',
      vibrate: [200, 100, 200],
      sound: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // URL del sonido
      tag: 'recordatorio-tareas',
      renotify: true,
      requireInteraction: true,
      silent: false
    };

    await registration.showNotification(titulo, options);
    console.log('Notificación enviada');
    return true;

  } catch (error) {
    console.error('Error al mostrar notificación:', error);
    return false;
  }
}
// Función actualizada para configurar notificaciones
async function configurarNotificaciones() {
  try {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones de escritorio');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      alert('Tu navegador no soporta Service Workers');
      return false;
    }

    // Registrar Service Worker
    await registrarServiceWorker();

    const permission = await Notification.requestPermission();
    
    switch (permission) {
      case 'granted':
        iniciarRecordatorios();
        return true;
      case 'denied':
        alert('Has denegado los permisos de notificación. Por favor, habilítalos en la configuración de tu navegador.');
        return false;
      default:
        alert('No se pudo obtener permiso para las notificaciones');
        return false;
    }
  } catch (error) {
    console.error('Error al configurar notificaciones:', error);
    alert('Ocurrió un error al configurar las notificaciones');
    return false;
  }
}

// Función para crear el selector de intervalo
function crearSelectorIntervalo() {
  const selectorContainer = document.createElement('div');
  selectorContainer.className = 'selector-intervalo';
  
  const label = document.createElement('label');
  label.textContent = 'Intervalo de notificaciones:';
  label.htmlFor = 'intervalo-notificacion';
  
  const select = document.createElement('select');
  select.id = 'intervalo-notificacion';
  
  Object.entries(INTERVALOS_NOTIFICACION).forEach(([label, value]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
  
  // Recuperar intervalo guardado
  const intervaloGuardado = localStorage.getItem('intervaloNotificacion');
  if (intervaloGuardado) {
    select.value = intervaloGuardado;
  }
  
  select.addEventListener('change', () => {
    localStorage.setItem('intervaloNotificacion', select.value);
    reiniciarNotificaciones();
  });
  
  selectorContainer.appendChild(label);
  selectorContainer.appendChild(select);
  
  return selectorContainer;
}

// Función para reiniciar las notificaciones
function reiniciarNotificaciones() {
  if (window.notificacionInterval) {
    clearInterval(window.notificacionInterval);
  }
  iniciarRecordatorios();
}

// Función actualizada para iniciar recordatorios
function iniciarRecordatorios() {
  console.log('Iniciando sistema de recordatorios...');
  
  const intervalo = parseInt(localStorage.getItem('intervaloNotificacion')) || INTERVALOS_NOTIFICACION['30min'];
  
  // Mostrar notificación inicial
  mostrarNotificacion(
    'Sistema Activado',
    `Las notificaciones se mostrarán cada ${intervalo / (60 * 1000)} minutos`
  );

  // Configurar intervalo para notificaciones periódicas
  window.notificacionInterval = setInterval(async () => {
    const tareasPendientes = Array.from(elementos.lista.children).filter(
      contenedor => !contenedor.querySelector('.completada').checked
    );
    
    if (tareasPendientes.length > 0) {
      const mensaje = `Tienes ${tareasPendientes.length} ${
        tareasPendientes.length === 1 ? 'tarea pendiente' : 'tareas pendientes'
      }`;
      
      await mostrarNotificacion('Recordatorio de Tareas', mensaje);
    }
  }, intervalo);
}

// Función para probar notificaciones
async function probarNotificacion() {
  console.log('Probando notificación...');
  const resultado = await mostrarNotificacion(
    'Prueba de Notificación',
    'Esta es una notificación de prueba con sonido'
  );
  
  if (!resultado) {
    alert('Error al mostrar la notificación. Verifica los permisos del navegador.');
  }
}

// Event listener principal
document.getElementById('formTareas').addEventListener('submit', (event) => {
  event.preventDefault();
  const texto = elementos.input.value.trim();
  
  if (texto !== '') {
    const contenedor = crearTarea(texto);
    elementos.lista.appendChild(contenedor);
    elementos.input.value = '';
    actualizarAlmacenamientoLocal();
  }
});

//Event listener para al presionar enter
elementos.input.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    elementos.boton.click();
  }
});

// Actualizar el DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  cargarTareasGuardadas();
  
  const container = document.querySelector('.container');
  
  // Botón para activar notificaciones
  const botonNotificaciones = document.createElement('button');
  botonNotificaciones.textContent = '🔔 Activar Notificaciones';
  botonNotificaciones.onclick = configurarNotificaciones;
  
  // Agregar selector de intervalo
  const selectorIntervalo = crearSelectorIntervalo();
  
  // Contenedor para los controles de notificación
  const notificacionesContainer = document.createElement('div');
  notificacionesContainer.className = 'notificaciones-container';
  notificacionesContainer.appendChild(botonNotificaciones);
  notificacionesContainer.appendChild(selectorIntervalo);
  
  container.appendChild(notificacionesContainer);
  
  // Registrar Service Worker
  await registrarServiceWorker();
});

