<template>
  <div class="space-y-6">
    <div class="bg-gray-900 p-4 rounded-lg border border-gray-800">
      <h2 class="text-xl font-bold text-white">Registro de Salida (Check-out)</h2>
      <p class="text-sm text-gray-400">Verifique activos, facture consumos acumulados, realice traslados de habitacion y cierre la cuenta del huesped.</p>
    </div>

    <!-- BUSCADOR DE HABITACION O RESERVA -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Listado lateral de habitaciones ocupadas -->
      <div class="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-4 lg:col-span-1">
        <h3 class="text-lg font-semibold text-white border-b border-gray-800 pb-2">Habitaciones Ocupadas</h3>
        <div v-if="occupiedRooms.length === 0" class="text-gray-500 text-sm py-4 text-center">
          No hay habitaciones ocupadas en este momento.
        </div>
        <div v-else class="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          <button 
            v-for="room in occupiedRooms" 
            :key="room.id"
            @click="selectRoom(room)"
            class="w-full text-left p-3 rounded-lg border transition text-sm flex justify-between items-center"
            :class="selectedRoom && selectedRoom.id === room.id 
              ? 'bg-indigo-900/30 border-indigo-500 text-white' 
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-755'"
          >
            <div>
              <span class="font-bold block">Habitacion {{ room.id }}</span>
              <span class="text-xs text-gray-400">Huesped: {{ room.currentGuestName }}</span>
            </div>
            <span class="text-xs px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 font-semibold">
              {{ room.type }}
            </span>
          </button>
        </div>
      </div>

      <!-- WORKSPACE DE CHECK-OUT -->
      <div v-if="selectedRoom && activeReservation" class="lg:col-span-2 space-y-6">
        
        <!-- CABECERA HUESPED Y ACCIONES -->
        <div class="bg-gray-900 p-6 rounded-lg border border-gray-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span class="text-xs font-bold text-gray-400 block uppercase">Huesped en Habitacion {{ selectedRoom.id }}</span>
            <h3 class="text-lg font-black text-white">{{ activeReservation.guestName }}</h3>
            <span class="text-xs text-gray-300">Reserva: <strong class="text-indigo-400">{{ activeReservation.resNumber }}</strong> | Cedula: {{ activeReservation.guestId }}</span>
          </div>

          <!-- Boton de Transferencia de Habitacion -->
          <div>
            <button 
              @click="showTransferModal = true"
              class="bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-800 px-3 py-2 rounded text-xs font-bold transition flex items-center gap-1.5"
            >
              Transferencia de Habitacion
            </button>
          </div>
        </div>

        <!-- VERIFICACION DE ACTIVOS -->
        <div class="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-4">
          <div class="border-b border-gray-850 pb-2">
            <h3 class="text-base font-bold text-white">Verificacion de Activos de la Habitacion</h3>
            <p class="text-xs text-gray-400">Valide el estado fisico de los activos de la habitacion antes de generar la factura.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="space-y-3">
              <div v-for="asset in assetsList" :key="asset.name" class="flex justify-between items-center bg-gray-950 p-2.5 rounded border border-gray-850">
                <span class="font-semibold text-gray-300">{{ asset.label }}</span>
                <div class="flex gap-2">
                  <button 
                    v-for="status in ['Correcto', 'Danado', 'Faltante']" 
                    :key="status"
                    type="button"
                    @click="setAssetStatus(asset.name, status)"
                    class="px-2 py-1 rounded text-[10px] font-bold border transition"
                    :class="getAssetStatusClass(asset.name, status)"
                  >
                    {{ status }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Cobro por Danos o Perdidas -->
            <div class="bg-gray-950 p-4 rounded border border-gray-850 space-y-3 flex flex-col justify-between">
              <div>
                <span class="block font-bold text-gray-300 mb-1">Cargos Adicionales por Activos</span>
                <span class="block text-[10px] text-gray-400">Si un activo esta marcado como "Danado" o "Faltante", digite el costo de reposicion.</span>
              </div>
              <div>
                <label class="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Monto de penalizacion ($ USD)</label>
                <input 
                  v-model.number="assetDamageCharge" 
                  type="number" 
                  min="0" 
                  placeholder="0.00"
                  class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none"
                />
              </div>
              <div class="text-[10px] text-gray-500">
                * Este cargo se sumara al total final de la factura.
              </div>
            </div>
          </div>
        </div>

        <!-- SECCION DE FACTURACION -->
        <div class="bg-gray-900 p-6 rounded-lg border border-gray-855 space-y-4" id="factura-seccion">
          <div class="border-b border-gray-850 pb-2 flex justify-between items-center">
            <div>
              <h3 class="text-base font-bold text-white">Detalle de Factura</h3>
              <p class="text-xs text-gray-400">Consolidado final de la estadia y consumos adicionales</p>
            </div>
            <!-- Boton de Impresion -->
            <button 
              @click="printInvoice" 
              class="bg-gray-850 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded border border-gray-750 transition flex items-center gap-1.5"
            >
              Imprimir Factura
            </button>
          </div>

          <div class="space-y-3 text-xs text-gray-300">
            <!-- Detalles de Noches -->
            <div class="flex justify-between p-2 bg-gray-950 rounded">
              <span>Hospedaje: Habitacion {{ selectedRoom.id }} ({{ selectedRoom.type }}) x {{ calculatedNights }} Noche(s)</span>
              <span class="font-bold">${{ lodgingCost.toFixed(2) }} USD</span>
            </div>

            <!-- Servicios Adicionales en CheckIn -->
            <div v-if="hasServices" class="p-2 bg-gray-950 rounded space-y-1">
              <span class="block font-semibold text-indigo-400">Servicios Adicionales Contratados:</span>
              <div v-if="activeReservation.services?.internet" class="flex justify-between pl-2 text-[11px]">
                <span>- Internet Ilimitado</span>
                <span>$10.00 USD</span>
              </div>
              <div v-if="activeReservation.services?.breakfast" class="flex justify-between pl-2 text-[11px]">
                <span>- Desayuno Buffet x {{ calculatedNights }} dias</span>
                <span>${{ (15 * calculatedNights).toFixed(2) }} USD</span>
              </div>
            </div>

            <!-- Sin consumos adicionales -->

            <!-- Penalizaciones de Activos -->
            <div v-if="assetDamageCharge > 0" class="flex justify-between p-2 bg-red-950/20 border border-red-900/30 rounded text-red-400 font-bold">
              <span>Penalizaciones por Activos de Habitacion</span>
              <span>${{ assetDamageCharge.toFixed(2) }} USD</span>
            </div>

            <!-- Resumen Total -->
            <div class="border-t border-gray-800 pt-3 space-y-1.5 text-sm font-semibold">
              <div class="flex justify-between text-xs text-gray-400">
                <span>Subtotal General (Estadia + Servicios):</span>
                <span>${{ totalGeneralCost.toFixed(2) }} USD</span>
              </div>
              <div class="flex justify-between text-xs text-green-400">
                <span>(-) Deposito de Garantia Pagado (Check-in):</span>
                <span>-${{ activeReservation.paidGuarantee || activeReservation.guaranteeAmount }} USD</span>
              </div>
              <div class="flex justify-between text-base font-black text-white bg-gray-950 p-3 rounded border border-gray-800">
                <span>Total Restante a Pagar:</span>
                <span class="text-green-400">${{ remainingBalance.toFixed(2) }} USD</span>
              </div>
            </div>
          </div>

          <!-- CIERRE DE FACTURA Y COBRO EN EFECTIVO -->
          <div class="pt-4 border-t border-gray-850 space-y-4">
            <h4 class="text-xs font-bold text-white uppercase">Cierre y Pago de la Factura (Efectivo)</h4>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] text-gray-400 font-semibold uppercase">Monto Recibido</label>
                <input 
                  v-model.number="checkoutPayment" 
                  type="number" 
                  step="0.01" 
                  class="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-[10px] text-gray-400 font-semibold uppercase">Devuelta / Cambio</label>
                <div class="mt-1 bg-gray-950 border border-gray-800 text-xs text-green-400 font-bold px-3 py-2 rounded">
                  ${{ changeDue.toFixed(2) }} USD
                </div>
              </div>
            </div>

            <button 
              @click="closeCheckout" 
              :disabled="!canCloseCheckout || loading"
              class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cargar Cierre de Factura (Check-out)
            </button>
          </div>
        </div>

      </div>

      <div v-else class="lg:col-span-2 bg-gray-900 rounded-lg border border-gray-800 p-12 text-center text-gray-500">
        Seleccione una habitacion ocupada de la lista lateral para iniciar el proceso de Check-out.
      </div>
    </div>

    <!-- MODAL DE TRASLADO / TRANSFERENCIA DE HABITACION -->
    <div v-if="showTransferModal && selectedRoom && activeReservation" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full overflow-hidden shadow-2xl">
        <div class="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 class="text-base font-bold text-white">Transferencia de Habitacion</h3>
          <button @click="showTransferModal = false" class="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div class="p-6 space-y-4">
          <div class="p-3 bg-gray-950 text-xs text-gray-400 border border-gray-850 rounded">
            Se realizara un <strong>Check-out automatico</strong> de la Habitacion {{ selectedRoom.id }} y un <strong>Check-in automatico</strong> en la nueva habitacion seleccionada. Todos los cargos y depositos acumulados se mantendran intactos en la reservacion del huesped.
          </div>

          <div>
            <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Seleccione Nueva Habitacion Disponible</label>
            <div v-if="availableTransferRooms.length === 0" class="text-red-400 text-xs py-2 font-bold">
              Error: No hay habitaciones disponibles del mismo tipo ({{ selectedRoom.type }}) en este momento.
            </div>
            <select 
              v-else
              v-model="transferRoomId" 
              class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-xs focus:outline-none"
            >
              <option value="" disabled>Seleccione habitacion...</option>
              <option v-for="room in availableTransferRooms" :key="room.id" :value="room.id">
                Habitacion {{ room.id }} - {{ room.type }} (${{ room.price }} USD)
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button 
              @click="showTransferModal = false" 
              class="bg-gray-850 hover:bg-gray-800 text-white px-4 py-2 rounded text-xs"
            >
              Cancelar
            </button>
            <button 
              @click="performRoomTransfer" 
              :disabled="!transferRoomId || loading"
              class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-xs font-bold disabled:opacity-50"
            >
              Procesar Transferencia
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { db } from '../firebase.js';
import { collection, query, getDocs, doc, writeBatch } from 'firebase/firestore';

