<template>
  <div class="flex-grow flex flex-col md:flex-row min-h-screen bg-gray-950 text-gray-100">
    
    <!-- BARRA LATERAL DE NAVEGACION -->
    <aside class="w-full md:w-64 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col justify-between p-4 shrink-0">
      <div class="space-y-6">
        <!-- Logo y Titulo -->
        <div class="flex items-center space-x-2 px-2">
          <div>
            <h1 class="text-sm font-bold leading-tight text-white tracking-wide uppercase">Hotel INFOTEP</h1>
            <span class="text-[10px] text-gray-400">Sistema de Administracion</span>
          </div>
        </div>

        <!-- Perfil de Usuario Logueado -->
        <div class="bg-gray-950 p-3.5 rounded-lg border border-gray-800 space-y-2">
          <div class="flex items-center space-x-2">
            <div class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
              {{ state.user?.name ? state.user.name[0].toUpperCase() : 'U' }}
            </div>
            <div class="truncate">
              <span class="block text-xs font-bold text-gray-200">{{ state.user?.name }}</span>
              <span class="block text-[10px] text-gray-400 truncate">{{ state.user?.email }}</span>
            </div>
          </div>
          <span class="block text-center text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider" 
            :class="roleBadgeClass">
            Rol: {{ state.user?.role }}
          </span>
        </div>

        <!-- Menu de Pestanas (Solo Reservas, Check-in y Check-out) -->
        <nav class="space-y-1">
          <!-- Reservas -->
          <button 
            v-if="hasAccess('reservas')"
            @click="state.currentTab = 'reservas'"
            class="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-bold transition"
            :class="state.currentTab === 'reservas' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-150'"
          >
            <span>Reservaciones</span>
          </button>

          <!-- Check-in -->
          <button 
            v-if="hasAccess('checkin')"
            @click="state.currentTab = 'checkin'"
            class="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-bold transition"
            :class="state.currentTab === 'checkin' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-150'"
          >
            <span>Check-in (Entrada)</span>
          </button>

          <!-- Check-out -->
          <button 
            v-if="hasAccess('checkout')"
            @click="state.currentTab = 'checkout'"
            class="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-bold transition"
            :class="state.currentTab === 'checkout' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-150'"
          >
            <span>Check-out (Salida)</span>
          </button>
        </nav>
      </div>

      <!-- Boton de Salida -->
      <div class="pt-4 border-t border-gray-800">
        <button 
          @click="handleLogout"
          class="w-full bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-900/30 font-bold py-2 rounded text-xs transition"
        >
          Cerrar Sesion
        </button>
      </div>
    </aside>

    <!-- AREA DE TRABAJO PRINCIPAL -->
    <main class="flex-grow p-6 md:p-8 bg-gray-950 overflow-y-auto">
      <div v-if="loadingSeeding" class="flex flex-col items-center justify-center h-64 space-y-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p class="text-sm text-gray-400">Verificando configuracion inicial de habitaciones en Firebase...</p>
      </div>

      <div v-else>
        <ReservasTab v-if="state.currentTab === 'reservas' && hasAccess('reservas')" />
        <CheckInTab v-else-if="state.currentTab === 'checkin' && hasAccess('checkin')" />
        <CheckOutTab v-else-if="state.currentTab === 'checkout' && hasAccess('checkout')" />
        <div v-else class="bg-gray-900 p-8 rounded-lg border border-gray-800 text-center text-gray-500">
          Seleccione un modulo disponible en el menu lateral o verifique sus permisos de acceso.
        </div>
      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { state } from '../state.js';
import { auth, db } from '../firebase.js';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

import ReservasTab from './ReservasTab.vue';
import CheckInTab from './CheckInTab.vue';
import CheckOutTab from './CheckOutTab.vue';

const loadingSeeding = ref(true);

const roleBadgeClass = computed(() => {
  const role = state.user?.role;
  if (role === 'Gerente') return 'bg-red-900/30 text-red-400 border border-red-800/50';
  if (role === 'Recepción' || role === 'Recepcion') return 'bg-green-900/30 text-green-400 border border-green-800/50';
  if (role === 'Reservaciones') return 'bg-blue-900/30 text-blue-400 border border-blue-800/50';
  return 'bg-gray-800 text-gray-400 border border-gray-700';
});

const hasAccess = (tab) => {
  const role = state.user?.role;
  if (!role) return false;

  if (role === 'Gerente') return true;

  switch (tab) {
    case 'reservas':
      return role === 'Recepción' || role === 'Recepcion' || role === 'Reservaciones';
    case 'checkin':
      return role === 'Recepción' || role === 'Recepcion';
    case 'checkout':
      return role === 'Recepción' || role === 'Recepcion';
    default:
      return false;
  }
};


const seedRoomsIfEmpty = async () => {
  try {
    const q = collection(db, 'rooms');
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log("Habitaciones ya configuradas en Firestore.");
      return;
    }

    console.log("Sembrando base de datos de habitaciones por defecto...");
    const defaultRooms = [
      { id: '101', type: 'Simple', price: 50, status: 'Disponible' },
      { id: '102', type: 'Simple', price: 50, status: 'Disponible' },
      { id: '201', type: 'Doble', price: 80, status: 'Disponible' },
      { id: '202', type: 'Doble', price: 80, status: 'Disponible' },
      { id: '301', type: 'Suite', price: 150, status: 'Disponible' },
      { id: '302', type: 'Suite', price: 150, status: 'Disponible' }
    ];

    const batch = writeBatch(db);
    
    defaultRooms.forEach((room) => {
      const roomRef = doc(db, 'rooms', room.id);
      batch.set(roomRef, {
        type: room.type,
        price: room.price,
        status: room.status,
        currentGuestResId: null,
        currentGuestName: null
      });
    });

    await batch.commit();
    console.log("Habitaciones inicializadas con exito.");
  } catch (error) {
    console.error("Error al sembrar habitaciones:", error);
  }
};

onMounted(async () => {
  await seedRoomsIfEmpty();
  loadingSeeding.value = false;
});

const handleLogout = async () => {
  if (confirm("¿Seguro que desea salir del sistema?")) {
    try {
      await signOut(auth);
      state.user = null;
      state.currentView = 'login';
      state.currentTab = 'reservas';
    } catch (error) {
      console.error("Error al cerrar sesion:", error);
    }
  }
};
</script>
