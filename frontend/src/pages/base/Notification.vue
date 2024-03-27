<script lang="ts">
const SLIDE_DURATION = 300;
const TIMEOUT_DURATION = 3000;

export enum NotificationStyle {
    INFO = 'notification-info',
    SUCCESS = 'notification-success',
    WARNING = 'notification-warning',
    ERROR = 'notification-error'
}

export class NotificationEvent extends Event {
    style: NotificationStyle;
    content: string;

    constructor(style: NotificationStyle, content: string) {
        super('notification');
        this.style = style;
        this.content = content;
    }
}

export const eventEmitter = new EventTarget();

enum AnimationStage {
    SLIDE_IN,
    TIMEOUT,
    SLIDE_OUT
}

interface State {
    visible: boolean;
    notificationStyle: NotificationStyle;
    notificationContent: string;
    currentAnimationStage: AnimationStage | null;
    currentAnimation: any; // TODO
    concurrentAnimation: any;
}

export default {
    data(): State {
        return {
            visible: false,
            notificationStyle: NotificationStyle.INFO,
            notificationContent: '',
            currentAnimationStage: null,
            currentAnimation: null,
            concurrentAnimation: null
        };
    },
    methods: {
        mouseEnter(evt: MouseEvent) {
            // Pause the ongoing animation only if the current animation is timeout
            if (this.currentAnimationStage === AnimationStage.TIMEOUT) {
                this.currentAnimation.pause();
            }
        },
        mouseLeave(evt: MouseEvent) {
            if (this.currentAnimationStage === AnimationStage.TIMEOUT) {
                this.currentAnimation.play();
            }
        },
        /**
         * Start the lifecycle of the notification
         */
        async show() {
            this.cancelCurrentAnimations();
            try {
                this.visible = true;
                await this.slideIn();
                await this.timeout();
                await this.slideOut();
                this.visible = false;
            } catch (error) {
                // error is thrown when Animation#finished promise is rejected. This is the expected behavior when the current notification is overwritten with a new one.
            }
        },
        /**
         * Perform the first 'slide-in' animation and move the notification element into viewport
         */
        async slideIn() {
            // do first 'slide-in' animation to show the notification
            this.currentAnimationStage = AnimationStage.SLIDE_IN;
            (this.$refs.timeout as HTMLElement).style.width = '100%';
            this.currentAnimation = (this.$refs.container as HTMLElement).animate(
                [
                    { transform: 'translateX(-50%) translateY(-100%)' },
                    { transform: 'translateX(-50%) translateY(0%)' }
                ],
                {
                    easing: 'ease-out',
                    duration: SLIDE_DURATION
                }
            );
            await this.currentAnimation.finished;
        },
        /** Perform the 'timeout' animation: show remaining visible time */
        async timeout() {
            this.currentAnimationStage = AnimationStage.TIMEOUT;
            this.currentAnimation = (this.$refs.timeout as HTMLElement).animate(
                [{ width: '100%' }, { width: '0%' }],
                {
                    duration: TIMEOUT_DURATION
                }
            );
            await this.currentAnimation.finished;
            (this.$refs.timeout as HTMLElement).style.width = '0%';
        },
        /** Perform the final 'slide-out' animation to hide the notification element a`gain */
        async slideOut() {
            this.currentAnimationStage = AnimationStage.SLIDE_OUT;
            this.currentAnimation = (this.$refs.container as HTMLElement).animate(
                [
                    { transform: 'translateX(-50%) translateY(0%)' },
                    { transform: 'translateX(-50%) translateY(-300%)' }
                ],
                {
                    easing: 'cubic-bezier(0.395, -0.305, 0.750, 0.750)',
                    duration: SLIDE_DURATION
                }
            );
            await this.currentAnimation.finished;
        },
        async suppress(evt: MouseEvent) {
            // closing notification during slide in is a irrelevant niche case and closing during slideout serves no purpose, so let's skip in these cases
            if (this.currentAnimationStage !== AnimationStage.TIMEOUT) {
                return;
            }

            // when hiding the notification element while the timeout animation is still running, the slide-out animation will be executed concurrently so that the timeout animation wont be stopped abruptly.
            // To still be able to cancel it in case of another animation lifecycle right after suppressing one, a reference to this timeout animation is stored in this other field.
            this.concurrentAnimation = this.currentAnimation;

            try {
                await this.slideOut();
                this.visible = false;
            } catch (error) {
                // error is thrown when Animation#finished promise is rejected. This is the expected behavior when the current notification is overwritten with a new one.
            }
        },
        cancelCurrentAnimations() {
            [this.currentAnimation, this.concurrentAnimation].forEach((animation) => {
                if (animation instanceof Animation) {
                    animation.cancel();
                }
            });
        }
    },
    mounted() {
        eventEmitter.addEventListener('notification', (event: Event) => {
            const { content, style } = event as NotificationEvent;
            this.notificationContent = content;
            this.notificationStyle = style;

            this.show();
        });
    }
};
</script>

<template>
    <div
        v-show="visible"
        ref="container"
        :class="['notification-container', notificationStyle]"
        @mouseenter="mouseEnter"
        @mouseleave="mouseLeave"
    >
        <div class="notification-main">
            <span class="notification-content">
                {{ notificationContent }}
            </span>
            <button class="notification-hide" @click="suppress">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        <div ref="timeout" class="notification-timeout"></div>
    </div>
</template>

<style>
.notification-container {
    --green-1: #2c8730;
    --green-2: #b5d5b7;

    --red-1: #c42b2b;
    --red-2: #e0a2a2;

    --yellow-1: #d9ad00;
    --yellow-2: #e8da8e;

    --default-text: white;

    position: fixed;
    top: 10px;
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 5px;
    overflow: hidden;
    transition: box-shadow 0.2s;
    box-shadow:
        rgba(0, 0, 0, 0.3) 0px 15px 38px,
        rgba(0, 0, 0, 0.22) 0px 12px 12px;

    &:hover {
        box-shadow:
            rgba(0, 0, 0, 0.35) 0px 15px 38px,
            rgba(0, 0, 0, 0.26) 0px 12px 12px;
        transition: box-shadow 0.2s;
    }
}

.notification-main {
    margin: 10px;
    display: flex;
    gap: 10px;
}

.notification-hide {
    padding: 0px 10px 0px 10px;
    font-size: 20px; /* set icon size slightly larger than font size */
    border: none;
    color: inherit;
    background-color: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
}

.notification-timeout {
    width: 100%;
    height: 6px;
}

.notification-info {
    background-color: var(--secondary-bg);
    color: var(--main);

    .notification-timeout {
        background-color: var(--tertiary);
    }

    .notification-hide {
        color: var(--tertiary);

        &:hover {
            color: var(--main);
        }
    }
}

.notification-success {
    background-color: var(--green-1);
    color: var(--default-text);

    .notification-timeout {
        background-color: var(--green-2);
    }

    .notification-hide {
        color: var(--green-2);

        &:hover {
            color: var(--default-text);
        }
    }
}

.notification-warning {
    background-color: var(--yellow-1);
    color: var(--default-text);

    .notification-timeout {
        background-color: var(--yellow-2);
    }

    .notification-hide {
        color: var(--yellow-2);

        &:hover {
            color: var(--default-text);
        }
    }
}

.notification-error {
    background-color: var(--red-1);
    color: var(--default-text);

    .notification-timeout {
        background-color: var(--red-2);
    }

    .notification-hide {
        color: var(--red-2);

        &:hover {
            color: var(--default-text);
        }
    }
}
</style>
