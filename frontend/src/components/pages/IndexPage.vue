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
} else if (currentHour >= 11 && currentMinute >= 30) {
    greeting = 'Mahlzeit';
} else {
    greeting = 'Guten Morgen';
}
</script>

<template>
    <div class="flex-column flex justify-center">
        <span class="mt-8 text-center text-5xl font-light">
            <span>{{ greeting }}, </span>
            <span class="bg-gradient bg-clip-text font-medium text-transparent">{{
                AuthStateStore.username
            }}</span>
            <span>.</span>
        </span>
    </div>
</template>
