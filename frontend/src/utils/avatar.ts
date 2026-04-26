export type AvatarValue = string | number | null | undefined;

const DEFAULT_AVATAR_SRC = "/assets/avatars/0.jpg";

export function resolveAvatarSrc(avatar: AvatarValue): string {
  if (avatar === null || avatar === undefined || avatar === "") {
    return DEFAULT_AVATAR_SRC;
  }

  if (typeof avatar === "number") {
    return `/assets/avatars/${avatar}.jpg`;
  }

  if (/^\d+$/.test(avatar)) {
    return `/assets/avatars/${avatar}.jpg`;
  }

  if (avatar.startsWith("data:image/") || avatar.startsWith("http")) {
    return avatar;
  }

  return DEFAULT_AVATAR_SRC;
}
