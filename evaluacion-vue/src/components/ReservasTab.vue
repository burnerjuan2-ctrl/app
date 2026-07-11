<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-gray-900 p-4 rounded-lg border border-gray-800">
      <div>
        <h2 class="text-xl font-bold text-white">Gestion de Reservaciones</h2>
        <p class="text-sm text-gray-400">Cree, consulte y modifique las reservas del hotel</p>
      </div>
      <button 
        v-if="canWrite"
        @click="openCreateModal"
        class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-semibold text-sm transition"
      >
        Nueva Reservacion
      </button>
    </div>

    <!-- Lista de Reservaciones -->
    <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div class="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 class="font-semibold text-white">Listado de Reservas</h3>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por Nombre o Cedula..." 
          class="bg-gray-800 text-white text-sm border border-gray-700 rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-300">
          <thead class="bg-gray-950 text-gray-400 uppercase text-xs">
            <tr>
              <th class="p-4">N Reserva</th>
              <th class="p-4">Huesped</th>
              <th class="p-4">Cedula / ID</th>
              <th class="p-4">Fechas</th>
              <th class="p-4">Tipo Hab.</th>
              <th class="p-4">Garantia</th>
              <th class="p-4">Estado</th>
              <th class="p-4 text-center" v-if="canWrite">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-880">
            <tr v-if="filteredReservations.length === 0">
              <td colspan="8" class="p-8 text-center text-gray-500">No se encontraron reservaciones registradas.</td>
            </tr>
            <tr v-for="res in filteredReservations" :key="res.id" class="hover:bg-gray-800/40">
              <td class="p-4 font-bold text-indigo-400">{{ res.resNumber }}</td>
              <td class="p-4">{{ res.guestName }}</td>
              <td class="p-4">{{ res.guestId }}</td>
              <td class="p-4">
                <span class="block text-xs text-gray-400">Entrada: {{ res.startDate }}</span>
                <span class="block text-xs text-gray-400">Salida: {{ res.endDate }}</span>
              </td>
              <td class="p-4">
                <span class="px-2 py-1 text-xs rounded bg-purple-900/30 text-purple-400 border border-purple-800/50">
                  {{ res.roomType }}
                </span>
              </td>
              <td class="p-4 text-green-400 font-semibold">${{ res.guaranteeAmount }} USD</td>
              <td class="p-4">
                <span 
                  class="px-2 py-1 text-xs rounded font-semibold"
                  :class="{
                    'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50': res.status === 'Creada',
                    'bg-green-900/40 text-green-400 border border-green-800/50': res.status === 'CheckIn',
                    'bg-blue-900/40 text-blue-400 border border-blue-800/50': res.status === 'CheckOut',
                    'bg-red-900/40 text-red-400 border border-red-800/50': res.status === 'Cancelada'
                  }"
                >
                  {{ res.status }}
                </span>
              </td>
              <td class="p-4 text-center space-x-2" v-if="canWrite">
                <button 
                  v-if="res.status === 'Creada'"
                  @click="openEditModal(res)"
                  class="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-2.5 py-1.5 rounded transition border border-gray-700"
                >
                  Modificar
                </button>
                <button 
                  v-if="res.status === 'Creada'"
                  @click="cancelReservation(res.id)"
                  class="bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs px-2.5 py-1.5 rounded transition border border-red-800/50"
                >
                  Cancelar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Formulario -->
    <div v-if="showModal" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full overflow-hidden shadow-2xl">
        <div class="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 class="text-lg font-bold text-white">
            {{ isEditing ? 'Modificar Reservacion' : 'Nueva Reservacion' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <form @submit.prevent="saveReservation" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300">Nombre del Huesped</label>
            <input 
              v-model="form.guestName" 
              type="text" 
              required 
              placeholder="Ej. Maria Rodriguez"
              class="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">Cedula o Pasaporte ID</label>
            <input 
              v-model="form.guestId" 
              type="text" 
              required 
              placeholder="Ej. 001-0000000-0"
              class="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300">Fecha Entrada</label>
              <input 
                v-model="form.startDate" 
                type="date" 
                required 
                :min="today"
                class="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300">Fecha Salida</label>
              <input 
                v-model="form.endDate" 
                type="date" 
                required 
                :min="form.startDate || today"
                class="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300">Tipo de Habitacion</label>
            <select 
              v-model="form.roomType" 
              required 
              class="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="Simple">Simple ($50 USD/Noche)</option>
              <option value="Doble">Doble ($80 USD/Noche)</option>
              <option value="Suite">Suite ($150 USD/Noche)</option>
            </select>
          </div>

          <div>
            <span class="block text-sm font-medium text-gray-300 mb-2">Servicios Adicionales (Adelanto)</span>
            <div class="space-y-2">
              <label class="flex items-center text-sm text-gray-300 cursor-pointer">
                <input v-model="form.services.internet" type="checkbox" class="rounded bg-gray-800 border-gray-700 text-indigo-600 mr-2 focus:ring-0" />
                Internet ilimitado (+$10 USD total)
              </label>
              <label class="flex items-center text-sm text-gray-300 cursor-pointer">
                <input v-model="form.services.breakfast" type="checkbox" class="rounded bg-gray-800 border-gray-700 text-indigo-600 mr-2 focus:ring-0" />
                Desayuno Buffet (+$15 USD por persona/dia)
              </label>
            </div>
          </div>

          <div class="bg-indigo-900/30 border border-indigo-800 p-3 rounded text-sm text-indigo-300">
            <span class="block font-bold">Deposito de Garantia Requerido (100% Hospedaje):</span>
            <span class="text-lg font-black text-green-400">${{ calculatedGuarantee }} USD</span>
            <span class="block text-xs text-gray-400 mt-1">Calculado sobre {{ calculatedNights }} noches. No incluye servicios opcionales.</span>
          </div>

          <div class="flex justify-end space-x-2 pt-2">
            <button 
              type="button" 
              @click="closeModal" 
              class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="saving"
              class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            >
              {{ saving ? 'Guardando...' : 'Guardar Reservacion' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { state } from '../state.js';
import { db } from '../firebase.js';
import { collection, query, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';

const canWrite = computed(() => {
  const role = state.user?.role;
  return role === 'Gerente' || role === 'Recepcion' || role === 'Reservaciones';
});

const reservations = ref([]);
const searchQuery = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const editId = ref(null);
const saving = ref(false);

const today = new Date().toISOString().split('T')[0];

const form = ref({
  guestName: '',
  guestId: '',
  startDate: '',
  endDate: '',
  roomType: 'Simple',
  services: {
    internet: false,
    breakfast: false,
  }
});

const fetchReservations = async () => {
  try {
    const q = query(collection(db, 'reservations'));
    const querySnapshot = await getDocs(q);
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    reservations.value = list.sort((a, b) => b.resNumber.localeCompare(a.resNumber));
  } catch (error) {
    console.error("Error al cargar reservaciones:", error);
  }
};

onMounted(() => {
  fetchReservations();
});

const filteredReservations = computed(() => {
  if (!searchQuery.value.trim()) return reservations.value;
  const q = searchQuery.value.toLowerCase();
  return reservations.value.filter(res => 
    res.guestName.toLowerCase().includes(q) || 
    res.guestId.toLowerCase().includes(q) ||
    res.resNumber.toLowerCase().includes(q)
  );
});

const calculatedNights = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 1;
  const start = new Date(form.value.startDate);
  const end = new Date(form.value.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
});

const calculatedGuarantee = computed(() => {
  let roomPrice = 50;
  if (form.value.roomType === 'Doble') roomPrice = 80;
  if (form.value.roomType === 'Suite') roomPrice = 150;
  return roomPrice * calculatedNights.value;
});

const openCreateModal = () => {
  isEditing.value = false;
  form.value = {
    guestName: '',
    guestId: '',
    startDate: today,
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    roomType: 'Simple',
    services: {
      internet: false,
      breakfast: false,
    }
  };
  showModal.value = true;
};

const openEditModal = (res) => {
  isEditing.value = true;
  editId.value = res.id;
  form.value = {
    guestName: res.guestName,
    guestId: res.guestId,
    startDate: res.startDate,
    endDate: res.endDate,
    roomType: res.roomType,
    services: {
      internet: res.services?.internet || false,
      breakfast: res.services?.breakfast || false,
    }
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveReservation = async () => {
  saving.value = true;
  try {
    if (isEditing.value) {
      const docRef = doc(db, 'reservations', editId.value);
      await updateDoc(docRef, {
        guestName: form.value.guestName,
        guestId: form.value.guestId,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        roomType: form.value.roomType,
        guaranteeAmount: calculatedGuarantee.value,
        services: form.value.services,
      });
    } else {
      const number = 'RES-' + Math.floor(100000 + Math.random() * 900000);
      
      await addDoc(collection(db, 'reservations'), {
        resNumber: number,
        guestName: form.value.guestName,
        guestId: form.value.guestId,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        roomType: form.value.roomType,
        guaranteeAmount: calculatedGuarantee.value,
        services: form.value.services,
        status: 'Creada',
        roomNumber: null,
        consumptions: [],
        createdAt: new Date().toISOString()
      });
    }
    
    closeModal();
    await fetchReservations();
  } catch (error) {
    console.error("Error al guardar reservacion:", error);
    alert("Error al guardar la reservacion.");
  } finally {
    saving.value = false;
  }
};

const cancelReservation = async (id) => {
  if (confirm("Esta seguro que desea cancelar esta reservacion")) {
    try {
      const docRef = doc(db, 'reservations', id);
      await updateDoc(docRef, {
        status: 'Cancelada'
      });
      await fetchReservations();
    } catch (error) {
      console.error("Error al cancelar la reservacion:", error);
    }
  }
};
</script>
