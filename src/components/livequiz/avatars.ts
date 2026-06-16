// @ts-nocheck
import frankSvg  from "@/assets/monsters/frank.svg";
import zappSvg   from "@/assets/monsters/zapp.svg";
import rugzSvg   from "@/assets/monsters/rugz.svg";
import mimiSvg   from "@/assets/monsters/mimi.svg";
import torqSvg   from "@/assets/monsters/torq.svg";
import glixSvg   from "@/assets/monsters/glix.svg";
import beepSvg   from "@/assets/monsters/beep.svg";
import draxSvg   from "@/assets/monsters/drax.svg";
import wibbleSvg from "@/assets/monsters/wibble.svg";
import snookSvg  from "@/assets/monsters/snook.svg";

export type AvatarKey = string;

export const AVATARS: { key: AvatarKey; src: string; label: string }[] = [
  { key: "frank",  src: frankSvg,  label: "Frank"  },
  { key: "zapp",   src: zappSvg,   label: "Zapp"   },
  { key: "rugz",   src: rugzSvg,   label: "Rugz"   },
  { key: "mimi",   src: mimiSvg,   label: "Mimi"   },
  { key: "torq",   src: torqSvg,   label: "Torq"   },
  { key: "glix",   src: glixSvg,   label: "Glix"   },
  { key: "beep",   src: beepSvg,   label: "Beep"   },
  { key: "drax",   src: draxSvg,   label: "Drax"   },
  { key: "wibble", src: wibbleSvg, label: "Wibble" },
  { key: "snook",  src: snookSvg,  label: "Snook"  },
];

export function avatarSrc(key: AvatarKey | null | undefined): string {
  return AVATARS.find((a) => a.key === key)?.src ?? AVATARS[0].src;
}
