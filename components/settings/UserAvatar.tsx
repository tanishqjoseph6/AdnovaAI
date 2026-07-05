"use client";

type UserAvatarProps = {
  imageUrl?: string | null;
  initials: string;
  className?: string;
  textClassName?: string;
};

export default function UserAvatar({
  imageUrl,
  initials,
  className = "h-11 w-11 rounded-full",
  textClassName = "text-sm font-semibold",
}: UserAvatarProps) {
  const trimmedUrl = imageUrl?.trim();

  if (trimmedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={trimmedUrl}
        alt=""
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-white ${className}`}
      aria-hidden
    >
      <span className={textClassName}>{initials}</span>
    </div>
  );
}
