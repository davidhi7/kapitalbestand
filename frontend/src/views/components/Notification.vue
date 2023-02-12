<script>
import EventEmitter from '../../EventEmitter';
const eventEmitter = new EventEmitter();
export { eventEmitter };

const NotificationTypes = {
    info: {
        name: 'info',
        css: 'notification-info'
    },
    success: {
        name: 'success',
        css: 'notification-success'
    },
    warning: {
        name: 'warning',
        css: 'notification-warning'
    },
    error: {
        name: 'error',
        css: 'notification-error'
    }
};

export default {
    data() {
        return {
            notificationType: NotificationTypes.info,
            display: false,
            content: '',
            timeoutMilliseconds: 0,
            currentAnimationStage: null,
            currentAnimation: null,
            concurrentAnimation: null,
            SLIDE_DURATION: 300
        }
    },
    methods: {
        mouseEnter(evt) {
            // Pause the ongoing animation only if the current animation is timeout
            if (this.currentAnimationStage === this.timeout) {
                this.currentAnimation.pause();
            }
        },
        mouseLeave(evt) {
            if (this.currentAnimationStage === this.timeout) {
                this.currentAnimation.play();
            }
        },
        /**
         * Start the lifecycle of the notification
         */
        async show() {
            this.cancelCurrentAnimations();
            try {
                this.$refs.timeout.style.width = '100%';
                this.display = true;
                await this.slideIn();
                await this.timeout();
                await this.slideOut();
            } catch (error) {
                // error is thrown when Animation#finished promise is rejected. This is the expected behavior when the current notification is overwritten with a new one.
            }
        },
        /** Perform the first 'slide-in' animation and move the notification element into viewport */
        async slideIn() {
            // do first 'slide-in' animation to show the notification
            this.currentAnimationStage = this.slideIn
            this.currentAnimation = this.$refs.container.animate([
                { transform: 'translateX(-50%) translateY(-100%)' },
                { transform: 'translateX(-50%) translateY(0%)' }
            ], {
                easing: 'ease-out',
                duration: this.SLIDE_DURATION
            });
            await this.currentAnimation.finished;
        },
        /** Perform the 'timeout' animation: show remaining visible time */
        async timeout() {
            this.currentAnimationStage = this.timeout
            this.currentAnimation = this.$refs.timeout.animate([
                { width: '100%' },
                { width: '0%' }
            ], {
                duration: this.timeoutMilliseconds
            });
            await this.currentAnimation.finished;
            // fix the timeout bar width at 0% for slide-out animation
            this.$refs.timeout.style.width = '0%';
        },
        /** Perform the final 'slide-out' animation to hide the notification element again */
        async slideOut() {
            this.currentAnimationStage = this.slideOut
            this.currentAnimation = this.$refs.container.animate([
                {
                    transform: 'translateX(-50%) translateY(0%)'
                },
                {
                    transform: 'translateX(-50%) translateY(-300%)'
                }
            ], {
                //easing: 'ease-in',
                easing: 'cubic-bezier(0.395, -0.305, 0.750, 0.750)',
                duration: this.SLIDE_DURATION
            });
            await this.currentAnimation.finished;
            this.display = false;
        },
        async suppress(evt) {
            // closing notification during slide in is a irrelevant niche case and closing during slideout serves no purpose, so let's skip in these cases
            if (this.currentAnimationStage === this.slideIn || this.currentAnimation === this.slideOut) {
                return;
            }

            // when hiding the notification element while the timeout animation is still running, the slide-out animation will be executed concurrently so that the timeout animation wont be stopped abruptly.
            // To still be able to cancel it in case of another animation lifecycle right after suppressing one, a reference to this timeout animation is stored in this other field.
            this.concurrentAnimation = this.currentAnimation;

            try {
                await this.slideOut();
            } catch (error) {
                // error is thrown when Animation#finished promise is rejected. This is the expected behavior when the current notification is overwritten with a new one.
            }
        },
        cancelCurrentAnimations() {
            [this.currentAnimation, this.concurrentAnimation].forEach(animation => {
                if (animation instanceof Animation) {
                    animation.cancel();
                }
            });
        }
    },
    mounted() {
        eventEmitter.on('notification', (obj) => {
            const { content, type = 'info', timeoutMilliseconds = 3000 } = obj;
            this.content = content;
            this.timeoutMilliseconds = timeoutMilliseconds;

            for (const key in NotificationTypes) {
                if (NotificationTypes[key].name === type) {
                    this.notificationType = NotificationTypes[key];
                }
            }

            this.show();
        });
    }
}
</script>

<template>
    <div v-show="display" :class="['notification-container', notificationType.css]" @mouseenter="mouseEnter"
        @mouseleave="mouseLeave" ref="container">
        <div class="notification-main">
            <span class="notification-content">
                {{ content }}
            </span>
            <button class="notification-hide" @click="suppress">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
        <div class="notification-timeout" ref="timeout"></div>
    </div>
</template>

<style lang="less">
.notification-container {
    position: fixed;
    top: 10px;
    max-width: 650px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 5px;
    overflow: hidden;
    transition: box-shadow .2s;
    box-shadow: rgba(0, 0, 0, 0.3) 0px 15px 38px, rgba(0, 0, 0, 0.22) 0px 12px 12px;

    &:hover {
        box-shadow: rgba(0, 0, 0, 0.35) 0px 15px 38px, rgba(0, 0, 0, 0.26) 0px 12px 12px;
        transition: box-shadow .2s;
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
    background-color: var(--background-main);
    color: var(--text-main);

    .notification-timeout {
        background-color: var(--text-secondary);
    }

    .notification-hide {
        color: var(--text-secondary);
        &:hover {
            color: var(--text-main);
        }
    }
}

.notification-success {
    background-color: var(--green-1);
    color: white;

    .notification-timeout {
        background-color: var(--green-2);
    }

    .notification-hide {
        color: var(--green-2);
        &:hover {
            color: white;
        }
    }
}

.notification-warning {
    background-color: var(--yellow-1);
    color: white;

    .notification-timeout {
        background-color: var(--yellow-2);
    }

    .notification-hide {
        color: var(--yellow-2);
        &:hover {
            color: white;
        }
    }
}

.notification-error {
    background-color: var(--red-1);
    color: white;

    .notification-timeout {
        background-color: var(--red-2);
    }

    .notification-hide {
        color: var(--red-2);
        &:hover {
            color: white;
        }
    }
}
</style>
