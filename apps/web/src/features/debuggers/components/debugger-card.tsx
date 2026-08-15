import Image from "next/image";

import { debuggerSocialPlatforms, getDebuggerSocialLinks } from "../types";
import type { Debugger, DebuggerSocialPlatform } from "../types";

const socialPlatformLabels: Record<DebuggerSocialPlatform, string> = {
  github: "GitHub",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  bluesky: "Bluesky"
};

function SocialIcon({ platform }: { platform: DebuggerSocialPlatform }) {
  if (platform === "github") {
    return (
      <svg aria-hidden className="size-[15px] fill-current" viewBox="0 0 16 16">
        <path d="M8 0C3.6 0 0 3.7 0 8.2c0 3.6 2.3 6.6 5.5 7.7.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.1-.9-1.1-.7-.5.1-.5.1-.5.8.1 1.2.9 1.2.9.7 1.2 1.8.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.5 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.6 4 .3.2.5.7.5 1.4v2.1c0 .2.1.5.5.4A8.2 8.2 0 0 0 16 8.2C16 3.7 12.4 0 8 0Z" />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg aria-hidden className="size-[15px] fill-none stroke-current" strokeWidth="1.5" viewBox="0 0 16 16">
        <rect height="14" rx="4" width="14" x="1" y="1" />
        <circle cx="8" cy="8" r="3.25" />
        <circle className="fill-current stroke-none" cx="12" cy="4" r="0.9" />
      </svg>
    );
  }

  if (platform === "linkedin") {
    return (
      <svg aria-hidden className="size-[15px] fill-current" viewBox="0 0 16 16">
        <path d="M3.6 5.3H.5V16h3.1V5.3ZM2 0C.9 0 .2.7.2 1.7c0 1 .7 1.7 1.8 1.7s1.8-.7 1.8-1.7C3.8.7 3.1 0 2 0Zm13.9 9.9c0-3.3-1.8-4.9-4.1-4.9-1.9 0-2.7 1-3.2 1.8V5.3h-3V16h3.1v-6c0-.3 0-.6.1-.9.2-.6.8-1.2 1.7-1.2 1.2 0 1.7.9 1.7 2.3V16h3.1V9.9Z" />
      </svg>
    );
  }

  if (platform === "x") {
    return (
      <svg aria-hidden className="size-[15px] fill-current" viewBox="0 0 16 16">
        <path d="M12.6 1H15l-5.2 5.9 6.1 8.1h-4.8L7.4 10l-4.5 5H.5l5.6-6.4L.3 1h4.8l3.3 4.4L12.6 1Zm-.8 12.6h1.3L4.4 2.3H3.1l8.7 11.3Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden className="size-[15px] fill-current" viewBox="0 0 16 16">
      <path d="M3.3 1.8C5.1 3.2 7.1 6 8 7.9c.9-1.9 2.9-4.7 4.7-6.1 1.5-1 2.9-.8 2.9 1.6 0 .5-.3 4-.4 4.6-.6 2-2.6 2.5-4.4 2.2 3.2.5 4 2.3 2.2 4.1-3.3 3.4-4.8-.9-5.1-1.9-.1-.2-.1-.3-.1-.2 0-.1 0 0-.1.2-.4 1-1.8 5.3-5.1 1.9-1.8-1.8-.9-3.6 2.2-4.1-1.8.3-3.9-.2-4.4-2.2C.3 7.5 0 4 .3 3.5c0-2.4 1.5-2.7 3-1.7Z" />
    </svg>
  );
}

export function DebuggerCard({ member }: { member: Debugger }) {
  const socialLinks = getDebuggerSocialLinks(member);
  const socialLinkByPlatform = new Map(socialLinks.map((socialLink) => [socialLink.platform, socialLink]));
  const hasVerifiedSocialLink = socialLinks.length > 0;

  return (
    <article className="flex h-full min-w-0 flex-col items-center gap-3.5 rounded-m border border-border bg-card p-7 text-center text-card-foreground">
      <Image alt={member.avatar.alt} className="size-[92px] shrink-0 rounded-pill object-cover" height={92} sizes="92px" src={member.avatar.src} width={92} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="font-secondary text-lg font-semibold leading-[1.25]">{member.name}</h3>
        <p className="font-primary text-[11px] font-semibold leading-[1.4] tracking-[1px] text-primary">{member.roles.join(" · ").toUpperCase()}</p>
      </div>
      <p className="max-w-[34ch] font-secondary text-sm leading-[1.55] text-muted-foreground">{member.biography}</p>
      <div aria-hidden={hasVerifiedSocialLink ? undefined : true} aria-label={hasVerifiedSocialLink ? "Perfis de " + member.name : undefined} className="mt-2 flex flex-wrap justify-center gap-2" role={hasVerifiedSocialLink ? "group" : undefined}>
        {debuggerSocialPlatforms.map((platform) => {
          const socialLink = socialLinkByPlatform.get(platform);
          const label = socialPlatformLabels[platform];

          if (socialLink !== undefined) {
            return (
              <a
                aria-label={label + " de " + member.name}
                className="relative inline-flex size-10 items-center justify-center rounded-pill text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                href={socialLink.href}
                key={platform}
                rel="noreferrer"
                target="_blank"
              >
                <span aria-hidden className="absolute size-[34px] rounded-pill bg-secondary" />
                <span className="relative inline-flex size-[15px]"><SocialIcon platform={platform} /></span>
              </a>
            );
          }

          return (
            <span aria-hidden className="inline-flex size-[34px] items-center justify-center rounded-pill bg-secondary text-muted-foreground" key={platform}>
              <SocialIcon platform={platform} />
            </span>
          );
        })}
      </div>
    </article>
  );
}
