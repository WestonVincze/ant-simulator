import { trait } from "koota";

export const IsAnt = trait();
export const IsColony = trait();
export const IsFood = trait();

// used to exclude objects from constant position updates
export const Static = trait();

// used to determine when food is in colony
export const InColony = trait();
