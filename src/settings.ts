import {App, PluginSettingTab, Setting} from "obsidian";
import FolderTocPlugin from "./main";

export interface FolderTocSettings {
  noteTitle: string;
  maxHeadingDepth: number;
  excludePatterns: string;
  showPrimaryFolderName: boolean;
}

export const DEFAULT_SETTINGS: FolderTocSettings = {
  noteTitle: "Table of content",
  maxHeadingDepth: 3,
  excludePatterns: "",
  showPrimaryFolderName: true
};

export class FolderTocSettingTab extends PluginSettingTab {
  plugin: FolderTocPlugin;

  constructor(app: App, plugin: FolderTocPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Titre de la note TOC")
      .setDesc("Nom du fichier et titre affiché pour la table des matières.")
      .addText(text => text
        .setPlaceholder("Table of content")
        .setValue(this.plugin.settings.noteTitle)
        .onChange(async (value) => {
          this.plugin.settings.noteTitle = value || DEFAULT_SETTINGS.noteTitle;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Maximum heading depth")
      .setDesc("Highest heading level (Hx) to include under each note. Default H3.")
      .addSlider(slider => slider
        .setLimits(1, 6, 1)
        .setValue(this.plugin.settings.maxHeadingDepth)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.maxHeadingDepth = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Exclude patterns")
      .setDesc("Comma-separated substrings to skip (matched against full paths). Example: img,assets")
      .addText(text => text
        .setPlaceholder("img,assets")
        .setValue(this.plugin.settings.excludePatterns)
        .onChange(async (value) => {
          this.plugin.settings.excludePatterns = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Afficher le dossier primaire")
      .setDesc("Préfixe chaque note par le dossier principal: <dossier> -> <note>.")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showPrimaryFolderName)
        .onChange(async (value) => {
          this.plugin.settings.showPrimaryFolderName = value;
          await this.plugin.saveSettings();
        }));
  }
}
