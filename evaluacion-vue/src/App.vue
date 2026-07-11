<script setup>
// Importamos el estado compartido
import { state } from './state.js';
import Login from './components/login.vue';
import Register from './components/register.vue';
import Dashboard from './components/dashboard.vue';
</script>

<template>
  <!-- Contenedor principal que renderiza la vista activa segun el estado -->
  <div class="min-h-screen w-full bg-gray-950 text-gray-100 flex flex-col">
    <Login v-if="state.currentView === 'login'" />
    <Register v-else-if="state.currentView === 'register'" />
    <Dashboard v-else-if="state.currentView === 'dashboard'" />
  </div>
</template>

<style>
/* Estilos globales simples */
body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #030712; /* gray-950 */
}
</style>
