"use client";

import { useGSAP } from "@gsap/react";
import { cn } from "@intromax/ui";
import gsap from "gsap";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent,
} from "react";
import {
  EnvelopeIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TelegramIcon,
  type IconProps,
} from "@/components/icons";

gsap.registerPlugin(useGSAP);

/* How far an icon follows the pointer, as a share of the pointer's offset. */
const PULL = 0.35;
/* Milliseconds per typed character of a channel's handle. */
const TYPE_MS = 25;

type Channel = {
  name: string;
  handle: string;
  href: string;
  Icon: ComponentType<IconProps>;
};

const CHANNELS: Channel[] = [
  {
    name: "GitHub",
    handle: "github.com/ormaks",
    href: "https://github.com/ormaks",
    Icon: GithubIcon,
  },
  {
    name: "Email",
    handle: "maks.chytailo@gmail.com",
    href: "mailto:maks.chytailo@gmail.com",
    Icon: EnvelopeIcon,
  },
  {
    name: "LinkedIn",
    handle: "linkedin.com/in/ormaks",
    href: "https://www.linkedin.com/in/ormaks/",
    Icon: LinkedinIcon,
  },
  {
    name: "Instagram",
    handle: "@maks_chytailo",
    href: "https://www.instagram.com/maks_chytailo",
    Icon: InstagramIcon,
  },
  {
    name: "Telegram",
    handle: "@ormaks",
    href: "https://t.me/ormaks",
    Icon: TelegramIcon,
  },
];

/** Types `text` out one character at a time from when it mounts. */
function TypedHandle({ name, text }: { name: string; text: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Once the text is complete the updates are no-ops React skips; the
    // interval ends when the line unmounts.
    const timer = window.setInterval(() => {
      setCount((current) => Math.min(current + 1, text.length));
    }, TYPE_MS);
    return () => window.clearInterval(timer);
  }, [text]);

  return (
    <>
      <span className="text-accent">{name}</span> {text.slice(0, count)}
    </>
  );
}

/**
 * Ways to reach Maks, as a row of round icon links. With a mouse, each icon
 * leans toward the pointer and springs back when it leaves. Hovering or
 * focusing one lights it up and types its handle out under the row.
 */
export function ContactChannels({ className }: { className?: string }) {
  const scope = useRef<HTMLDivElement>(null);
  // Hover and keyboard focus are tracked apart, so leaving one channel with
  // the pointer doesn't blank the handle of another that still has focus.
  const [hovered, setHovered] = useState<Channel | null>(null);
  const [focused, setFocused] = useState<Channel | null>(null);
  const active = hovered ?? focused;
  const { contextSafe } = useGSAP({ scope });

  const pull = contextSafe((event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse") return;
    const link = event.currentTarget;
    const bounds = link.getBoundingClientRect();
    gsap.to(link, {
      x: (event.clientX - (bounds.left + bounds.width / 2)) * PULL,
      y: (event.clientY - (bounds.top + bounds.height / 2)) * PULL,
      duration: 0.3,
      ease: "power3.out",
      overwrite: "auto",
    });
  });

  const release = contextSafe((link: HTMLAnchorElement) => {
    gsap.to(link, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.4)",
      overwrite: "auto",
    });
  });

  return (
    <div ref={scope} className={cn("flex flex-col gap-3", className)}>
      <ul
        // list-none drops list semantics in Safari; the role puts them back.
        role="list"
        aria-label="Contact channels"
        className="m-0 flex list-none items-center justify-between gap-4 p-0"
      >
        {CHANNELS.map((channel) => {
          const { name, href, Icon } = channel;
          const isExternal = href.startsWith("http");
          return (
            <li key={name}>
              <a
                href={href}
                aria-label={name}
                {...(isExternal && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                onPointerMove={pull}
                onPointerEnter={() => setHovered(channel)}
                onPointerLeave={(event) => {
                  release(event.currentTarget);
                  setHovered(null);
                }}
                onFocus={() => setFocused(channel)}
                onBlur={() => setFocused(null)}
                className="grid size-12 place-items-center rounded-full border border-border text-icon text-border transition-colors duration-300 hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
              >
                <Icon />
              </a>
            </li>
          );
        })}
      </ul>
      <p
        aria-hidden="true"
        className="m-0 h-5 truncate text-center font-mono text-caption text-subtle"
      >
        {active && (
          <TypedHandle
            key={active.name}
            name={active.name.toLowerCase()}
            text={active.handle}
          />
        )}
      </p>
    </div>
  );
}
