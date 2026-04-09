export type ApiResponse = {
  status: "success" | "error";
  message: string;
};

export type Motorcycle = {
  id: string;
  chassis: string;
  model: string;
  arrivalDate: Date;
};
