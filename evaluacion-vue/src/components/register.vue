<template>
  <div class="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-950">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-white">
        Registro de Personal
      </h2>
      <p class="mt-2 text-center text-sm text-gray-400">
        Registre nuevos colaboradores para el hotel
      </p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-md bg-gray-900 p-8 rounded-lg shadow-xl border border-gray-800">
      <form class="space-y-6" @submit.prevent="handleRegister">
        <!-- Nombre Completo -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-200">Nombre Completo</label>
          <div class="mt-2">
            <input 
              type="text" 
              id="name" 
              v-model="name" 
              required 
              placeholder="Juan Perez"
              class="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <!-- Correo Electronico -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-200">Correo Electronico</label>
          <div class="mt-2">
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              required 
              placeholder="ejemplo@hotel.com"
              class="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <!-- Contrasena -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-200">Contrasena</label>
          <div class="mt-2">
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              required 
              placeholder="Minimo 6 caracteres"
              class="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <!-- Seleccion de Rol -->
        <div>
          <label for="role" class="block text-sm font-medium text-gray-200">Rol del Sistema</label>
          <div class="mt-2">
            <select 
              id="role" 
              v-model="role" 
              required 
              class="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="Gerente">Gerente</option>
              <option value="Recepcion">Recepcion</option>
              <option value="Reservaciones">Reservaciones</option>
            </select>
          </div>
        </div>

        <!-- Mensajes de Estado -->
        <div v-if="errorMessage" class="text-red-400 text-sm bg-red-900/30 border border-red-800 p-3 rounded">
           {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="text-green-400 text-sm bg-green-900/30 border border-green-800 p-3 rounded">
          {{ successMessage }}
        </div>

        <!-- Boton de Registro -->
        <div>
          <button 
            type="submit" 
            :disabled="loading"
            class="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
          >
            {{ loading ? 'Registrando...' : 'Registrar Colaborador' }}
          </button>
        </div>
      </form>

      <!-- Regresar al login -->
      <p class="mt-8 text-center text-sm text-gray-400">
        Ya tiene una cuenta de personal?
        <button 
          @click="goToLogin" 
          class="font-semibold text-indigo-400 hover:text-indigo-300 underline bg-transparent border-none cursor-pointer"
        >
          Iniciar sesion aqui
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state } from '../state.js';
import { auth, db } from '../firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const name = ref('');
const email = ref('');
const password = ref('');
const role = ref('Recepcion');
const errorMessage = ref('');
const successMessage = ref('');
const loading = ref(false);

// Navegar de vuelta al login
const goToLogin = () => {
  state.currentView = 'login';
};

const handleRegister = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;

  try {
    // 1. Crear el usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;

    // 2. Guardar los datos del usuario y su rol en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: name.value,
      email: email.value,
      role: role.value,
      createdAt: new Date().toISOString()
    });

    successMessage.value = 'Usuario registrado con exito en Firebase!';
    
    // Limpiar campos
    name.value = '';
    email.value = '';
    password.value = '';
    
    // Regresar al login despues de un momento
    setTimeout(() => {
      state.currentView = 'login';
    }, 1500);

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    if (error.code === 'auth/email-already-in-use') {
      errorMessage.value = 'Este correo electronico ya esta registrado.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage.value = 'La contrasena debe tener al menos 6 caracteres.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage.value = 'El formato del correo electronico no es valido.';
    } else {
      errorMessage.value = 'Error al registrar: ' + error.message;
    }
  } finally {
    loading.value = false;
  }
};
</script>
