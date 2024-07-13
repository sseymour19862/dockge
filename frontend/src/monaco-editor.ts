import { App } from "vue";
import { install as VueMonacoEditorPlugin, loader } from "@guolao/vue-monaco-editor";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import yamlWorker from "monaco-yaml/yaml.worker?worker";

export function initMonacoEditor(app: App<Element>) {
    self.MonacoEnvironment = {
        getWorker(_, label) {
            switch (label) {
                case "yaml":
                    return new yamlWorker();
                default:
                    return new editorWorker();
            }
        }
    };

    monaco.editor.defineTheme("dockge", {
        "base": "vs-dark",
        "inherit": true,
        "rules": [
            {
                "background": "#0d1117",
                "token": ""
            }
        ],
        "colors": {
            "editor.background": "#0d1117"
        }
    });

    monaco.editor.defineTheme("dockge-editing", {
        "base": "vs-dark",
        "inherit": true,
        "rules": [
            {
                "background": "#2c2f38",
                "token": ""
            }
        ],
        "colors": {
            "editor.background": "#2c2f38"
        }
    });

    loader.config({ monaco });

    app.use(VueMonacoEditorPlugin);
}
