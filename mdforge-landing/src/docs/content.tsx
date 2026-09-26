import { C, H3, Keys, Note, OL, P, Pre, Section, Table, UI, UL } from "@/docs/prose";
import { REPO_URL } from "@/lib/release";

/** Sidebar entries, in page order. Keep ids in sync with the sections below. */
export const DOC_SECTIONS = [
  { id: "install", title: "Install" },
  { id: "first-launch", title: "First launch" },
  { id: "stages", title: "Write, Proof, Deliver" },
  { id: "library", title: "The library" },
  { id: "saving", title: "Saving and autosave" },
  { id: "export", title: "Exporting" },
  { id: "markdown", title: "Supported Markdown" },
  { id: "shortcuts", title: "Keyboard shortcuts" },
  { id: "privacy", title: "Files and privacy" },
  { id: "build", title: "Build from source" },
  { id: "troubleshooting", title: "Troubleshooting" },
] as const;

/** Same list as the app's shortcut sheet (Ctrl+/). Ctrl is Cmd on macOS. */
const SHORTCUTS: [string, [string, readonly string[]][]][] = [
  [
    "Navigation",
    [
      ["Quick switcher (type > for commands)", ["Ctrl", "K"]],
      ["Quick switcher (alternative)", ["Ctrl", "P"]],
      ["Previous document in the library", ["Ctrl", "Page Up"]],
      ["Next document in the library", ["Ctrl", "Page Down"]],
      ["Settings", ["Ctrl", ","]],
      ["All keyboard shortcuts", ["Ctrl", "/"]],
    ],
  ],
  [
    "Documents",
    [
      ["New document", ["Ctrl", "N"]],
      ["Open file", ["Ctrl", "O"]],
      ["Save", ["Ctrl", "S"]],
      ["Save as", ["Ctrl", "Shift", "S"]],
      ["Rename document", ["F2"]],
      ["Go to Deliver (export)", ["Ctrl", "E"]],
    ],
  ],
  [
    "Editor",
    [
      ["Switch between Write and Proof", ["Ctrl", "\\"]],
      ["Find", ["Ctrl", "F"]],
      ["Find and replace", ["Ctrl", "H"]],
      ["Bold", ["Ctrl", "B"]],
      ["Italic", ["Ctrl", "I"]],
      ["Undo", ["Ctrl", "Z"]],
      ["Redo", ["Ctrl", "Shift", "Z"]],
      ["Move line up / down", ["Alt", "↑ / ↓"]],
    ],
  ],
];

const SAMPLE = `# Release checklist

Ship **v0.2** after the ~~Friday~~ Monday review.

- [x] Update the changelog
- [ ] Tag the release[^1]

| Step   | Owner |
| ------ | ----- |
| Build  | CI    |
| Notes  | Ana   |

\`\`\`ts
const tag = await git.tag("v0.2.0");
\`\`\`

[^1]: Tags trigger the installer builds.`;

const BUILD = `git clone ${REPO_URL}.git
cd MDforge
pnpm install
pnpm tauri dev      # run with hot reload
pnpm tauri build    # installers in src-tauri/target/release/bundle/`;

const LINUX_DEPS = `sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \\
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`;

