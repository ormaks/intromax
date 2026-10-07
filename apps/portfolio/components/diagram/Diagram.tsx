import { cn } from "@intromax/ui";
import type { ReactNode } from "react";
import type { DiagramId } from "@/constants/experience";

type BoxProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  dashed?: boolean;
  children?: ReactNode;
};

/* A thin outlined box, with its label children drawn on top. */
function Box({ x, y, width, height, dashed = false, children }: BoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
        className={cn(
          "fill-none stroke-accent/60",
          dashed && "[stroke-dasharray:4_4]",
        )}
      />
      {children}
    </g>
  );
}

/** A connector whose dashes slowly travel from start to end. */
function Flow({ d }: { d: string }) {
  return (
    <path
      d={d}
      className="animate-[trace-flow_1.6s_linear_infinite] fill-none stroke-accent/50 [stroke-dasharray:4_12]"
    />
  );
}

function Label({
  x,
  y,
  children,
  accent = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      className={cn(
        "font-mono text-[14px]",
        accent ? "fill-accent" : "fill-foreground",
      )}
    >
      {children}
    </text>
  );
}

/* Centred text, used for box titles and connector captions. */
function Caption({
  x,
  y,
  children,
  tone = "foreground",
}: {
  x: number;
  y: number;
  children: ReactNode;
  tone?: "foreground" | "subtle" | "accent";
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className={cn(
        "font-mono",
        tone === "foreground" && "fill-foreground text-[14px]",
        tone === "subtle" && "fill-subtle text-[12px]",
        tone === "accent" && "fill-accent text-[14px]",
      )}
    >
      {children}
    </text>
  );
}

/*
 * The WorkJam platform: where people open it (browser, Teams, the mobile
 * apps), the monorepo behind it, the chat that lives on its own server, and
 * the services underneath.
 */
function Platform() {
  return (
    <>
      <Box x={20} y={8} width={180} height={46}>
        <Caption x={110} y={36}>
          Browser
        </Caption>
      </Box>
      <Box x={220} y={8} width={180} height={46}>
        <Caption x={310} y={36}>
          Microsoft Teams
        </Caption>
      </Box>
      <Box x={440} y={8} width={200} height={46}>
        <Caption x={540} y={36}>
          iOS / Android apps
        </Caption>
      </Box>

      <rect
        x={20}
        y={96}
        width={380}
        height={196}
        rx={3}
        className="fill-none stroke-border"
      />
      <text x={32} y={116} className="fill-subtle font-mono text-[12px]">
        WorkJam monorepo
      </text>
      <Box x={36} y={126} width={170} height={100}>
        <Caption x={121} y={150}>
          Module apps
        </Caption>
        <Caption x={121} y={168} tone="subtle">
          Angular
        </Caption>
        <Box x={48} y={182} width={146} height={32} dashed>
          <Caption x={121} y={203} tone="accent">
            React features
          </Caption>
        </Box>
      </Box>
      <Box x={218} y={126} width={166} height={100}>
        <Caption x={301} y={150}>
          Unified app
        </Caption>
        <Caption x={301} y={168} tone="subtle">
          React
        </Caption>
      </Box>
      <Box x={36} y={240} width={348} height={38}>
        <Caption x={210} y={264}>
          Shared packages · Design system
        </Caption>
      </Box>

      <Box x={440} y={126} width={200} height={100} dashed>
        <Caption x={540} y={156} tone="accent">
          Chat app
        </Caption>
        <Caption x={540} y={178} tone="subtle">
          separate project
        </Caption>
        <Caption x={540} y={196} tone="subtle">
          web app in a WebView
        </Caption>
      </Box>

      <Box x={20} y={334} width={220} height={46}>
        <Caption x={130} y={362}>
          GraphQL · REST APIs
        </Caption>
      </Box>
      <Box x={260} y={334} width={140} height={46}>
        <Caption x={330} y={362}>
          Gemini AI
        </Caption>
      </Box>
      <Box x={440} y={334} width={200} height={46}>
        <Caption x={540} y={362}>
          Chat server
        </Caption>
      </Box>

      <Flow d="M110 54 V96" />
      <Flow d="M310 54 V96" />
      <Caption x={368} y={80} tone="subtle">
        Teams context
      </Caption>
      <Flow d="M470 54 L400 110" />
      <Flow d="M590 54 V126" />
      <Caption x={622} y={92} tone="subtle">
        bridge
      </Caption>
      <Flow d="M130 292 V334" />
      <Flow d="M330 292 V334" />
      <Flow d="M540 226 V334" />
      <Caption x={575} y={284} tone="subtle">
        sockets
      </Caption>
    </>
  );
}

/* The native app and the web chat in its WebView, talking through a bridge. */
function ChatBridge() {
  const lanes = [
    { y: 74, label: "auth sync" },
    { y: 104, label: "sockets" },
    { y: 134, label: "media events" },
  ];

  return (
    <>
      <Box x={6} y={40} width={128} height={120}>
        <Label x={18} y={64}>
          iOS / Android
        </Label>
        <Label x={18} y={82}>
          app
        </Label>
      </Box>
      <Box x={306} y={40} width={128} height={120}>
        <Label x={318} y={64} accent>
          Chat app
        </Label>
        <Label x={318} y={82}>
          in a WebView
        </Label>
      </Box>
      <Box x={160} y={52} width={120} height={96} dashed>
        <text
          x={220}
          y={44}
          textAnchor="middle"
          className="fill-subtle font-mono text-[13px]"
        >
          bridge
        </text>
        {lanes.map(({ y, label }) => (
          <text
            key={label}
            x={220}
            y={y - 8}
            textAnchor="middle"
            className="fill-foreground font-mono text-[13px]"
          >
            {label}
          </text>
        ))}
      </Box>
      {lanes.map(({ y, label }) => (
        <g key={label}>
          <Flow d={`M134 ${y} H306`} />
          <Flow d={`M306 ${y + 6} H134`} />
        </g>
      ))}
    </>
  );
}

const DIAGRAMS: Record<
  DiagramId,
  {
    viewBox: string;
    label: string;
    Body: () => ReactNode;
    /** Below this width the diagram scrolls sideways rather than shrink its text. */
    minWidth: string;
  }
> = {
  platform: {
    viewBox: "0 0 660 390",
    label:
      "WorkJam platform diagram: people open it in a browser, in Microsoft Teams and in the iOS and Android apps. Behind them is one monorepo of Angular module apps with React features inside, a React unified app, and shared packages with the design system, on GraphQL and REST APIs and Gemini AI. The chat is a separate web app on its own server, shown in the mobile apps through a WebView bridge.",
    Body: Platform,
    minWidth: "min-w-[34rem]",
  },
  chatBridge: {
    viewBox: "0 0 440 180",
    label:
      "Chat bridge diagram: the native iOS and Android app and the chat app in a WebView exchange auth sync, socket and media events through a bridge.",
    Body: ChatBridge,
    minWidth: "min-w-[20rem]",
  },
};

/** A small architecture sketch in the site's thin-line style. */
export function Diagram({
  id,
  className,
}: {
  id: DiagramId;
  className?: string;
}) {
  const { viewBox, label, Body, minWidth } = DIAGRAMS[id];

  return (
    // Focusable so keyboard users can scroll it sideways where it overflows.
    <div
      tabIndex={0}
      role="region"
      aria-label={`${label.split(":")[0]}, scrolls sideways on small screens`}
      className={cn("overflow-x-auto", className)}
    >
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={label}
        className={cn("h-auto w-full", minWidth)}
      >
        <Body />
      </svg>
    </div>
  );
}
