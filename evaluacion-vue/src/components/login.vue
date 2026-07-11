<template>
  <div class="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-950">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-white">
        Sistema Hotelero INFOTEP
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Inicie sesion para acceder a los modulos de gestion
      </p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-md bg-gray-900 p-8 rounded-lg shadow-xl border border-gray-800">
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-200">Correo Electronico</label>
          <div class="mt-2">
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              autocomplete="email" 
              required 
              placeholder="ejemplo@hotel.com"
              class="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-200">Contrasena</label>
          <div class="mt-2">
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              autocomplete="current-password" 
              required 
              placeholder="password"
              class="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <!-- Mensajes de error o exito -->
        <div v-if="errorMessage" class="text-red-400 text-sm bg-red-900/30 border border-red-800 p-3 rounded">
          Error: {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="text-green-400 text-sm bg-green-900/30 border border-green-800 p-3 rounded">
          Exito: {{ successMessage }}
        </div>

        <div>
          <button 
            type="submit" 
            :disabled="loading"
            class="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
          >
            {{ loading ? 'Iniciando sesion...' : 'Ingresar al Sistema' }}
          </button>
        </div>
      </form>

      <p class="mt-8 text-center text-sm text-gray-400">
        No tiene una cuenta?
        <button 
          @click="goToRegister" 
          class="font-semibold text-indigo-400 hover:text-indigo-300 underline bg-transparent border-none cursor-pointer"
        >
          Registrarse aqui
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state } from '../state.js';
import { auth, db } from '../firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const loading = ref(false);

const goToRegister = () => {
  state.currentView = 'register';
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      
      state.user = {
        uid: user.uid,
        email: user.email,
        name: userData.name || 'Usuario',
        role: userData.role || 'Recepcion',
      };
      
      successMessage.value = 'Acceso concedido';
      
      setTimeout(() => {
        state.currentView = 'dashboard';
        if (state.user.role === 'Reservaciones') state.currentTab = 'reservas';
        else state.currentTab = 'reservas';
      }, 1000);
      
    } else {
      errorMessage.value = 'El perfil del usuario no fue encontrado en Firestore.';
    }
  } catch (error) {
    console.error('Error al iniciar sesion:', error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      errorMessage.value = 'Credenciales incorrectas. Verifique su correo y contrasena.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage.value = 'El formato del correo electronico no es valido.';
    } else {
      errorMessage.value = 'Error al ingresar: ' + error.message;
    }
  } finally {
    loading.value = false;
  }
};
</script>