export function DocsContent() {
  return (
    <>
      <Section id="install" title="Install">
        <P>
          Download the installer for your system from the{" "}
          <a className="text-text underline decoration-line-strong underline-offset-4 hover:decoration-accent" href={`${REPO_URL}/releases/latest`}>
            latest release
          </a>
          . MDForge runs fully offline and needs no account.
        </P>
        <Table
          head={["System", "File", "Notes"]}
          rows={[
            ["Windows 10 / 11", <C>…_x64-setup.exe</C>, "Or the .msi for managed installs."],
            ["macOS (Apple Silicon)", <C>…_aarch64.dmg</C>, "M1 and newer."],
            ["macOS (Intel)", <C>…_x64.dmg</C>, "Intel Macs."],
            ["Debian / Ubuntu", <C>…_amd64.deb</C>, <C>sudo apt install ./MDForge_*.deb</C>],
            ["Any Linux", <C>…_amd64.AppImage</C>, <><C>chmod +x</C> the file, then run it.</>],
            ["Fedora / openSUSE", <C>….x86_64.rpm</C>, <C>sudo dnf install ./MDForge-*.rpm</C>],
          ]}
        />
        <Note title="The builds aren't code-signed yet">
          Your system asks once before the first launch. On Windows, SmartScreen shows a
          warning: choose <UI>More info → Run anyway</UI>. On macOS, right-click the app and
          choose <UI>Open</UI>, then <UI>Open</UI> again.
        </Note>
      </Section>

      <Section id="first-launch" title="First launch">
        <P>
          MDForge asks where to keep your documents. This folder is your <UI>library</UI>:
          every Markdown file inside it shows up in the file tree on the left.
        </P>
        <UL>
          <li>
            <UI>Use this folder</UI> creates <C>Documents/MDForge</C> in your home folder.
          </li>
          <li>
            <UI>Choose folder…</UI> lets you pick an existing one, for example a <C>docs/</C>{" "}
            folder inside a project.
          </li>
          <li>
            Change it any time in <UI>Settings</UI> (<Keys keys={["Ctrl", ","]} />).
          </li>
        </UL>
      </Section>

      <Section id="stages" title="Write, Proof, Deliver">
        <P>
          Every document moves through three stages. Switch with the tabs in the document
          header.
        </P>
        <Table
          head={["Stage", "What you see", "Shortcut"]}
          rows={[
            [<UI>Write</UI>, "The editor, full width.", <Keys keys={["Ctrl", "\\"]} />],
            [
              <UI>Proof</UI>,
              "The editor beside the rendered page. The page scrolls along with the editor.",
              <Keys keys={["Ctrl", "\\"]} />,
            ],
            [
              <UI>Deliver</UI>,
              "The finished page beside the export panel (PDF, Word, HTML).",
              <Keys keys={["Ctrl", "E"]} />,
            ],
          ]}
        />
        <P>
          <Keys keys={["Ctrl", "\\"]} /> flips between Write and Proof. MDForge remembers the
          last stage you used.
        </P>
      </Section>

      <Section id="library" title="The library">
        <P>
          The tree lists every <C>.md</C> and <C>.markdown</C> file in your library folder,
          with folders you can collapse and how long ago each document changed. A dot means
          unsaved changes.
        </P>
        <H3>Create documents and folders</H3>
        <UL>
          <li>
            The <UI>+</UI> next to the library name offers <UI>New document</UI> and{" "}
            <UI>New folder</UI>. They are created next to the open document, or at the top
            of the library.
          </li>
          <li>
            Right-click a folder, a document, the library name or empty space for the same
            options in that place.
          </li>
          <li>
            A name field appears in the tree. <UI>Enter</UI> creates it, <UI>Esc</UI>{" "}
            cancels. <C>.md</C> is added for you.
          </li>
          <li>
            <Keys keys={["Ctrl", "N"]} /> skips the name and creates <C>Untitled.md</C>{" "}
            straight away, handy for pasting.
          </li>
        </UL>
        <H3>Rename, copy the path, trash</H3>
        <UL>
          <li>
            <Keys keys={["F2"]} /> or right-click → <UI>Rename</UI> edits the name in place.
            Names can't contain <C>/ \ : * ? " &lt; &gt; |</C> and can be up to 64
            characters.
          </li>
          <li>
            <UI>Move to trash</UI> sends documents and folders to your system trash, so you
            can restore them. MDForge asks first.
          </li>
          <li>
            Files you open from elsewhere (<Keys keys={["Ctrl", "O"]} />) appear under{" "}
            <UI>Outside library</UI>.
          </li>
        </UL>
        <H3>Finding things</H3>
        <P>
          <Keys keys={["Ctrl", "K"]} /> opens the quick switcher: type part of a name to jump
          to it, or start with <C>&gt;</C> to run a command.
        </P>
        <Note title="What gets scanned">
          Up to 8 folder levels and 5,000 documents. Hidden folders, symlinks,{" "}
          <C>node_modules</C> and <C>target</C> are skipped. The tree refreshes when the window
          gets focus, so files you add in your editor or with git show up.
        </Note>
      </Section>

      <Section id="saving" title="Saving and autosave">
        <UL>
          <li>
            <UI>Autosave</UI> saves a second after you stop typing. Turn it off in{" "}
            <UI>Settings → Editing</UI>. <Keys keys={["Ctrl", "S"]} /> always saves.
          </li>
          <li>
            Closing the window never loses edits: with autosave on, pending changes are saved
            first. With it off, MDForge asks <UI>Save and close</UI>,{" "}
            <UI>Close without saving</UI> or <UI>Cancel</UI>.
          </li>
          <li>
            If a file changed on disk since you opened it (say, after a <C>git pull</C>),
            saving stops and asks: <UI>Reload from disk</UI>, <UI>Save as copy</UI> or{" "}
            <UI>Overwrite</UI>.
          </li>
          <li>On the next launch MDForge reopens the document you were working on.</li>
        </UL>
      </Section>

      <Section id="export" title="Exporting">
        <OL>
          <li>
            Open <UI>Deliver</UI> (<Keys keys={["Ctrl", "E"]} />).
          </li>
          <li>Pick PDF, Word or HTML.</li>
          <li>
            Click <UI>Export</UI> and choose where to save. A notice offers to open the file.
          </li>
        </OL>
        <P>
          Exports use the text in the editor, saved or not, so pasted Markdown can be exported
          straight away.
        </P>
        <Table
          head={["Format", "Details"]}
          rows={[
            [
              <UI>PDF</UI>,
              "A4 pages. Fonts (Noto Sans, Noto Emoji) are bundled, so it looks the same everywhere. Wide tables balance their columns and long code lines wrap.",
            ],
            [<UI>Word (.docx)</UI>, "Editable in Word, Google Docs, LibreOffice and Pages."],
            [<UI>HTML</UI>, "One self-contained page with its styles included."],
          ]}
        />
        <Note title="Images">
          Images aren't embedded in PDF and Word exports yet. They appear as{" "}
          <C>[Image: alt text]</C>, so give them useful alt text.
        </Note>
      </Section>

      <Section id="markdown" title="Supported Markdown">
        <P>
          MDForge uses GitHub Flavored Markdown. The preview and all three exports come from the
          same parser, so what you proof is what you export.
        </P>
        <UL>
          <li>Headings, bold, italic, strikethrough, links and autolinks</li>
          <li>Bulleted, numbered and task lists</li>
          <li>Tables, block quotes and horizontal rules</li>
          <li>Fenced code blocks with syntax highlighting (add the language after ```)</li>
          <li>Footnotes</li>
        </UL>
        <Pre label="example.md">{SAMPLE}</Pre>
        <P>
          Raw HTML in a document is not rendered, and <C>javascript:</C> links are removed.
          That keeps documents you receive from others safe to open.
        </P>
      </Section>

      <Section id="shortcuts" title="Keyboard shortcuts">
        <P>
          Ctrl is Cmd on macOS. <Keys keys={["Ctrl", "/"]} /> shows this list inside the app.
        </P>
        {SHORTCUTS.map(([group, items]) => (
          <div key={group} className="space-y-3">
            <H3>{group}</H3>
            <Table
              head={["Action", "Keys"]}
              widths={["62%", "38%"]}
              rows={items.map(([label, keys]) => [label, <Keys keys={keys} />])}
            />
          </div>
        ))}
      </Section>

      <Section id="privacy" title="Files and privacy">
        <UL>
          <li>
            Documents are plain <C>.md</C> files. Grep them, diff them, commit them.
          </li>
          <li>MDForge makes no network requests. No account, no telemetry, no cloud.</li>
          <li>
            Saves are atomic (written to a temporary file, then renamed), so a crash can't
            leave half a file.
          </li>
          <li>
            The app can only read and write inside your library folder and files you pick in a
            dialog.
          </li>
        </UL>
        <Table
          head={["System", "Settings file"]}
          rows={[
            ["Linux", <C>~/.config/dev.mdforge.app/config.json</C>],
            ["macOS", <C>~/Library/Application Support/dev.mdforge.app/config.json</C>],
            ["Windows", <C>%APPDATA%\dev.mdforge.app\config.json</C>],
          ]}
        />
      </Section>

      <Section id="build" title="Build from source">
        <P>
          You need Rust (stable), Node.js 20+ and pnpm 10+. On Linux, install the WebKitGTK
          libraries first:
        </P>
        <Pre label="Debian / Ubuntu">{LINUX_DEPS}</Pre>
        <Pre label="Build">{BUILD}</Pre>
        <P>
          <C>pnpm check</C> runs formatting, lint, type checks, the frontend tests and the Rust
          tests. Other platforms: see the{" "}
          <a className="text-text underline decoration-line-strong underline-offset-4 hover:decoration-accent" href="https://tauri.app/start/prerequisites/">
            Tauri prerequisites
          </a>
          .
        </P>
      </Section>

      <Section id="troubleshooting" title="Troubleshooting">
        <H3>macOS says the app "can't be opened"</H3>
        <P>
          Right-click MDForge in Applications and choose <UI>Open</UI>. You only need to do this
          once.
        </P>
        <H3>The AppImage doesn't start</H3>
        <P>
          AppImages need FUSE. On Ubuntu 24.04: <C>sudo apt install libfuse2t64</C>. Or use the{" "}
          <C>.deb</C> instead.
        </P>
        <H3>Blank or flickering window on Linux with an NVIDIA GPU</H3>
        <P>Start MDForge with the DMA-BUF renderer turned off:</P>
        <Pre>WEBKIT_DISABLE_DMABUF_RENDERER=1 mdforge</Pre>
        <H3>A document is missing from the tree</H3>
        <P>
          Check that it ends in <C>.md</C> or <C>.markdown</C> and isn't in a hidden folder,{" "}
          <C>node_modules</C> or <C>target</C>. Switching away from the window and back
          rescans the library.
        </P>
        <H3>Something else</H3>
        <P>
          <a className="text-text underline decoration-line-strong underline-offset-4 hover:decoration-accent" href={`${REPO_URL}/issues`}>
            Open an issue
          </a>{" "}
          with your system, the MDForge version (Settings → About) and what you expected.
        </P>
      </Section>
    </>
  );
}
