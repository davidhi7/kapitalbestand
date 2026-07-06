<script setup lang="ts">
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Panel from 'primevue/panel';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import type { LocationQueryRaw } from 'vue-router';

import {
    Category,
    CategoryShopType,
    Shop,
    useCategoryShopStore
} from '@/stores/CategoryShopStore';

const CategoryShopStore = useCategoryShopStore();
const toast = useToast();

const categories = computed(() =>
    Object.values(CategoryShopStore.categories).sort((a, b) =>
        a.name.localeCompare(b.name)
    )
);
const shops = computed(() =>
    Object.values(CategoryShopStore.shops).sort((a, b) =>
        a.name.localeCompare(b.name)
    )
);

const typeLabels: Record<CategoryShopType, string> = {
    category: 'Kategorie',
    shop: 'Händler'
};

// Query param used by ListPage to pre-populate the transaction filter.
function transactionsLink(
    type: CategoryShopType,
    id: number
): LocationQueryRaw {
    return type === 'category'
        ? { categoryId: String(id) }
        : { shopId: String(id) };
}

// A single rename/delete dialog serves both tables; we track which type and
// item it currently acts on.
const activeType = ref<CategoryShopType>('category');
const activeItem = ref<Category | Shop>();
const requestPending = ref(false);

const renameVisible = ref(false);
const editName = ref('');

function openRename(type: CategoryShopType, item: Category | Shop) {
    activeType.value = type;
    activeItem.value = item;
    editName.value = item.name;
    renameVisible.value = true;
}

async function saveRename() {
    if (!activeItem.value) return;
    const name = editName.value.trim();
    if (!name) return;
    requestPending.value = true;
    try {
        await CategoryShopStore.update(
            activeType.value,
            activeItem.value.id,
            name
        );
        toast.add({
            severity: 'success',
            summary: `${typeLabels[activeType.value]} umbenannt`,
            life: 3000
        });
        renameVisible.value = false;
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Fehler beim Umbenennen',
            life: 3000
        });
    }
    requestPending.value = false;
}

const deleteVisible = ref(false);

function openDelete(type: CategoryShopType, item: Category | Shop) {
    activeType.value = type;
    activeItem.value = item;
    deleteVisible.value = true;
}

async function confirmDelete() {
    if (!activeItem.value) return;
    requestPending.value = true;
    try {
        await CategoryShopStore.delete(activeType.value, activeItem.value.id);
        toast.add({
            severity: 'success',
            summary: `${typeLabels[activeType.value]} gelöscht`,
            life: 3000
        });
        deleteVisible.value = false;
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Fehler bei Löschung',
            life: 3000
        });
    }
    requestPending.value = false;
}

onMounted(() => {
    CategoryShopStore.fetch();
});
</script>

<template>
    <div class="flex flex-col gap-8">
        <Panel
            v-for="section in [
                {
                    type: 'category' as const,
                    title: 'Kategorien',
                    items: categories
                },
                { type: 'shop' as const, title: 'Händler', items: shops }
            ]"
            :key="section.type"
        >
            <template #header>
                <div class="font-semibold">{{ section.title }}</div>
            </template>
            <DataTable :value="section.items" data-key="id">
                <template #empty>
                    <div class="flex justify-center">Keine Einträge</div>
                </template>

                <Column field="name" header="Name" />

                <Column header="Aktionen" header-class="flex justify-end">
                    <template #body="{ data }">
                        <div class="flex items-center justify-end gap-1">
                            <Button
                                label="Transaktionen"
                                icon="pi pi-list"
                                text
                                size="small"
                                severity="secondary"
                                :as="'router-link'"
                                :to="{
                                    path: '/list',
                                    query: transactionsLink(
                                        section.type,
                                        data.id
                                    )
                                }"
                            />
                            <Button
                                icon="pi pi-pencil"
                                text
                                rounded
                                size="small"
                                severity="info"
                                @click="openRename(section.type, data)"
                            />
                            <Button
                                icon="pi pi-trash"
                                text
                                rounded
                                size="small"
                                severity="danger"
                                @click="openDelete(section.type, data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Panel>

        <Dialog
            v-model:visible="renameVisible"
            :header="`${typeLabels[activeType]} bearbeiten`"
            modal
        >
            <form class="flex flex-col gap-4" @submit.prevent="saveRename">
                <InputText v-model="editName" autofocus />
                <div class="flex justify-end gap-2">
                    <Button
                        label="Abbrechen"
                        severity="secondary"
                        type="button"
                        :disabled="requestPending"
                        @click="renameVisible = false"
                    />
                    <Button
                        label="Speichern"
                        type="submit"
                        :disabled="requestPending || !editName.trim()"
                        :loading="requestPending"
                    />
                </div>
            </form>
        </Dialog>

        <Dialog
            v-model:visible="deleteVisible"
            :header="`${typeLabels[activeType]} löschen`"
            modal
        >
            <div class="flex flex-col gap-4">
                <span>
                    {{ typeLabels[activeType] }}
                    <span class="font-semibold">{{ activeItem?.name }}</span>
                    wirklich löschen?
                </span>
                <div class="flex justify-end gap-2">
                    <Button
                        label="Abbrechen"
                        severity="secondary"
                        :disabled="requestPending"
                        @click="deleteVisible = false"
                    />
                    <Button
                        label="Löschen"
                        severity="danger"
                        :disabled="requestPending"
                        :loading="requestPending"
                        @click="confirmDelete"
                    />
                </div>
            </div>
        </Dialog>
    </div>
</template>
