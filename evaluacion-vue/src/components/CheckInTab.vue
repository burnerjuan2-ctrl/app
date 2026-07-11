<template>
  <div class="space-y-6">
    <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
      <h2 class="text-xl font-bold text-white">Registro de Entrada (Check-in)</h2>
      <p class="text-sm text-gray-400">Formalice el ingreso del huesped asignandole una habitacion y registrando la garantia.</p>
    </div>

    <!-- Buscador de Reserva -->
    <div class="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-4">
      <h3 class="text-lg font-semibold text-white">Buscar Reservacion</h3>
      <div class="flex gap-4">
        <input 
          v-model="resSearchQuery" 
          type="text" 
          placeholder="Codigo de Reserva (Ej. RES-123456)..." 
          class="flex-1 bg-gray-800 text-white text-sm border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
        />
        <button 
          @click="searchReservation" 
          class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-semibold text-sm transition"
        >
          Buscar Reserva
        </button>
      </div>
      <div v-if="searchError" class="text-red-400 text-sm mt-1">
        Error: {{ searchError }}
      </div>
    </div>

    <!-- Detalles del Check-in -->
    <div v-if="selectedRes" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Informacion General -->
      <div class="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-4">
        <h3 class="text-lg font-semibold text-white border-b border-gray-800 pb-2">Informacion de Estadia</h3>
        
        <div class="grid grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <span class="block text-xs text-gray-500 font-semibold uppercase">Reserva Num</span>
            <span class="text-base font-bold text-indigo-400">{{ selectedRes.resNumber }}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-500 font-semibold uppercase">Huesped</span>
            <span class="text-base text-white font-medium">{{ selectedRes.guestName }}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-500 font-semibold uppercase">Cedula o ID</span>
            <span>{{ selectedRes.guestId }}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-500 font-semibold uppercase">Tipo Habitacion</span>
            <span class="text-indigo-300 font-bold">{{ selectedRes.roomType }}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-500 font-semibold uppercase">Fecha Entrada</span>
            <span>{{ selectedRes.startDate }}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-500 font-semibold uppercase">Fecha Salida</span>
            <span>{{ selectedRes.endDate }}</span>
          </div>
        </div>

        <!-- Asignacion de Habitacion -->
        <div class="pt-4 border-t border-gray-800">
          <label class="block text-sm font-medium text-gray-300 mb-2">Asignar Habitacion Disponible</label>
          <div v-if="availableRooms.length === 0" class="text-red-400 text-sm">
            Error: No hay habitaciones disponibles del tipo: <strong>{{ selectedRes.roomType }}</strong>. Libere una o cambie el tipo.
          </div>
          <select 
            v-else
            v-model="assignedRoomNumber" 
            class="block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="" disabled>Seleccione una habitacion...</option>
            <option v-for="room in availableRooms" :key="room.id" :value="room.id">
              Habitacion {{ room.id }} - {{ room.type }} (${{ room.price }} USD/noche)
            </option>
          </select>
        </div>

        <!-- Servicios Adicionales en Check-in -->
        <div class="pt-4 border-t border-gray-800">
          <span class="block text-sm font-medium text-gray-300 mb-2">Servicios Adicionales Activos</span>
          <div class="space-y-1 text-sm text-gray-400 bg-gray-950/50 p-3 rounded">
            <div class="flex justify-between">
              <span>Internet ilimitado ($10 USD):</span>
              <span class="font-bold text-gray-200">{{ selectedRes.services?.internet ? 'Si' : 'No' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Desayuno Buffet ($15 USD/dia):</span>
              <span class="font-bold text-gray-200">{{ selectedRes.services?.breakfast ? 'Si' : 'No' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Garantia y Pago Multimoneda -->
      <div class="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-4">
        <h3 class="text-lg font-semibold text-white border-b border-gray-800 pb-2">Deposito de Garantia (100% Hospedaje)</h3>
        
        <div class="bg-indigo-950/40 border border-indigo-900 p-4 rounded text-indigo-300">
          <div class="flex justify-between items-center">
            <span>Total del Hospedaje:</span>
            <span class="text-2xl font-black text-green-400">${{ selectedRes.guaranteeAmount }} USD</span>
          </div>
          <span class="block text-xs text-gray-400 mt-1">El huesped debe dejar en garantia el 100% del costo total de alojamiento.</span>
        </div>

        <!-- Calculadora de Multimoneda -->
        <div class="space-y-3">
          <span class="block text-sm font-medium text-gray-300">Calculadora de Tasa de Cambio</span>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 font-semibold uppercase">Moneda de Pago</label>
              <select 
                v-model="paymentCurrency" 
                class="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="USD">Dolares (USD)</option>
                <option value="DOP">Pesos Dominicanos (DOP)</option>
                <option value="EUR">Euros (EUR)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 font-semibold uppercase">Monto Recibido (Efectivo)</label>
              <input 
                v-model.number="paymentAmount" 
                type="number" 
                step="0.01" 
                placeholder="Monto en divisa"
                class="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Conversion Automatica -->
          <div class="bg-gray-950/70 p-4 rounded space-y-2 text-sm text-gray-400 border border-gray-850">
            <div class="flex justify-between">
              <span>Tasa de Cambio fija:</span>
              <span class="text-xs text-indigo-400 font-bold">1 USD = 59.00 DOP | 1 EUR = 1.08 USD (64 DOP)</span>
            </div>
            <div class="flex justify-between border-t border-gray-800/80 pt-2 font-bold text-gray-300">
              <span>Equivalente en USD:</span>
              <span class="text-green-400">${{ convertedToUSD.toFixed(2) }} USD</span>
            </div>
            <div class="flex justify-between text-xs" :class="paymentStatusClass">
              <span>Estado del Deposito:</span>
              <span class="font-bold">{{ paymentStatusText }}</span>
            </div>
          </div>
        </div>

        <button 
          @click="performCheckIn" 
          :disabled="!canCheckIn || loading"
          class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Procesando Entrada...' : 'Registrar Entrada (Check-in)' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';

const resSearchQuery = ref('');
const selectedRes = ref(null);
const searchError = ref('');
const loading = ref(false);

const rooms = ref([]);
const assignedRoomNumber = ref('');
const paymentCurrency = ref('USD');
const paymentAmount = ref(0);

const rates = {
  USD: 1,
  DOP: 1 / 59,
  EUR: 1.08,
};

const fetchRooms = async () => {
  try {
    const q = query(collection(db, 'rooms'));
    const querySnapshot = await getDocs(q);
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    rooms.value = list;
  } catch (error) {
    console.error("Error al cargar habitaciones:", error);
  }
};

onMounted(() => {
  fetchRooms();
});

const searchReservation = async () => {
  searchError.value = '';
  selectedRes.value = null;
  assignedRoomNumber.value = '';
  paymentAmount.value = 0;

  if (!resSearchQuery.value.trim()) {
    searchError.value = 'Por favor, digite un numero de reserva.';
    return;
  }

  try {
    const q = query(
      collection(db, 'reservations'), 
      where('resNumber', '==', resSearchQuery.value.trim().toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      searchError.value = 'No se encontro ninguna reservacion con ese codigo.';
      return;
    }

    let foundRes = null;
    querySnapshot.forEach((doc) => {
      foundRes = { id: doc.id, ...doc.data() };
    });

    if (foundRes.status === 'Cancelada') {
      searchError.value = 'Esta reserva ha sido CANCELADA y no puede realizar Check-in.';
      return;
    }
    if (foundRes.status === 'CheckIn') {
      searchError.value = `Esta reserva ya realizo Check-in en la habitacion ${foundRes.roomNumber}.`;
      return;
    }
    if (foundRes.status === 'CheckOut') {
      searchError.value = 'Esta reserva ya completo su estancia y realizo Check-out.';
      return;
    }

    selectedRes.value = foundRes;
    paymentAmount.value = selectedRes.value.guaranteeAmount;
    paymentCurrency.value = 'USD';
    await fetchRooms();
  } catch (error) {
    console.error("Error al buscar reserva:", error);
    searchError.value = 'Error al consultar la base de datos.';
  }
};

const availableRooms = computed(() => {
  if (!selectedRes.value) return [];
  return rooms.value.filter(room => 
    room.type === selectedRes.value.roomType && 
    (room.status === 'Disponible' || room.status === 'Sucia')
  );
});

const convertedToUSD = computed(() => {
  if (!paymentAmount.value) return 0;
  const rate = rates[paymentCurrency.value] || 1;
  return paymentAmount.value * rate;
});

const isPaymentSufficient = computed(() => {
  if (!selectedRes.value) return false;
  return convertedToUSD.value >= (selectedRes.value.guaranteeAmount - 0.1);
});

const paymentStatusText = computed(() => {
  if (!selectedRes.value) return '';
  if (isPaymentSufficient.value) return 'Abonado/Garantia Cubierta (100%)';
  return `Falta abonar: $${(selectedRes.value.guaranteeAmount - convertedToUSD.value).toFixed(2)} USD`;
});

const paymentStatusClass = computed(() => {
  return isPaymentSufficient.value ? 'text-green-400 font-bold' : 'text-red-400 font-bold';
});

const canCheckIn = computed(() => {
  return selectedRes.value && 
         assignedRoomNumber.value !== '' && 
         isPaymentSufficient.value;
});

const performCheckIn = async () => {
  if (!canCheckIn.value) return;
  loading.value = true;

  try {
    const batch = writeBatch(db);
    
    const resRef = doc(db, 'reservations', selectedRes.value.id);
    batch.update(resRef, {
      status: 'CheckIn',
      roomNumber: assignedRoomNumber.value,
      paidGuarantee: convertedToUSD.value,
      checkInTime: new Date().toISOString(),
    });

    const roomRef = doc(db, 'rooms', assignedRoomNumber.value);

    batch.update(roomRef, {
      status: 'Ocupada',
      currentGuestResId: selectedRes.value.id,
      currentGuestName: selectedRes.value.guestName
    });

    await batch.commit();

    alert(`Check-in realizado con exito en la Habitacion ${assignedRoomNumber.value}!`);
    selectedRes.value = null;
    resSearchQuery.value = '';
    assignedRoomNumber.value = '';
    await fetchRooms();
  } catch (error) {
    console.error("Error al realizar Check-in:", error);
    alert("Error al guardar Check-in.");
  } finally {
    loading.value = false;
  }
};
</script>
