import { Easing, FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';

/** Shared, non-bouncy entrances for sheets and pop-ups. */
const EASE_OUT = Easing.out(Easing.cubic);

export const backdropIn = FadeIn.duration(200);

/** Bottom sheet sliding up and settling without overshoot. */
export const sheetIn = SlideInDown.duration(300).easing(EASE_OUT);

/** Centred pop-up: a gentle fade + scale, no overshoot. */
export const popupIn = ZoomIn.duration(260).easing(EASE_OUT);
