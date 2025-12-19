import {Notice, Plugin, TAbstractFile, TFile, TFolder} from "obsidian";
import {DEFAULT_SETTINGS, FolderTocSettingTab, FolderTocSettings} from "./settings";

const DEFAULT_TOC_TITLE = "Table of content";

type Heading = { level: number; text: string };

export default class FolderTocPlugin extends Plugin {
  settings: FolderTocSettings;

  async onload() {
    await this.loadSettings();

    this.registerFileMenuItem();
    this.addSettingTab(new FolderTocSettingTab(this.app, this));

    this.addCommand({
      id: "toc-maker",
      name: "Generate TOC for active file's folder",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice("No active file found.");
          return;
        }

        const parent = activeFile.parent;
        if (!parent || !(parent instanceof TFolder)) {
          new Notice("Active file has no parent folder.");
          return;
        }

        await this.generateToc(parent);
      }
    });
  }

  onunload() {}

  private registerFileMenuItem() {
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file: TAbstractFile) => {
      if (file instanceof TFolder) {
        menu.addItem(item => item
          .setTitle("Generate TOC")
          .setIcon("list")
          .onClick(async () => {
            await this.generateToc(file);
          }));
      }
    }));
  }

  private async generateToc(folder: TFolder) {
    const tocTitle = this.getTocTitle();
    const tocPath = this.buildTocPath(folder, tocTitle);
    const targetFiles = this.collectMarkdownFiles(folder, tocPath);

    if (!targetFiles.length) {
      new Notice("No markdown files found in folder.");
      return;
    }

    const lines: string[] = [`# ${tocTitle}`, ""];

    for (const file of targetFiles) {
      const display = this.formatNoteDisplay(folder, file);
      lines.push(`- [[${this.toLinkPath(file)}|${display}]]`);

      const headings = await this.extractHeadings(file);
      for (const heading of headings) {
        const indent = "\t".repeat(Math.max(1, heading.level));
        const headingTarget = `${this.toLinkPath(file)}#${heading.text}`;
        lines.push(`${indent}- [[${headingTarget}|${heading.text}]]`);
      }
    }

    const content = lines.join("\n");

    const existing = this.app.vault.getAbstractFileByPath(tocPath);
    if (existing && !(existing instanceof TFile)) {
      new Notice("A folder or non-markdown item blocks the TOC path.");
      return;
    }

    try {
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, content);
      } else {
        await this.app.vault.create(tocPath, content);
      }
      new Notice("Table of content updated.");
    } catch (error) {
      console.error(error);
      new Notice("Failed to write Table of content note.");
    }
  }

  private collectMarkdownFiles(folder: TFolder, tocPath: string): TFile[] {
    const prefix = folder.path ? `${folder.path}/` : "";
    const excluded = this.parseExcludePatterns();

    return this.app.vault.getMarkdownFiles()
      .filter(file => file.path.startsWith(prefix))
      .filter(file => file.path !== tocPath)
      .filter(file => !this.matchesExclude(file.path, excluded))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  private async extractHeadings(file: TFile): Promise<Heading[]> {
    const content = await this.app.vault.cachedRead(file);
    const regex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Heading[] = [];
    const maxDepth = this.clampHeadingDepth(this.settings.maxHeadingDepth);

    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const hashes = match[1];
      const headingText = match[2];
      if (!hashes || !headingText) {
        continue;
      }

      const level = hashes.length;
      if (level > maxDepth) {
        continue;
      }
      headings.push({level, text: headingText.trim()});
    }

    return headings;
  }

  private clampHeadingDepth(depth: number): number {
    if (Number.isNaN(depth)) return 3;
    return Math.min(Math.max(depth, 1), 6);
  }

  private formatNoteDisplay(folder: TFolder, file: TFile): string {
    const title = this.getNoteTitle(file);
    if (!this.settings.showPrimaryFolderName) {
      return title;
    }
    const primary = this.getPrimaryFolderName(folder, file);
    if (!primary) {
      return title;
    }
    return `${primary} -> ${title}`;
  }

  private getNoteTitle(file: TFile): string {
    const base = file.name.replace(/\.md$/i, "");
    return base;
  }

  private getPrimaryFolderName(root: TFolder, file: TFile): string {
    const rootPrefix = root.path ? `${root.path}/` : "";
    const relative = file.path.startsWith(rootPrefix) ? file.path.slice(rootPrefix.length) : file.path;
    const parts = relative.split("/");
    if (parts.length > 1) {
      return parts[parts.length - 2] ?? "";
    }
    return root.name ?? "";
  }

  private toLinkPath(file: TFile): string {
    return file.path.replace(/\.md$/i, "");
  }

  private buildTocPath(folder: TFolder, tocTitle: string): string {
    const filename = this.toSafeFileName(`${tocTitle}.md`);
    return folder.path ? `${folder.path}/${filename}` : filename;
  }

  private getTocTitle(): string {
    const title = (this.settings.noteTitle || "").trim();
    return title || DEFAULT_TOC_TITLE;
  }

  private parseExcludePatterns(): string[] {
    return this.settings.excludePatterns
      .split(",")
      .map(pattern => pattern.trim())
      .filter(Boolean);
  }

  private toSafeFileName(name: string): string {
    const cleaned = name.replace(/[\\/:*?"<>|]/g, "-").trim();
    return cleaned || `${DEFAULT_TOC_TITLE}.md`;
  }

  private matchesExclude(path: string, patterns: string[]): boolean {
    const lowerPath = path.toLowerCase();
    return patterns.some(pattern => lowerPath.includes(pattern.toLowerCase()));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<FolderTocSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
