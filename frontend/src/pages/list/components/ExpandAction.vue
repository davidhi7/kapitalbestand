<script>
export default {
    inject: ['frequency'],
    props: {
        transaction: {
            type: Object,
            required: true
        }
    },
    emits: ['done'],
    computed: {
        keyValuePairs() {
            const { createdAt, updatedAt, id, Transaction } = this.transaction;
            const { Category, Shop, isExpense } = Transaction;
            const isMonthly = this.frequency === 'monthly';
            let type;
            if (isMonthly) {
                if (isExpense) {
                    type = 'monatliche Ausgabe';
                } else {
                    type = 'monatliches Einkommen';
                }
            } else {
                if (isExpense) {
                    type = 'einmalige Ausgabe';
                } else {
                    type = 'einmaliges Einkommen';
                }
            }

            return {
                erstellt: new Date(createdAt).toLocaleString('de-DE'),
                Kategorie: Category ? Category.name : '-',
                aktualisiert: new Date(updatedAt).toLocaleString('de-DE'),
                'Ort/Geschäft': Shop ? Shop.name : '-',
                Identifikation: id,
                Typ: type
            };
        }
    }
};
</script>

<template>
    <section v-if="transaction.Transaction.description" class="overflow-hidden text-ellipsis">
        {{ transaction.Transaction.description }}
    </section>
    <section class="grid grid-cols-2">
        <div
            v-for="(value, key, index) in keyValuePairs"
            :key="index"
            class="overflow-hidden text-ellipsis text-left"
        >
            <span class="text-sm font-semibold after:content-[':']">{{ key }}</span>
            <span class="text-sm before:content-['_']">{{ value }}</span>
        </div>
    </section>
</template>
