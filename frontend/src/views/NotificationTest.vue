<script>
export default {
    data() {
        return {
            ntfy_type: 'info',
            ntfy_duration: 10000,
            ntfy_content: 'Test'
        }
    }
}
</script>

<template>
    <h1>Notification Tests</h1>
    Dauer:
    <input v-model.number="ntfy_duration">
    <br>
    Text:
    <input v-model="ntfy_content">
    <br>
    Type:
    <input v-model="ntfy_type">
    <br>
    <button @click="$notificationBus.emit('notification', {content: ntfy_content, timeoutMilliseconds: ntfy_duration, type: ntfy_type})">Benachrichtigung senden</button>
</template>
