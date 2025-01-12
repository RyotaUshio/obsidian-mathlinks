import { Setting, PluginSettingTab, Notice, App } from "obsidian";
import { TextComponent, DropdownComponent, ToggleComponent, ButtonComponent } from "obsidian"
import { TemplatesModal, ExcludeModal } from "./modals"
import MathLinks from "../main"

export class MathLinksSettingTab extends PluginSettingTab {
    constructor(app: App, public plugin: MathLinks) {
        super(app, plugin);
    }

    async display(): Promise<void> {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl("h2", { text: "MathLinks Settings" });

        // Templates
        new Setting(containerEl)
            .setName("Templates")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({ text: "Generate mathLinks with a template. Use " });
                    e.createEl("code", { text: "mathLink: auto" });
                    e.createSpan({ text: " to use templates in a file." });
                })
            )
            .addButton((button: ButtonComponent): ButtonComponent => {
                return button.setButtonText("Manage").onClick(async () => {
                    let modal = new TemplatesModal(this.app, this.plugin);
                    modal.open();
                    modal.onClose = async () => {
                        await this.plugin.saveSettings().then(() => {
                            this.display();
                        });
                    };
                });
            });

        // Excluded files
        new Setting(containerEl)
            .setName("Excluded files")
            .setDesc("Manage files/paths that MathLinks will ignore.")
            .addButton((button: ButtonComponent): ButtonComponent => {
                return button.setButtonText("Manage").onClick(async () => {
                    let modal = new ExcludeModal(this.app, this.plugin);
                    modal.open();
                    modal.onClose = async () => {
                        await this.plugin.saveSettings().then(() => {
                            this.display();
                        });
                    };
                });
            });

        // Block links
        let prefix: TextComponent;
        new Setting(containerEl)
            .setName("Edit prefix for block links")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({ text: "Links like " });
                    e.createEl("code", { text: "note#^block-id" });
                    e.createSpan({ text: " will be rendered as" });
                    if (this.plugin.settings.enableFileNameBlockLinks) {
                        e.createEl("code", { text: "note > " + this.plugin.settings.blockPrefix + "block-id" });
                    } else {
                        e.createEl("code", { text: this.plugin.settings.blockPrefix + "block-id" });
                    }
                    e.createSpan({ text: "." });
                })
            )
            .addText((text) => {
                prefix = text;
                prefix.setValue(this.plugin.settings.blockPrefix).onChange(async (current: string) => {
                    this.plugin.settings.blockPrefix = current;
                    await this.plugin.saveSettings();
                });
                prefix.setPlaceholder("No prefix (default: ^)");
            })
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.enableFileNameBlockLinks)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.enableFileNameBlockLinks = value;
                        await this.plugin.saveSettings().then(() => {
                            this.display();
                        });
                    });
                toggle.setTooltip("Disable to ignore note name.");
            });

        // Enable API
        new Setting(containerEl)
            .setName("Enable MathLinks API")
            .setDesc(
                createFragment((e) => {
                    let accounts = this.plugin.apiAccounts;
                    e.createSpan({ text: "Allow other community plugins to use MathLinks." });
                    if (accounts.length) {
                        let list = e.createEl("ul");
                        for (let account of accounts) {
                            list.createEl("li", { text: account.manifest.name });
                        }
                    }
                })
            ).addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.enableAPI)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.enableAPI = value;
                        await this.plugin.saveSettings().then(() => {
                            this.display();
                        });
                    })
            });
    }
}
