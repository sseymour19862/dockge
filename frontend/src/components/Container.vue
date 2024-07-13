<template>
    <div class="shadow-box mb-3 container">
        <div class="row">
            <div class="col-7">
                <h4>{{ name }}</h4>
                <div class="image mb-2">
                    <span class="me-1">{{ imageName }}:</span><span class="tag">{{ imageTag }}</span>
                </div>
                <div v-if="!isEditMode">
                    <span class="badge me-1" :class="bgStyle">{{ status }}</span>

                    <a v-for="port in envsubstService.ports" :key="port" :href="parsePort(port).url" target="_blank">
                        <span class="badge me-1 bg-secondary">{{ parsePort(port).display }}</span>
                    </a>
                </div>
            </div>
        </div>
        <div v-if="!isEditMode" class="function">
            <button v-if="status !== 'paused' && status !== 'exited' && status !== 'N/A'" class="btn btn-normal" @click="pause()">
                <font-awesome-icon class="me-1" icon="pause" />
                {{ $t('pauseContainer') }}
            </button>
            <button v-if="status === 'paused'" class="btn btn-normal" @click="unpause()">
                <font-awesome-icon class="me-1" icon="play" />
                {{ $t('unpauseContainer') }}
            </button>
            <button v-if="status === 'exited' || status === 'N/A'" class="btn btn-normal" @click="start()">
                <font-awesome-icon class="me-1" icon="play" />
                {{ $t('startContainer') }}
            </button>
            <button v-if="status !== 'exited' && status !== 'N/A'" class="btn btn-normal" @click="stop()">
                <font-awesome-icon class="me-1" icon="stop" />
                {{ $t('stopContainer') }}
            </button>
            <button v-if="status !== 'exited' && status !== 'N/A'" class="btn btn-normal" @click="kill()">
                <font-awesome-icon class="me-1" icon="ban" />
                {{ $t('killContainer') }}
            </button>
            <button v-if="status !== 'exited' && status !== 'N/A'" class="btn btn-normal" @click="restart()">
                <font-awesome-icon class="me-1" icon="rotate" />
                {{ $t('restartContainer') }}
            </button>
            <router-link v-if="status !== 'exited' && status !== 'N/A'" class="btn btn-normal" :to="terminalRouteLink">
                <font-awesome-icon class="me-1" icon="terminal" />
                {{ $t('bashContainer') }}
            </router-link>
        </div>

        <div v-if="isEditMode" class="function">
            <button class="btn btn-normal" @click="showConfig = !showConfig">
                <font-awesome-icon icon="edit" />
                {{ $t("Edit") }}
            </button>
            <button class="btn btn-danger" @click="remove">
                <font-awesome-icon icon="trash" />
                {{ $t("deleteContainer") }}
            </button>
        </div>

        <transition name="slide-fade" appear>
            <div v-if="isEditMode && showConfig" class="config mt-3">
                <!-- Image -->
                <div class="mb-4">
                    <label class="form-label">
                        {{ $t("dockerImage") }}
                    </label>
                    <div class="input-group mb-3">
                        <input
                            v-model="service.image"
                            class="form-control"
                            list="image-datalist"
                        />
                    </div>

                    <!-- TODO: Search online: https://hub.docker.com/api/content/v1/products/search?q=louislam%2Fuptime&source=community&page=1&page_size=4 -->
                    <datalist id="image-datalist">
                        <option value="louislam/uptime-kuma:1" />
                    </datalist>
                    <div class="form-text"></div>
                </div>

                <!-- Ports -->
                <div class="mb-4">
                    <label class="form-label">
                        {{ $tc("port", 2) }}
                    </label>
                    <ArrayInput name="ports" :display-name="$t('port')" placeholder="HOST:CONTAINER" />
                </div>

                <!-- Volumes -->
                <div class="mb-4">
                    <label class="form-label">
                        {{ $tc("volume", 2) }}
                    </label>
                    <ArrayInput name="volumes" :display-name="$t('volume')" placeholder="HOST:CONTAINER" />
                </div>

                <!-- Restart Policy -->
                <div class="mb-4">
                    <label class="form-label">
                        {{ $t("restartPolicy") }}
                    </label>
                    <select v-model="service.restart" class="form-select">
                        <option value="always">{{ $t("restartPolicyAlways") }}</option>
                        <option value="unless-stopped">{{ $t("restartPolicyUnlessStopped") }}</option>
                        <option value="on-failure">{{ $t("restartPolicyOnFailure") }}</option>
                        <option value="no">{{ $t("restartPolicyNo") }}</option>
                    </select>
                </div>

                <!-- Environment Variables -->
                <div class="mb-4">
                    <label class="form-label">
                        {{ $tc("environmentVariable", 2) }}
                    </label>
                    <ArrayInput name="environment" :display-name="$t('environmentVariable')" placeholder="KEY=VALUE" />
                </div>

                <!-- Container Name -->
                <div v-if="false" class="mb-4">
                    <label class="form-label">
                        {{ $t("containerName") }}
                    </label>
                    <div class="input-group mb-3">
                        <input
                            v-model="service.container_name"
                            class="form-control"
                        />
                    </div>
                    <div class="form-text"></div>
                </div>

                <!-- Network -->
                <div class="mb-4">
                    <label class="form-label">
                        {{ $tc("network", 2) }}
                    </label>

                    <div v-if="networkList.length === 0 && service.networks && service.networks.length > 0" class="text-warning mb-3">
                        No networks available. You need to add internal networks or enable external networks in the right side first.
                    </div>

                    <ArraySelect name="networks" :display-name="$t('network')" placeholder="Network Name" :options="networkList" />
                </div>

                <!-- Depends on -->
                <div class="mb-4">
                    <label class="form-label">
                        {{ $t("dependsOn") }}
                    </label>
                    <ArrayInput name="depends_on" :display-name="$t('dependsOn')" placeholder="Container Name" />
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { defineComponent } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { parseDockerPort } from "../../../common/util-common";

