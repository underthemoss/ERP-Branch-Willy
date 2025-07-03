const PIM_BASE_URL = process.env.NEXT_PUBLIC_PIM_URL || "https://staging-pim.estrack.com";

export const getPimCategoryUrl = (categoryId: string) => {
  return `${PIM_BASE_URL}/redirect/category/${categoryId}`;
};

export const getPimProductUrl = (productId: string) => {
  return `${PIM_BASE_URL}/redirect/product/${productId}`;
};

export const getPimMakeUrl = (makeId: string) => {
  return `${PIM_BASE_URL}/redirect/make/${makeId}`;
};
