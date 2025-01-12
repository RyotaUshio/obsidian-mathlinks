import { FileView, Plugin, WorkspaceLeaf, loadMathJax } from "obsidian";
import { MathLinksSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { MathLinksSettingTab } from "./settings/tab"
import { MathLinksAPIAccount } from "./api/api";
import { generateMathLinks } from "./links/reading";
import { buildLivePreview } from "./links/preview";
import { isExcluded } from "./utils";

export default class MathLinks extends Plugin {
    settings: MathLinksSettings;
    apiAccounts: MathLinksAPIAccount[];

    async onload() {
        await this.loadSettings();
        await loadMathJax();

        // Markdown Post Processor for reading view
        this.registerMarkdownPostProcessor((element, context) => {
            let file = this.app.vault.getAbstractFileByPath(context.sourcePath);
            if (file && isExcluded(this, file)) {
                generateMathLinks(this, element, context);
            }
        });

        // Live-preview; update all when Obsidian launches
        this.app.workspace.onLayoutReady(() => {
            this.app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
                if (leaf.view instanceof FileView && leaf.view.file && isExcluded(this, leaf.view.file)) {
                    buildLivePreview(this, leaf).then((livePreview) => {
                        this.registerEditorExtension(livePreview);
                    });
                }
            });
        });

        // Live-preview; update on leaf-change
        this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf) => {
            if (leaf.view instanceof FileView && leaf.view.file && isExcluded(this, leaf.view.file)) {
                buildLivePreview(this, leaf).then((livePreview) => {
                    this.registerEditorExtension(livePreview);
                });
            }
        });

        this.apiAccounts = [];
    }

    getAPIAccount<UserPlugin extends Plugin>(userPlugin: Readonly<UserPlugin>): MathLinksAPIAccount {
        let account = this.apiAccounts.find((account) => account.manifest.id == userPlugin.manifest.id);
        if (account) return account;

        account = new MathLinksAPIAccount(this, userPlugin.manifest, DEFAULT_SETTINGS.blockPrefix, () => null);
        this.apiAccounts.push(account);
        return account;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addSettingTab(new MathLinksSettingTab(this.app, this));
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
