<script setup lang="ts">
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Panel from 'primevue/panel';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import type { LocationQueryRaw } from 'vue-router';

import HttpError from '@/HttpError';
import {
    useCategoryShopStore,
    type CategoryShopType
} from '@/stores/CategoryShopStore';

const toast = useToast();
const categoryShopStore = useCategoryShopStore();

interface ItemWithCounts {
    id: number;
    name: string;
    oneoff: number;
    recurring: number;
}

const typeLabels: Record<CategoryShopType, string> = {
    category: 'Kategorie',
    shop: 'Händler'
};

const categories = ref<ItemWithCounts[]>([]);
const shops = ref<ItemWithCounts[]>([]);

// The oneoff/recurring counts double as links into the transaction list,
// pre-filtered by this category/shop and the matching recurrence.
const countKinds = [
    { key: 'oneoff', header: 'Einmalig', recurrence: 'oneoff' },
    { key: 'recurring', header: 'Wiederkehrend', recurrence: 'recurring' }
] as const;

// Query params used by ListPage to pre-populate the transaction filter.
function transactionsLink(
    type: CategoryShopType,
    id: number,
    recurrence?: 'oneoff' | 'recurring'
): LocationQueryRaw {
    const query: LocationQueryRaw =
        type === 'category'
            ? { categoryId: String(id) }
            : { shopId: String(id) };
    if (recurrence) query.recurrence = recurrence;
    return query;
}

async function fetchCounts(type: CategoryShopType): Promise<ItemWithCounts[]> {
    const response = await fetch(
        type === 'category' ? '/api/categories/counts' : '/api/shops/counts'
    );
    if (!response.ok) throw new HttpError(response.status);
    const { data } = (await response.json()) as {
        data: Array<
            {
                counts: { oneoff: number; recurring: number };
            } & Record<CategoryShopType, { id: number; name: string }>
        >;
    };
    return data
        .map((entry): ItemWithCounts => {
            const item = entry[type];
            return {
                id: item.id,
                name: item.name,
                oneoff: entry.counts.oneoff,
                recurring: entry.counts.recurring
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

async function reload() {
    try {
        const [nextCategories, nextShops] = await Promise.all([
            fetchCounts('category'),
            fetchCounts('shop')
        ]);
        categories.value = nextCategories;
        shops.value = nextShops;
    } catch (e) {
        console.error(e);
        toast.add({
            severity: 'error',
            summary: 'Fehler beim Laden',
            life: 3000
        });
    }
}

// A single rename/delete dialog serves both tables; we track which type and
// item it currently acts on.
const activeType = ref<CategoryShopType>('category');
const activeItem = ref<ItemWithCounts>();
const requestPending = ref(false);

const renameVisible = ref(false);
const editName = ref('');

function openRename(type: CategoryShopType, item: ItemWithCounts) {
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
        await categoryShopStore.update(
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
        await reload();
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

function openDelete(type: CategoryShopType, item: ItemWithCounts) {
    activeType.value = type;
    activeItem.value = item;
    deleteVisible.value = true;
}

async function confirmDelete() {
    if (!activeItem.value) return;
    requestPending.value = true;
    try {
        await categoryShopStore.delete(activeType.value, activeItem.value.id);
        toast.add({
            severity: 'success',
            summary: `${typeLabels[activeType.value]} gelöscht`,
            life: 3000
        });
        deleteVisible.value = false;
        await reload();
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
    reload();
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

                <Column
                    v-for="kind in countKinds"
                    :key="kind.key"
                    :header="kind.header"
                >
                    <template #body="{ data }">
                        <Button
                            v-if="data[kind.key] > 0"
                            :label="String(data[kind.key])"
                            :as="'router-link'"
                            text
                            size="small"
                            :to="{
                                path: '/list',
                                query: transactionsLink(
                                    section.type,
                                    data.id,
                                    kind.recurrence
                                )
                            }"
                        />
                        <span v-else class="text-surface-400 px-3">0</span>
                    </template>
                </Column>

                <Column header="Gesamt">
                    <template #body="{ data }">
                        <Button
                            v-if="data.oneoff + data.recurring > 0"
                            :label="String(data.oneoff + data.recurring)"
                            :as="'router-link'"
                            text
                            size="small"
                            :to="{
                                path: '/list',
                                query: transactionsLink(section.type, data.id)
                            }"
                        />
                        <span v-else class="text-surface-400 px-3">0</span>
                    </template>
                </Column>

                <Column header="Aktionen" header-class="flex justify-end">
                    <template #body="{ data }">
                        <div class="flex items-center justify-end gap-1">
                            <Button
                                icon="pi pi-pencil"
                                text
                                rounded
                                size="small"
                                severity="info"
                                @click="openRename(section.type, data)"
                            />
                            <span
                                v-tooltip.top="
                                    data.oneoff > 0 || data.recurring > 0
                                        ? 'Noch mit Transaktionen verknüpft'
                                        : undefined
                                "
                            >
                                <Button
                                    icon="pi pi-trash"
                                    text
                                    rounded
                                    size="small"
                                    severity="danger"
                                    :disabled="
                                        data.oneoff > 0 || data.recurring > 0
                                    "
                                    @click="openDelete(section.type, data)"
                                />
                            </span>
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
