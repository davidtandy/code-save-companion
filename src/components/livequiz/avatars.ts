// @ts-nocheck
import iSvg from "@/assets/pronouns/i.svg";
import youSvg from "@/assets/pronouns/you.svg";
import heSvg from "@/assets/pronouns/he.svg";
import sheSvg from "@/assets/pronouns/she.svg";
import theySvg from "@/assets/pronouns/they.svg";
import usSvg from "@/assets/pronouns/us.svg";
import itSvg from "@/assets/pronouns/it.svg";
import yallSvg from "@/assets/pronouns/yall.svg";
import toasterSvg from "@/assets/pronouns/toaster.svg";
import chefHat from "@/assets/poster/chef-hat.svg";
import bicycle from "@/assets/poster/bicycle.svg";
import envelope from "@/assets/poster/envelope.svg";

export type AvatarKey = string;

export const AVATARS: { key: AvatarKey; src: string; label: string }[] = [
  { key: "i", src: iSvg, label: "Ich" },
  { key: "you", src: youSvg, label: "Du" },
  { key: "he", src: heSvg, label: "Er" },
  { key: "she", src: sheSvg, label: "Sie" },
  { key: "it", src: itSvg, label: "Es" },
  { key: "we", src: usSvg, label: "Wir" },
  { key: "yall", src: yallSvg, label: "Ihr" },
  { key: "they", src: theySvg, label: "Sie (pl.)" },
  { key: "toaster", src: toasterSvg, label: "Toaster" },
  { key: "chef", src: chefHat, label: "Chef" },
  { key: "bike", src: bicycle, label: "Fahrrad" },
  { key: "envelope", src: envelope, label: "Brief" },
];

export function avatarSrc(key: AvatarKey | null | undefined): string {
  return AVATARS.find((a) => a.key === key)?.src ?? AVATARS[0].src;
}