export default defineComponent({
    components: {
        FontAwesomeIcon,
    },
    props: {
        name: {
            type: String,
            required: true,
        },
        isEditMode: {
            type: Boolean,
            default: false,
        },
        first: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            default: "N/A",
        }
    },
    emits: [
    ],
    data() {
        return {
            showConfig: false,
        };
    },
    computed: {

        networkList() {
            let list = [];
            for (const networkName in this.jsonObject.networks) {
                list.push(networkName);
            }
            return list;
        },

        bgStyle() {
            if (this.status === "running" || this.status === "healthy") {
                return "bg-primary";
            } else if (this.status === "unhealthy") {
                return "bg-danger";
            } else {
                return "bg-secondary";
            }
        },

        terminalRouteLink() {
            if (this.endpoint) {
                return {
                    name: "containerTerminalEndpoint",
                    params: {
                        endpoint: this.endpoint,
                        stackName: this.stackName,
                        serviceName: this.name,
                        type: "bash",
                    },
                };
            } else {
                return {
                    name: "containerTerminal",
                    params: {
                        stackName: this.stackName,
                        serviceName: this.name,
                        type: "bash",
                    },
                };
            }
        },

        endpoint() {
            return this.$parent.$parent.endpoint;
        },

        stack() {
            return this.$parent.$parent.stack;
        },

        stackName() {
            return this.$parent.$parent.stack.name;
        },

        service() {
            if (!this.jsonObject.services[this.name]) {
                return {};
            }
            return this.jsonObject.services[this.name];
        },

        jsonObject() {
            return this.$parent.$parent.jsonConfig;
        },

        envsubstJSONConfig() {
            return this.$parent.$parent.envsubstJSONConfig;
        },

        envsubstService() {
            if (!this.envsubstJSONConfig.services[this.name]) {
                return {};
            }
            return this.envsubstJSONConfig.services[this.name];
        },

        imageName() {
            if (this.envsubstService.image) {
                return this.envsubstService.image.split(":")[0];
            } else {
                return "";
            }
        },

        imageTag() {
            if (this.envsubstService.image) {
                let tag = this.envsubstService.image.split(":")[1];

                if (tag) {
                    return tag;
                } else {
                    return "latest";
                }
            } else {
                return "";
            }
        },
    },
    mounted() {
        if (this.first) {
            //this.showConfig = true;
        }
    },
    methods: {
        parsePort(port) {
            if (this.stack.endpoint) {
                return parseDockerPort(port, this.stack.primaryHostname);
            } else {
                let hostname = this.$root.info.primaryHostname || location.hostname;
                return parseDockerPort(port, hostname);
            }
        },
        remove() {
            delete this.jsonObject.services[this.name];
        },
        pause() {
            this.processing = true;

            this.$root.emitAgent(this.stack.endpoint, "pauseContainer", this.stack.name, this.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },
        unpause() {
            this.processing = true;

            this.$root.emitAgent(this.stack.endpoint, "unpauseContainer", this.stack.name, this.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },
        restart() {
            this.processing = true;

            this.$root.emitAgent(this.stack.endpoint, "restartContainer", this.stack.name, this.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },
        start() {
            this.processing = true;

            this.$root.emitAgent(this.stack.endpoint, "startContainer", this.stack.name, this.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },
        stop() {
            this.processing = true;

            this.$root.emitAgent(this.stack.endpoint, "stopContainer", this.stack.name, this.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },
        kill() {
            this.processing = true;

            this.$root.emitAgent(this.stack.endpoint, "killContainer", this.stack.name, this.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        }
    }
});
</script>

<style scoped lang="scss">
@import "../styles/vars";

.container {
    padding: 0;
    overflow: hidden;

    .image {
        font-size: 0.8rem;
        color: #6c757d;
        .tag {
            color: #33383b;
        }
    }

    > .row {
        padding: 20px;
    }

    > .function {
        display: flex;
        height: 100%;
        width: 100%;
        align-items: center;

        > a,
        > button {
            padding: 10px;
            flex-grow: 1;
            border-radius: 0;
        }
    }
}
</style>
