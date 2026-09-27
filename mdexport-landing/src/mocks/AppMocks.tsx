import { ChevronDown, ChevronRight, FilePlus2, FileText, Folder, FolderPlus, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
import "./mocks.css";

export type Stage = "write" | "proof" | "deliver";

/** Container that makes em-based mock UI scale with its width, like an image. */
export function Shot({
  label,
  scale,
  className,
  children,
}: {
  label: string;
  /** Container-width units per em; bigger = larger UI inside the frame. */
  scale?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`shot ${className ?? ""}`}>
      <div
        className="screen"
        role="img"
        aria-label={label}
        style={scale ? ({ "--shot": `${scale}cqw` } as React.CSSProperties) : undefined}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- editor ---------------- */

type Line = { text: ReactNode; active?: boolean };

const M = ({ children }: { children: ReactNode }) => <span className="tk-mark">{children}</span>;

export const AUTH_FLOW: Line[] = [
  {
    text: (
      <>
        <M># </M>
        <span className="tk-h">Auth flow handover</span>
      </>
    ),
  },
  { text: "" },
  {
    text: (
      <>
        Sessions expire after <M>**</M>
        <span className="tk-h">60 days</span>
        <M>**</M>. The refresh
      </>
    ),
    active: true,
  },
  { text: "job must run before that, or users are logged out." },
  { text: "" },
  {
    text: (
      <>
        <M>## </M>
        <span className="tk-h">Steps</span>
      </>
    ),
  },
  {
    text: (
      <>
        <span className="tk-acc">1.</span> Retry the request with backoff
      </>
    ),
  },
  {
    text: (
      <>
        <span className="tk-acc">2.</span> Schedule <span className="tk-str">`refreshToken()`</span> nightly
      </>
    ),
  },
  { text: "" },
  { text: <M>| Token   | Lifetime |</M> },
  { text: <M>| ------- | -------- |</M> },
  { text: "| Access  | 15 min   |" },
  { text: "| Refresh | 60 days  |" },
  { text: "" },
  { text: <M>```ts</M> },
  {
    text: (
      <>
        <span className="tk-kw">const</span> token = <span className="tk-kw">await</span> auth.
        <span className="tk-fn">refresh</span>(session);
      </>
    ),
  },
  { text: <M>```</M> },
];

export function Editor({ lines = AUTH_FLOW, find }: { lines?: Line[]; find?: boolean }) {
  return (
    <div className="m-editor">
      {find && (
        <div className="m-find">
          <span className="input focus">session</span>
          <span className="btn">Next</span>
          <span className="btn">Previous</span>
          <span className="hits">2 of 2</span>
          <span style={{ flexBasis: "100%" }} />
          <span className="input empty">Replace</span>
          <span className="btn">Replace</span>
          <span className="btn">Replace all</span>
        </div>
      )}
      <div className="m-code">
        {lines.map((line, i) => (
          <div key={i} className={`m-line${line.active ? " active" : ""}`}>
            <span className="n">{i + 1}</span>
            <span className="t">{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The same file with its "session" matches highlighted, as the find panel shows them. */
export const AUTH_FLOW_FIND: Line[] = AUTH_FLOW.map((line, i) =>
  i === 15
    ? {
        text: (
          <>
            <span className="tk-kw">const</span> token = <span className="tk-kw">await</span> auth.
            <span className="tk-fn">refresh</span>(<span className="tk-match sel">session</span>);
          </>
        ),
        active: true,
      }
    : i === 2
      ? {
          text: (
            <>
              <span className="tk-match">Session</span>s expire after <M>**</M>
              <span className="tk-h">60 days</span>
              <M>**</M>. The refresh
            </>
          ),
        }
      : { text: line.text },
);

/* ---------------- document page ---------------- */

export function Page({ short }: { short?: boolean }) {
  return (
    <div className="m-page">
      <div className="m-paper">
        <div className="h1">Auth flow handover</div>
        <p>
          Sessions expire after <b>60 days</b>. The refresh job must run before that, or users
          are logged out.
        </p>
        <div className="h2">Steps</div>
        <ol>
          <li>Retry the request with backoff</li>
          <li>
            Schedule <code>refreshToken()</code> nightly
          </li>
        </ol>
        {!short && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Lifetime</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Access</td>
                  <td>15 min</td>
                </tr>
                <tr>
                  <td>Refresh</td>
                  <td>60 days</td>
                </tr>
              </tbody>
            </table>
            <pre>
              <span className="kw">const</span> token = <span className="kw">await</span> auth.
              <span className="fn">refresh</span>(session);
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- export panel ---------------- */

export function ExportPanel() {
  return (
    <div className="m-export">
      <div className="title">Export</div>
      <p>The page on the left is what you get. Unsaved edits are included.</p>
      <div className="m-fmt on">
        <span className="radio" />
        <span>
          <b>
            PDF document<i>.pdf</i>
          </b>
          <small>A4 pages, ready to share or print.</small>
        </span>
      </div>
      <div className="m-fmt">
        <span className="radio" />
        <span>
          <b>
            Word document<i>.docx</i>
          </b>
          <small>Editable in Word, Google Docs or Pages.</small>
        </span>
      </div>
      <div className="m-fmt">
        <span className="radio" />
        <span>
          <b>
            HTML page<i>.html</i>
          </b>
          <small>One self-contained web page.</small>
        </span>
      </div>
      <div className="go">Export PDF</div>
      <div className="note">Saves as auth-flow.pdf</div>
    </div>
  );
}

/* ---------------- library tree ---------------- */

function Row({
  depth = 0,
  children,
  className,
}: {
  depth?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`m-row ${className ?? ""}`} style={{ paddingLeft: `${0.6 + depth * 1.1}em` }}>
      {children}
    </div>
  );
}

export function LibraryTree({ menu, creating }: { menu?: boolean; creating?: boolean }) {
  return (
    <div className="m-tree">
      <div className="m-search">
        <Search />
        Find a document
        <kbd>Ctrl K</kbd>
      </div>
      <div className="m-libhead">
        MDExport
        <span className={`m-plus${menu ? " open" : ""}`}>
          <Plus />
        </span>
      </div>
      {menu && (
        <div className="m-menu">
          <div>
            <FilePlus2 />
            New document
          </div>
          <div className="hi">
            <FolderPlus />
            New folder
          </div>
        </div>
      )}
      <Row>
        <FileText />
        Readme<span className="age">1w</span>
      </Row>
      <Row className="folder">
        <ChevronDown />
        backend <span className="count">3</span>
      </Row>
      <Row depth={1}>
        <FileText />
        api-design<span className="age">2h</span>
      </Row>
      <Row depth={1} className="folder">
        <ChevronDown />
        handovers <span className="count">2</span>
      </Row>
      {creating && (
        <div className="m-field" style={{ paddingLeft: "2.8em" }}>
          <Folder />
          <span>
            incidents
            <i className="m-caret" />
          </span>
        </div>
      )}
      <Row depth={2} className="on">
        <FileText />
        auth-flow<span className="m-dot" />
      </Row>
      <Row depth={2}>
        <FileText />
        payments<span className="age">1d</span>
      </Row>
      <Row className="folder">
        <ChevronRight />
        notes <span className="count">4</span>
      </Row>
    </div>
  );
}

/* ---------------- whole window ---------------- */

export const STAGES: { id: Stage; label: string }[] = [
  { id: "write", label: "Write" },
  { id: "proof", label: "Proof" },
  { id: "deliver", label: "Deliver" },
];

/** The full MDExport window at one stage. */
export function AppWindow({ stage }: { stage: Stage }) {
  return (
    <div className="m-window">
      <div className="m-titlebar">
        <span className="brand">MDExport</span>
        <span className="ctx">auth-flow</span>
        <span className="win" aria-hidden>
          <span>–</span>
          <span>□</span>
          <span>✕</span>
        </span>
      </div>
      <LibraryTree />
      <div className="m-stagebar">
        <div className="doc">
          <b>auth-flow</b>
          <small>backend / handovers / auth-flow.md · Saved</small>
        </div>
        <div className="m-tabs">
          {STAGES.map((s) => (
            <span key={s.id} className={stage === s.id ? "on" : undefined}>
              {s.label}
            </span>
          ))}
        </div>
        <span className="more" aria-hidden>
          ···
        </span>
      </div>
      <div className="m-work">
        {stage !== "deliver" && <Editor />}
        {stage !== "write" && <Page />}
        {stage === "deliver" && <ExportPanel />}
      </div>
      <div className="m-status">
        <span>Ln 3, Col 24</span>
        <span>58 words</span>
        <span>1 min read</span>
      </div>
    </div>
  );
}
