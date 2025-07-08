import { relation } from "koota";

export const Targeting = relation({ exclusive: true });
export const Carrying = relation({ exclusive: true });
export const CarriedBy = relation();
