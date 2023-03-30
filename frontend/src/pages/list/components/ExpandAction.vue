<script>
export default {
    props: {
        transaction: {
            type: Object,
            required: true
        }
    },
    inject: ['frequency'],
    computed: {
        keyValuePairs() {
            const { createdAt, updatedAt, id, Transaction } = this.transaction;
            const { Category, Shop, isExpense } = Transaction;
            const isMonthly = this.frequency === 'monthly';
            let type
            if (isMonthly) {
                if (Boolean(isExpense)) {
                    type = 'monatliche Ausgabe';
                } else {
                    type = 'monatliches Einkommen';
                }
            } else {
                if (Boolean(isExpense)) {
                    type = 'einmalige Ausgabe';
                } else {
                    type = 'einmaliges Einkommen';
                }
            }

            return {
                'erstellt': new Date(createdAt).toLocaleString('de-DE'),
                'Kategorie': Category ? Category.name : '-',
                'aktualisiert': new Date(updatedAt).toLocaleString('de-DE'),
                'Ort/Geschäft': Shop ? Shop.name : '-',
                'Identifikation': id,
                'Typ': type
            }
        }
    },
    emits: ['done']
};
</script>

<template>
    <section v-if="transaction.Transaction.description" class="text-ellipsis overflow-hidden">
        {{ transaction.Transaction.description }}
    </section>
    <section class="grid grid-cols-2">
        <div v-for="(value, key, index) in keyValuePairs" :key="index" class="text-left text-ellipsis overflow-hidden">
            <span class="text-sm font-semibold after:content-[':']">{{ key }}</span>
            <span class="text-sm before:content-['_']">{{ value }}</span>
        </div>
    </section>
</template>
