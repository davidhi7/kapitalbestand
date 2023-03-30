<script setup>
import { useAuthStateStore } from '@/stores/AuthStateStore';
const AuthStateStore = useAuthStateStore();
const currentHour = new Date().getHours();
const currentMinute = new Date().getMinutes();
let greeting;
if (currentHour >= 18 || currentHour < 4) {
    greeting = 'Guten Abend';
} else if (currentHour >= 13) {
    greeting = 'Guten Tag';
}
else if (currentHour >= 11 && currentMinute >= 30) {
    greeting = 'Mahlzeit';
} else {
    greeting = 'Guten Morgen';
}

</script>

<template>
    <div class="flex flex-column justify-center">
        <span class="mt-8 text-5xl font-light text-center">{{ greeting }}, <span
                class="bg-branding bg-clip-text text-transparent font-medium">{{ AuthStateStore.username }}</span>.</span>
    </div>
</template>
