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
            let typeString
            if (isMonthly) {
                if (Boolean(isExpense)) {
                    typeString = 'monatliche Ausgabe';
                } else {
                    typeString = 'monatliches Einkommen';
                }
            } else {
                if (Boolean(isExpense)) {
                    typeString = 'einmalige Ausgabe';
                } else {
                    typeString = 'einmaliges Einkommen';
                }
            }

            return {
                'erstellt': new Date(createdAt).toLocaleString('de-DE'),
                'Kategorie': Category ? Category.name : '-',
                'aktualisiert': new Date(updatedAt).toLocaleString('de-DE'),
                'Ort/Geschäft': Shop ? Shop.name : '-',
                'Identifikation': id,
                'Typ': typeString
            }
        }
    }
};
</script>

<template>
    <section class="description" v-if="transaction.Transaction.description">
        {{ transaction.Transaction.description }}
    </section>
    <section class="data-grid">
        <div v-for="(value, key, index) in keyValuePairs" :key="index">
            <span class="data-key">{{ key }}</span>
            <span class="data-value">{{ value }}</span>
        </div>
    </section>
</template>

<style lang="less">
.data-grid {
    display: grid;
    grid-template-columns: repeat(2, 50%);
}

.data-key {
    font-size: .85rem;
    text-decoration: underline dotted var(--text-secondary);
    &:after {
        content: ':';
    }
}

.data-value {
    font-size: .85rem;
    &::before {
        content: ' ';
    }
}
</style>
