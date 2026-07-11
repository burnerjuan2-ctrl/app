import { reactive } from 'vue';

// Estado reactivo global de la aplicacion para navegacion y sesion
export const state = reactive({
  user: null,           // Guardara la informacion del usuario { uid, email, role, name }
  currentView: 'login', // Vistas principales: 'login', 'register', 'dashboard'
  currentTab: 'reservas', // Pestana activa en el panel de control (dashboard)
});
