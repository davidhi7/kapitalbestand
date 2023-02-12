<script>
export default {
    props: {
        to: {
            type: String,
            required: false
        },
        icon: {
            type: String,
            required: false
        },
        label: {
            type: String,
            required: false
        },
        labelLeft: {
            type: Boolean,
            required: false
        }
    }
};
</script>

<template>
    <component :is="to ? 'router-link' : 'a'"  link :to="to">
        <div class="selected-indicator"></div>
        <div class="content">
            <span class="label" v-if="label && labelLeft">
                {{ label }}
            </span>
            <span class="material-symbols-outlined icon" v-if="icon">
                {{ icon }}
            </span>
            <span class="label" v-if="label && !labelLeft">
                {{ label }}
            </span>
        </div>
    </component>
</template>

<style scoped lang="less">
a {
    text-decoration: none;

    display: flex;
    flex-direction: column;
    cursor: pointer;

    &.large .icon {
        font-size: 1.8rem !important;
    }

    .selected-indicator {
        height: 0.25rem;
    }

    &.router-link-exact-active {
        .selected-indicator {
            @apply bg-main-dark;
            border-bottom-left-radius: 3px;
            border-bottom-right-radius: 3px;
        }
    }

    .content {
        padding: 0.1rem 0.3rem 0.35rem 0.3rem;
        display: flex;
        align-items: center;
        flex-grow: 1;

        .icon {
            font-size: 1.4rem;
            margin: 0 2px 0 2px;
        }

        .label {
            font-size: 1.35rem;
            margin: 0 2px 0 2px;
        }
    }
    &:hover {
        background-color: rgba(255 255 255 0.2);
    }
}

@media (orientation: portrait) {
    a {
        flex-direction: row;

        .content {
            padding: 0.35rem 0.3rem 0.35rem 0.05rem;
        }

        .selected-indicator {
            height: auto;
            width: 0.25rem;
        }

        &.router-link-exact-active {
            .selected-indicator {
                background-color: white;
                border-top-right-radius: 0.5rem;
                border-bottom-right-radius: 0.5rem;
                border-bottom-left-radius: 0;
            }
        }
    }
}
</style>
