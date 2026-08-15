export const debuggerGroupIds = ["presenters", "contributors", "community"] as const;

export type DebuggerGroupId = (typeof debuggerGroupIds)[number];

export const debuggerSocialPlatforms = ["github", "instagram", "linkedin", "x", "bluesky"] as const;

export type DebuggerSocialPlatform = (typeof debuggerSocialPlatforms)[number];

export type DebuggerSocialLinks = Partial<Record<DebuggerSocialPlatform, string>>;

export type Debugger = {
  avatar: {
    alt: string;
    src: string;
  };
  biography: string;
  id: string;
  name: string;
  roles: readonly string[];
  socialLinks: DebuggerSocialLinks;
};

export type DebuggerGroup = {
  description: string;
  id: DebuggerGroupId;
  members: readonly Debugger[];
  title: string;
};

export type DebuggerSocialLink = {
  href: string;
  platform: DebuggerSocialPlatform;
};

export function getDebuggerSocialLinks(member: Debugger): readonly DebuggerSocialLink[] {
  return debuggerSocialPlatforms.flatMap((platform) => {
    const href = member.socialLinks[platform];
    return href === undefined ? [] : [{ href, platform }];
  });
}
