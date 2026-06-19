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
import globSvg   from "@/assets/monsters/glob.svg";
import krixSvg   from "@/assets/monsters/krix.svg";
import norpSvg   from "@/assets/monsters/norp.svg";
import plixSvg   from "@/assets/monsters/plix.svg";
import fuzzSvg   from "@/assets/monsters/fuzz.svg";
import zorkSvg   from "@/assets/monsters/zork.svg";
import blibSvg   from "@/assets/monsters/blib.svg";
import yoopSvg   from "@/assets/monsters/yoop.svg";
import crunkSvg  from "@/assets/monsters/crunk.svg";
import vexSvg    from "@/assets/monsters/vex.svg";

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
  { key: "glob",   src: globSvg,   label: "Glob"   },
  { key: "krix",   src: krixSvg,   label: "Krix"   },
  { key: "norp",   src: norpSvg,   label: "Norp"   },
  { key: "plix",   src: plixSvg,   label: "Plix"   },
  { key: "fuzz",   src: fuzzSvg,   label: "Fuzz"   },
  { key: "zork",   src: zorkSvg,   label: "Zork"   },
  { key: "blib",   src: blibSvg,   label: "Blib"   },
  { key: "yoop",   src: yoopSvg,   label: "Yoop"   },
  { key: "crunk",  src: crunkSvg,  label: "Crunk"  },
  { key: "vex",    src: vexSvg,    label: "Vex"    },
];

export function avatarSrc(key: AvatarKey | null | undefined): string {
  return AVATARS.find((a) => a.key === key)?.src ?? AVATARS[0].src;
}