const rooms = ref([]);
const reservations = ref([]);
const selectedRoom = ref(null);
const activeReservation = ref(null);
const loading = ref(false);

const assetsList = [
  { name: 'keys', label: 'Llave / Banda Magnetica' },
  { name: 'towels', label: 'Toallas de Bano' },
  { name: 'tv', label: 'Control Remoto y TV' },
  { name: 'ac', label: 'Aire Acondicionado' }
];

const assetsStatus = ref({
  keys: 'Correcto',
  towels: 'Correcto',
  tv: 'Correcto',
  ac: 'Correcto'
});

const assetDamageCharge = ref(0);
const checkoutPayment = ref(0);

const showTransferModal = ref(false);
const transferRoomId = ref('');

const fetchData = async () => {
  try {
    const qRooms = query(collection(db, 'rooms'));
    const snapRooms = await getDocs(qRooms);
    const listRooms = [];
    snapRooms.forEach((doc) => {
      listRooms.push({ id: doc.id, ...doc.data() });
    });
    rooms.value = listRooms;

    const qRes = query(collection(db, 'reservations'));
    const snapRes = await getDocs(qRes);
    const listRes = [];
    snapRes.forEach((doc) => {
      listRes.push({ id: doc.id, ...doc.data() });
    });
    reservations.value = listRes;
  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
};

onMounted(async () => {
  await fetchData();
});

const occupiedRooms = computed(() => {
  return rooms.value.filter(room => room.status === 'Ocupada');
});

const selectRoom = (room) => {
  selectedRoom.value = room;
  const activeRes = reservations.value.find(
    res => res.roomNumber === room.id && res.status === 'CheckIn'
  );
  activeReservation.value = activeRes || null;

  assetsStatus.value = {
    keys: 'Correcto',
    towels: 'Correcto',
    tv: 'Correcto',
    ac: 'Correcto'
  };
  assetDamageCharge.value = 0;
  checkoutPayment.value = 0;
  transferRoomId.value = '';
  
  if (activeRes) {
    checkoutPayment.value = remainingBalance.value;
  }
};

const setAssetStatus = (name, status) => {
  assetsStatus.value[name] = status;
  let calculatedPenalty = 0;
  Object.keys(assetsStatus.value).forEach(k => {
    if (assetsStatus.value[k] === 'Danado') calculatedPenalty += 20;
    if (assetsStatus.value[k] === 'Faltante') calculatedPenalty += 35;
  });
  assetDamageCharge.value = calculatedPenalty;
  checkoutPayment.value = remainingBalance.value;
};

const getAssetStatusClass = (name, status) => {
  const current = assetsStatus.value[name];
  if (current !== status) return 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300';
  
  if (status === 'Correcto') return 'bg-green-900/40 text-green-400 border-green-800/80';
  if (status === 'Danado') return 'bg-yellow-900/40 text-yellow-400 border-yellow-800/80';
  return 'bg-red-900/40 text-red-400 border-red-800/80';
};

const calculatedNights = computed(() => {
  if (!activeReservation.value) return 1;
  const start = new Date(activeReservation.value.startDate);
  const end = new Date(activeReservation.value.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
});

const lodgingCost = computed(() => {
  if (!selectedRoom.value) return 0;
  return selectedRoom.value.price * calculatedNights.value;
});

const hasServices = computed(() => {
  if (!activeReservation.value) return false;
  return activeReservation.value.services?.internet || activeReservation.value.services?.breakfast;
});

const optionalServicesCost = computed(() => {
  if (!activeReservation.value) return 0;
  let cost = 0;
  if (activeReservation.value.services?.internet) cost += 10;
  if (activeReservation.value.services?.breakfast) cost += 15 * calculatedNights.value;
  return cost;
});

const totalGeneralCost = computed(() => {
  return lodgingCost.value + optionalServicesCost.value + assetDamageCharge.value;
});

const remainingBalance = computed(() => {
  if (!activeReservation.value) return 0;
  const guarantee = activeReservation.value.paidGuarantee || activeReservation.value.guaranteeAmount;
  const bal = totalGeneralCost.value - guarantee;
  return bal > 0 ? bal : 0;
});

const changeDue = computed(() => {
  const diff = checkoutPayment.value - remainingBalance.value;
  return diff > 0 ? diff : 0;
});

const canCloseCheckout = computed(() => {
  return activeReservation.value && checkoutPayment.value >= (remainingBalance.value - 0.05);
});

const closeCheckout = async () => {
  if (!canCloseCheckout.value) return;
  loading.value = true;

  try {
    const batch = writeBatch(db);

    const resRef = doc(db, 'reservations', activeReservation.value.id);
    batch.update(resRef, {
      status: 'CheckOut',
      totalAmount: totalGeneralCost.value,
      checkoutTime: new Date().toISOString(),
      assetVerification: assetsStatus.value,
      assetDamageCharge: assetDamageCharge.value,
      checkoutPayment: checkoutPayment.value,
      paymentStatus: 'Pagado'
    });

    const roomRef = doc(db, 'rooms', selectedRoom.value.id);
    batch.update(roomRef, {
      status: 'Sucia',
      currentGuestResId: null,
      currentGuestName: null
    });

    await batch.commit();

    alert(`Check-out de Habitacion ${selectedRoom.value.id} completado con exito! La habitacion se ha marcado como SUCIA.`);
    
    selectedRoom.value = null;
    activeReservation.value = null;
    
    await fetchData();
  } catch (error) {
    console.error("Error al procesar Checkout:", error);
    alert("Error al guardar Check-out.");
  } finally {
    loading.value = false;
  }
};

const printInvoice = () => {
  window.print();
};

const availableTransferRooms = computed(() => {
  if (!selectedRoom.value) return [];
  return rooms.value.filter(
    room => room.type === selectedRoom.value.type && room.status === 'Disponible'
  );
});

const performRoomTransfer = async () => {
  if (!selectedRoom.value || !activeReservation.value || !transferRoomId.value) return;
  loading.value = true;

  try {
    const batch = writeBatch(db);

    const oldRoomRef = doc(db, 'rooms', selectedRoom.value.id);
    batch.update(oldRoomRef, {
      status: 'Sucia',
      currentGuestResId: null,
      currentGuestName: null
    });

    const newRoomRef = doc(db, 'rooms', transferRoomId.value);

    batch.update(newRoomRef, {
      status: 'Ocupada',
      currentGuestResId: activeReservation.value.id,
      currentGuestName: activeReservation.value.guestName
    });

    const resRef = doc(db, 'reservations', activeReservation.value.id);
    batch.update(resRef, {
      roomNumber: transferRoomId.value
    });

    await batch.commit();

    alert(`Traslado exitoso! El huesped fue transferido a la Habitacion ${transferRoomId.value}.`);
    showTransferModal.value = false;
    selectedRoom.value = null;
    activeReservation.value = null;
    
    await fetchData();
  } catch (error) {
    console.error("Error al procesar traslado de habitacion:", error);
    alert("Error al realizar traslado.");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #factura-seccion, #factura-seccion * {
    visibility: visible;
  }
  #factura-seccion {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white !important;
    color: black !important;
    border: none !important;
  }
  #factura-seccion button {
    display: none;
  }
}
</style>
