import { App, BlockSubpathResult, HeadingSubpathResult, MarkdownView, PluginManifest, TFile, WorkspaceLeaf } from 'obsidian';
import MathLinks from '../main';

export interface MathLinksMetadata {
    "mathLink"?: string;
    "mathLink-blocks"?: Record<string, string>;
}

export type MathLinksMetadataSet = Map<TFile, MathLinksMetadata>;

export class MathLinksAPIAccount {
    metadataSet: MathLinksMetadataSet;

    constructor(public plugin: MathLinks, public manifest: Readonly<PluginManifest>, public blockPrefix: string, public prefixer: (sourceFile: TFile, targetFile: TFile, subpathResult: HeadingSubpathResult | BlockSubpathResult) => string | null) {
        this.metadataSet = new Map();
    }

    get(file: TFile, blockID?: string): string | undefined {
        // If blockID === undefined, return mathLink
        // If blockID is given, return the corresponding item of mathLink-blocks
        let metadata = this.metadataSet.get(file);
        if (metadata) {
            if (blockID === undefined) {
                return metadata["mathLink"];
            }
            let blocks = metadata["mathLink-blocks"];
            if (blocks) {
                return blocks[blockID];
            }
        }
    }

    update(file: TFile, newMetadata: MathLinksMetadata): void {
        if (file.extension == "md") {
            this.metadataSet.set(file, Object.assign({}, this.metadataSet.get(file), newMetadata));
            informChange(this.plugin.app, "mathlinks:updated", this, file);
        } else {
            throw Error(`MathLinks API: ${this.manifest.name} passed a non-markdown file ${file.path} to update().`);
        }
    }

    delete(file: TFile, which?: string): void {
        // `which === undefined`: remove all the mathLinks associated with `path`
        // `which == "mathLink": remove `mathLink`
        // `which == "mathLink-blocks": remove `mathLink-blocks`
        // `which == <blockID>`: remove `mathLink-blocks[<blockID>]`
        let metadata = this.metadataSet.get(file);
        if (metadata) {
            if (which === undefined) {
                this.metadataSet.delete(file);
            } else if (which == "mathLink" || which == "mathLink-blocks") {
                if (metadata[which] !== undefined) {
                    delete metadata[which];
                } else {
                    throw Error(`MathLinks API: ${this.manifest.name} attempted to delete ${which} of ${file.path}, but it does not exist.`);
                }
            } else {
                let blocks = metadata["mathLink-blocks"];
                if (blocks && blocks[which] !== undefined) {
                    delete blocks[which];
                } else {
                    throw Error(`MathLinks API: ${this.manifest.name} attempted to delete mathLink-blocks for ${file.path}#^${which}", but it does not exist`);
                }
            }
        } else {
            throw Error(`MathLinks API: ${this.manifest.name} attempted to delete the MathLinks metadata of ${file.path}, but it does not exist.`);
        }
        informChange(this.plugin.app, "mathlinks:updated", this, file);
    }
}

// eventName: "mathlinks:updated" | "mathlinks:account-deleted"
export function informChange(app: App, eventName: string, ...callbackArgs: [apiAccount: MathLinksAPIAccount, file?: TFile]) {
    // trigger an event informing this update
    app.metadataCache.trigger(eventName, ...callbackArgs);

    // refresh mathLinks display based on the new metadata
    app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
        if (leaf.view instanceof MarkdownView && leaf.view.getMode() == 'source') {
            leaf.view.editor.cm?.dispatch();
        }
    });
}
