<script>
export default {
    data() {
        return {
            requestPending: false
        };
    },
    props: {
        transaction: {
            type: Object,
            required: true
        }
    },
    inject: ['frequency'],
    methods: {
        async del() {
            this.requestPending = true;
            const endpoint = `/api/transactions/${this.frequency}/${this.transaction.id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            this.requestPending = false;
            this.$emit('done', this.transaction.id, true);
        },
        cancel() {
            this.$emit('done', this.transaction.id, false);
        }
    },
    emits: ['done']
};
</script>

<template>
    <div>
        Transaktion wirklich löschen?
    </div>
    <div>
        <button :disabled="requestPending" @click="del">Ja</button>
        <button :disabled="requestPending" @click="cancel">Abbrechen</button>
    </div>
</template>

<style scoped>
div {
    display: flex;
    align-items: center;
    justify-content: center;
}

button {
    margin: .2rem;
}
</style>
