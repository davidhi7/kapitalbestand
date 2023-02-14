<script>
import { ExpandAction, EditAction, DeleteAction } from './transaction-list-actions';
import { format_currency, format_month } from '../../common';

export default {
    data() {
        return {
            actions: []
        };
    },
    props: {
        transactions: {
            type: Array,
            required: true
        },
        frequency: {
            type: String,
            required: true,
            validator(value) {
                return ['oneoff', 'monthly'].includes(value);
            }
        }
    },
    methods: {
        formatCurrency: format_currency,
        formatMonth: format_month,
        triggerAction: function (index, action) {
            if (this.actions[index] === action) {
                this.actions[index] = null;
            } else {
                this.actions[index] = action;
            }
        },
        isExpandEnabled: function (index) {
            return this.actions[index] === 'expand'
        },
        isEditEnabled: function (index) {
            return this.actions[index] === 'edit'
        },
        isDeleteEnabled: function (index) {
            return this.actions[index] === 'delete'
        },
        handleEditDone(id, modified, data) {
            this.actions[id] = 'expand';
            if (!modified)
                return;
            this.$emit('update', id, data);
        },
        handleDeleteDone(id, modified) {
            this.actions[id] = null;
            if (!modified) {
                return;
            }
            this.$emit('delete', id);
        }
    },
    components: {
        ExpandAction,
        EditAction,
        DeleteAction
    },
    provide() {
        return {
            frequency: this.frequency
        };
    },
    emits: ['update', 'delete']
};
</script>

<template>
    <table :class="{ 'four-cols': frequency === 'oneoff', 'five-cols': frequency === 'monthly' }">
        <thead>
            <tr>
                <th class="centre" v-if="frequency === 'oneoff'">Datum</th>
                <th class="centre" v-if="frequency === 'monthly'">erster Monat</th>
                <th class="centre" v-if="frequency === 'monthly'">letzter Monat</th>
                <th class="centre">Kategorie</th>
                <th class="centre">Betrag</th>
                <th class="centre">Aktionen</th>
            </tr>
        </thead>
        <tbody v-if="transactions && transactions.length > 0">
            <tr v-for="t in transactions" :v-key="t.id">
                <td v-if="frequency === 'oneoff'" class="content">
                    {{ t.date }}
                </td>
                <td v-if="frequency === 'monthly'" class="content">
                    {{ formatMonth(new Date(t.monthFrom)) }}
                </td>
                <td v-if="frequency === 'monthly'" class="content">
                    {{ t.monthTo ? formatMonth(new Date(t.monthTo)) : '-' }}
                </td>
                <td class="content">
                    {{ t.Transaction.Category.name }}
                </td>
                <td class="content">
                    {{ formatCurrency(t.Transaction.amount) }}
                </td>
                <td class="actions">
                    <button class="expand" :class="{ 'active': isExpandEnabled(t.id) }"
                        @click="triggerAction(t.id, 'expand')">
                        <span class="material-symbols-outlined icon">expand_more</span>
                    </button>
                    <button :class="{ 'active': isEditEnabled(t.id) }" @click="triggerAction(t.id, 'edit')">
                        <span class="material-symbols-outlined icon">edit</span>
                    </button>
                    <button :class="{ 'active': isDeleteEnabled(t.id) }" @click="triggerAction(t.id, 'delete')">
                        <span class="material-symbols-outlined icon">delete</span>
                    </button>
                </td>
                <td class="full-row" v-if="actions[t.id]" :class="{ 'shadow-below': actions[t.id] }">
                    <ExpandAction   v-if="isExpandEnabled(t.id)"    :transaction="t"></ExpandAction>
                    <EditAction     v-if="isEditEnabled(t.id)"      :transaction="t"    @done="handleEditDone"></EditAction>
                    <DeleteAction   v-if="isDeleteEnabled(t.id)"    :transaction="t"    @done="handleDeleteDone"></DeleteAction>
                </td>
            </tr>
        </tbody>
        <tbody v-else>
            <td class="full-row text-center">
                Keine Einträge
            </td>
        </tbody>
    </table>
</template>

<style lang="less">
table {
    display: grid;
    min-width: 100%;
    box-shadow: 0px 0px 15px rgba(0, 0, 0, .2);
    
    &.four-cols {
        grid-template-columns: repeat(4, 25%);
        
        td.full-row {
            grid-column: 1 / 5;
        }
    }
    
    &.five-cols {
        grid-template-columns: 20% 20% 23% 15% 22%;
        
        td.full-row {
            grid-column: 1 / 6;
        }
    }
}

thead,
tbody,
tr {
    display: contents;
}

tr {
    &>td:first-child {
        text-align: left;
    }

    &>td:not(:first-child):not(:last-child) {
        text-align: center;
    }

    /*
    No need to align last element to the right: it is either a full-row action node (expand/edit/delete) or action buttons that are correctly aligned anyways.
    &>td:last-child {
        text-align: right;
    }
    */
}


th {
    text-align: center;
    padding: 15px;
    background: var(--palette-4);
    font-weight: normal;
    font-size: 1.2rem;
    color: white;
    /*
    TODO: turn on later if only one table per page
    position: sticky;
    top: 0;
    */
}

td {
    padding: 15px;
    font-size: 1rem;
    padding-top: 10px;
    padding-bottom: 10px;

    &.content {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    &.actions {
        display: flex;
        padding: 0;
        margin: 0;
        justify-content: right;

        button {
            background-color: inherit;
            aspect-ratio: 1 / 1;
            border: none;
            padding: 0;
            margin: 0;

            &:hover {
                background-color: var(--background-4);
            }

            &.expand span {
                transform: rotate(0);
                transition: all .3s;
            }

            &.expand.active span {
                /* turn counter-clockwise */
                transform: rotate(-180deg);
                transition: all .3s;
                font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 200, 'opsz' 20;
            }

            &:not(.expand).active span {
                font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 200, 'opsz' 20;
            }
        }
    }
}

tr:not(:last-of-type) .shadow-below {
        position: relative;
        box-shadow: 0 5px 5px -5px hsl(0, 0%, 50%);
}

tr:nth-child(even) td {
    background: var(--background-2);
}

.icon {
    font-size: 20px;
}
</style>
